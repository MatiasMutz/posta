import {
  Injectable, NotFoundException, BadRequestException, Logger, Inject,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { and, count, desc, eq, gte, lte, inArray } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { withTenant } from '../../db';
import { ventas, itemsVenta, productos, movimientosStock, clientes } from '../../db/schema';
import { respuestaPaginada } from '../../common/pagination';
import { FACTURADOR_TOKEN } from '../afip/facturador.interface';
import type { FacturadorElectronico } from '../afip/facturador.interface';
import { fromString, add, subtract, multiply, toNumericString, ZERO, isNegative } from '@posta/money';
import type { CreateVentaDto, ListVentasQuery, ItemVentaDto } from '@posta/validation';

export const FACTURACION_QUEUE = 'facturacion';

export interface FacturacionJobData {
  tenantId: string;
  ventaId: string;
}

interface ItemConSubtotal extends ItemVentaDto {
  subtotal: string;
}

@Injectable()
export class VentasService {
  private readonly logger = new Logger(VentasService.name);

  constructor(
    @Inject(FACTURADOR_TOKEN) private readonly facturador: FacturadorElectronico,
    @InjectQueue(FACTURACION_QUEUE) private readonly queue: Queue<FacturacionJobData>,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateVentaDto) {
    // Calcular subtotales usando el paquete money (sin float drift)
    const itemsConSubtotal: ItemConSubtotal[] = dto.items.map((item) => ({
      ...item,
      subtotal: toNumericString(multiply(fromString(item.precio_unitario), item.cantidad)),
    }));

    const subtotalMoney = itemsConSubtotal.reduce(
      (acc, i) => add(acc, fromString(i.subtotal)),
      ZERO,
    );
    const descuentoMoney = fromString(dto.descuento ?? '0');
    const totalMoney = subtract(subtotalMoney, descuentoMoney);

    if (isNegative(totalMoney)) {
      throw new BadRequestException('El descuento no puede ser mayor al subtotal.');
    }

    const subtotal = toNumericString(subtotalMoney);
    const descuento = toNumericString(descuentoMoney);
    const total = toNumericString(totalMoney);

    const esFiscal = dto.tipo === 'factura_b' || dto.tipo === 'factura_a';
    const estadoInicial = esFiscal ? 'pendiente_facturacion' : dto.tipo;

    const venta = await withTenant(tenantId, async (tx) => {
      const [nuevaVenta] = await tx.insert(ventas).values({
        tenant_id: tenantId,
        cliente_id: dto.cliente_id ?? null,
        tipo: dto.tipo,
        estado: estadoInicial as typeof ventas.$inferInsert['estado'],
        metodo_pago: dto.metodo_pago,
        subtotal,
        descuento,
        total,
        observaciones: dto.observaciones ?? null,
        created_by: userId,
      }).returning();

      for (const item of itemsConSubtotal) {
        await tx.insert(itemsVenta).values({
          tenant_id: tenantId,
          venta_id: nuevaVenta.id,
          producto_id: item.producto_id ?? null,
          descripcion: item.descripcion,
          cantidad: String(item.cantidad),
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
        });

        if (item.producto_id) {
          const [producto] = await tx.select()
            .from(productos)
            .where(eq(productos.id, item.producto_id))
            .limit(1);

          if (producto) {
            const stockAnterior = producto.stock_actual;
            const cantidadEntero = Math.round(item.cantidad);

            // Stock insuficiente → error descriptivo; no permite vender en negativo
            if (stockAnterior < cantidadEntero) {
              throw new BadRequestException(
                `Stock insuficiente para "${producto.nombre}". Disponible: ${stockAnterior}, solicitado: ${cantidadEntero}.`,
              );
            }

            const stockPosterior = stockAnterior - cantidadEntero;
            await tx.update(productos)
              .set({ stock_actual: stockPosterior })
              .where(eq(productos.id, item.producto_id));

            await tx.insert(movimientosStock).values({
              tenant_id: tenantId,
              producto_id: item.producto_id,
              tipo: 'salida',
              cantidad: cantidadEntero,
              stock_anterior: stockAnterior,
              stock_posterior: stockPosterior,
              motivo: `Venta #${nuevaVenta.id.slice(0, 8)}`,
              created_by: userId,
            });
          }
        }
      }

      // Actualizar cuenta corriente del cliente si el método de pago es cuenta_corriente
      if (dto.cliente_id && dto.metodo_pago === 'cuenta_corriente') {
        const [cliente] = await tx.select().from(clientes).where(eq(clientes.id, dto.cliente_id)).limit(1);
        if (cliente) {
          const nuevoSaldo = toNumericString(add(fromString(cliente.saldo_deudor), fromString(total)));
          await tx.update(clientes)
            .set({ saldo_deudor: nuevoSaldo, updated_at: new Date() })
            .where(eq(clientes.id, dto.cliente_id));
        }
      }

      return nuevaVenta;
    });

    if (esFiscal) {
      await this.intentarFacturacion(tenantId, venta.id, dto, total);
    }

    return this.findOne(tenantId, venta.id);
  }

  private async intentarFacturacion(
    tenantId: string,
    ventaId: string,
    dto: CreateVentaDto,
    total: string,
  ) {
    try {
      const resultado = await this.facturador.emitirComprobante({
        ventaId,
        tipo: dto.tipo as 'factura_b' | 'factura_a',
        total,
        clienteCuit: null,
        items: dto.items.map((i) => ({
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUnitario: i.precio_unitario,
          subtotal: toNumericString(multiply(fromString(i.precio_unitario), i.cantidad)),
        })),
      });

      await withTenant(tenantId, (tx) =>
        tx.update(ventas).set({
          estado: 'facturado',
          cae: resultado.cae,
          cae_vencimiento: resultado.caeVencimiento.toISOString().slice(0, 10),
          numero_comprobante: resultado.numeroComprobante,
          intentos_facturacion: 1,
          updated_at: new Date(),
        }).where(eq(ventas.id, ventaId)),
      );
    } catch {
      this.logger.warn(`AFIP falló para venta ${ventaId}. Encolando reintento.`);
      await withTenant(tenantId, (tx) =>
        tx.update(ventas).set({ intentos_facturacion: 1, updated_at: new Date() })
          .where(eq(ventas.id, ventaId)),
      );
      await this.queue.add(
        'reintentar',
        { tenantId, ventaId },
        { attempts: 3, backoff: { type: 'exponential', delay: 60_000 } },
      );
    }
  }

  async reintentar(tenantId: string, ventaId: string) {
    const [venta] = await withTenant(tenantId, (tx) =>
      tx.select().from(ventas).where(eq(ventas.id, ventaId)).limit(1),
    );
    if (!venta) throw new NotFoundException('Venta no encontrada.');
    if (venta.estado === 'facturado') throw new BadRequestException('La venta ya está facturada.');
    if (venta.estado !== 'pendiente_facturacion' && venta.estado !== 'error_afip') {
      throw new BadRequestException('Solo se pueden reintentar ventas en estado pendiente o error AFIP.');
    }

    const items = await withTenant(tenantId, (tx) =>
      tx.select().from(itemsVenta).where(eq(itemsVenta.venta_id, ventaId)),
    );

    try {
      const resultado = await this.facturador.emitirComprobante({
        ventaId,
        tipo: venta.tipo as 'factura_b' | 'factura_a',
        total: venta.total,
        clienteCuit: null,
        items: items.map((i) => ({
          descripcion: i.descripcion,
          cantidad: parseFloat(i.cantidad),
          precioUnitario: i.precio_unitario,
          subtotal: i.subtotal,
        })),
      });

      await withTenant(tenantId, (tx) =>
        tx.update(ventas).set({
          estado: 'facturado',
          cae: resultado.cae,
          cae_vencimiento: resultado.caeVencimiento.toISOString().slice(0, 10),
          numero_comprobante: resultado.numeroComprobante,
          intentos_facturacion: (venta.intentos_facturacion ?? 0) + 1,
          updated_at: new Date(),
        }).where(eq(ventas.id, ventaId)),
      );

      return { facturado: true, cae: resultado.cae };
    } catch {
      await withTenant(tenantId, (tx) =>
        tx.update(ventas).set({
          estado: 'error_afip',
          intentos_facturacion: (venta.intentos_facturacion ?? 0) + 1,
          updated_at: new Date(),
        }).where(eq(ventas.id, ventaId)),
      );
      throw new BadRequestException('AFIP sigue sin responder. La venta quedó como error AFIP.');
    }
  }

  async findAll(tenantId: string, query: ListVentasQuery) {
    return withTenant(tenantId, async (tx) => {
      const conditions = [];
      if (query.estado) conditions.push(eq(ventas.estado, query.estado as never));
      if (query.desde) conditions.push(gte(ventas.created_at, new Date(query.desde)));
      if (query.hasta) conditions.push(lte(ventas.created_at, new Date(`${query.hasta}T23:59:59Z`)));
      if (query.cliente_id) conditions.push(eq(ventas.cliente_id, query.cliente_id));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, [{ total }]] = await Promise.all([
        tx.select().from(ventas).where(where)
          .orderBy(desc(ventas.created_at))
          .limit(query.limite)
          .offset((query.pagina - 1) * query.limite),
        tx.select({ total: count() }).from(ventas).where(where),
      ]);

      return respuestaPaginada(rows, query.pagina, query.limite, total);
    });
  }

  async findOne(tenantId: string, id: string) {
    const [venta] = await withTenant(tenantId, (tx) =>
      tx.select().from(ventas).where(eq(ventas.id, id)).limit(1),
    );
    if (!venta) throw new NotFoundException('Venta no encontrada.');

    const items = await withTenant(tenantId, (tx) =>
      tx.select().from(itemsVenta).where(eq(itemsVenta.venta_id, id)),
    );

    return { ...venta, items };
  }

  async exportarIvaVentas(
    tenantId: string,
    query: { desde?: string; hasta?: string },
  ): Promise<Buffer> {
    const rows = await withTenant(tenantId, async (tx) => {
      const conditions = [
        inArray(ventas.tipo, ['factura_b', 'factura_a']),
      ];
      if (query.desde) conditions.push(gte(ventas.created_at, new Date(query.desde)));
      if (query.hasta) conditions.push(lte(ventas.created_at, new Date(`${query.hasta}T23:59:59Z`)));

      return tx.select().from(ventas).where(and(...conditions))
        .orderBy(ventas.created_at);
    });

    const data = rows.map((v) => {
      const totalNum = parseFloat(v.total);
      // IVA incluido en factura B: IVA = total × 21/121
      const iva = (totalNum * 21 / 121).toFixed(2);
      const neto = (totalNum - parseFloat(iva)).toFixed(2);
      const fecha = new Date(v.created_at);
      return {
        Fecha: `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`,
        Tipo: v.tipo === 'factura_b' ? 'Factura B' : 'Factura A',
        'Nro. Comprobante': v.numero_comprobante ?? '',
        CAE: v.cae ?? '',
        Estado: v.estado,
        'Neto gravado': neto,
        'IVA 21%': iva,
        Total: v.total,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IVA Ventas');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }
}
