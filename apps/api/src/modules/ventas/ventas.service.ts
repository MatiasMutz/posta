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
import {
  fromString, add, subtract, multiply, multiplyRatio, toNumericString, ZERO, isNegative,
} from '@posta/money';
import {
  esComprobanteFiscal,
  type CreateVentaDto,
  type ListVentasQuery,
  type ItemVentaDto,
  type TipoComprobanteFiscal,
} from '@posta/validation';

export const FACTURACION_QUEUE = 'facturacion';

export interface FacturacionJobData {
  tenantId: string;
  ventaId: string;
}

interface ItemConSubtotal extends ItemVentaDto {
  subtotal: string;
}

export type ModoReintento = 'automatico' | 'manual';

@Injectable()
export class VentasService {
  private readonly logger = new Logger(VentasService.name);

  constructor(
    @Inject(FACTURADOR_TOKEN) private readonly facturador: FacturadorElectronico,
    @InjectQueue(FACTURACION_QUEUE) private readonly queue: Queue<FacturacionJobData>,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateVentaDto) {
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

    const esFiscal = esComprobanteFiscal(dto.tipo);
    const estadoInicial = esFiscal ? 'pendiente_facturacion' : dto.tipo;

    let clienteCuit: string | null = null;

    const venta = await withTenant(tenantId, async (tx) => {
      if (dto.tipo === 'factura_a') {
        if (!dto.cliente_id) {
          throw new BadRequestException('Seleccioná un cliente con CUIT para emitir Factura A.');
        }
        const [clienteFacturaA] = await tx.select().from(clientes)
          .where(eq(clientes.id, dto.cliente_id))
          .limit(1);
        if (!clienteFacturaA) {
          throw new BadRequestException('Cliente no encontrado.');
        }
        if (!clienteFacturaA.cuit) {
          throw new BadRequestException('Factura A requiere un cliente con CUIT cargado.');
        }
        clienteCuit = clienteFacturaA.cuit;
      }

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

          if (!producto) {
            throw new BadRequestException(
              `Producto no encontrado para "${item.descripcion}".`,
            );
          }
          if (!producto.activo) {
            throw new BadRequestException(
              `El producto "${producto.nombre}" no está activo y no se puede vender.`,
            );
          }

          const stockAnterior = producto.stock_actual;
          const cantidadEntero = item.cantidad;

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
      await this.intentarFacturacionInicial(tenantId, venta.id, dto, total, clienteCuit);
    }

    return this.findOne(tenantId, venta.id);
  }

  private async intentarFacturacionInicial(
    tenantId: string,
    ventaId: string,
    dto: CreateVentaDto,
    total: string,
    clienteCuit: string | null,
  ) {
    const itemsPayload = dto.items.map((i) => ({
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precioUnitario: i.precio_unitario,
      subtotal: toNumericString(multiply(fromString(i.precio_unitario), i.cantidad)),
    }));

    try {
      await this.intentarEmitirComprobante(
        tenantId,
        ventaId,
        dto.tipo as TipoComprobanteFiscal,
        total,
        itemsPayload,
        1,
        clienteCuit,
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

  /** Llama AFIP y persiste facturado. Lanza si AFIP falla. */
  async intentarEmitirComprobante(
    tenantId: string,
    ventaId: string,
    tipo: TipoComprobanteFiscal,
    total: string,
    items: Array<{
      descripcion: string;
      cantidad: number;
      precioUnitario: string;
      subtotal: string;
    }>,
    intentosFacturacion: number,
    clienteCuit: string | null = null,
  ) {
    const resultado = await this.facturador.emitirComprobante({
      ventaId,
      tipo,
      total,
      clienteCuit,
      items,
    });

    await withTenant(tenantId, (tx) =>
      tx.update(ventas).set({
        estado: 'facturado',
        cae: resultado.cae,
        cae_vencimiento: resultado.caeVencimiento.toISOString().slice(0, 10),
        numero_comprobante: resultado.numeroComprobante,
        intentos_facturacion: intentosFacturacion,
        updated_at: new Date(),
      }).where(eq(ventas.id, ventaId)),
    );

    return resultado;
  }

  /** Reintento automático (BullMQ): mantiene pendiente_facturacion si falla. */
  async reintentarAutomatico(tenantId: string, ventaId: string) {
    return this.ejecutarReintento(tenantId, ventaId, 'automatico');
  }

  /** Reintento manual (dueño): desde error_afip; fallo → error_afip definitivo. */
  async reintentarManual(tenantId: string, ventaId: string) {
    return this.ejecutarReintento(tenantId, ventaId, 'manual');
  }

  private async ejecutarReintento(tenantId: string, ventaId: string, modo: ModoReintento) {
    const [venta] = await withTenant(tenantId, (tx) =>
      tx.select().from(ventas).where(eq(ventas.id, ventaId)).limit(1),
    );
    if (!venta) throw new NotFoundException('Venta no encontrada.');
    if (venta.estado === 'facturado') throw new BadRequestException('La venta ya está facturada.');

    if (modo === 'automatico' && venta.estado !== 'pendiente_facturacion') {
      throw new BadRequestException('Solo se reintenta automáticamente en estado pendiente de facturación.');
    }
    if (modo === 'manual' && venta.estado !== 'pendiente_facturacion' && venta.estado !== 'error_afip') {
      throw new BadRequestException('Solo se pueden reintentar ventas en estado pendiente o error AFIP.');
    }

    const items = await withTenant(tenantId, (tx) =>
      tx.select().from(itemsVenta).where(eq(itemsVenta.venta_id, ventaId)),
    );

    let clienteCuit: string | null = null;
    if (venta.tipo === 'factura_a' && venta.cliente_id) {
      const [cliente] = await withTenant(tenantId, (tx) =>
        tx.select({ cuit: clientes.cuit }).from(clientes)
          .where(eq(clientes.id, venta.cliente_id!))
          .limit(1),
      );
      clienteCuit = cliente?.cuit ?? null;
    }

    const itemsPayload = items.map((i) => ({
      descripcion: i.descripcion,
      cantidad: Number(i.cantidad),
      precioUnitario: i.precio_unitario,
      subtotal: i.subtotal,
    }));

    const siguienteIntento = (venta.intentos_facturacion ?? 0) + 1;

    try {
      const resultado = await this.intentarEmitirComprobante(
        tenantId,
        ventaId,
        venta.tipo as TipoComprobanteFiscal,
        venta.total,
        itemsPayload,
        siguienteIntento,
        clienteCuit,
      );
      return { facturado: true, cae: resultado.cae };
    } catch {
      if (modo === 'automatico') {
        await withTenant(tenantId, (tx) =>
          tx.update(ventas).set({
            estado: 'pendiente_facturacion',
            intentos_facturacion: siguienteIntento,
            updated_at: new Date(),
          }).where(eq(ventas.id, ventaId)),
        );
        throw new Error('AFIP no respondió. Se reintentará automáticamente.');
      }

      await withTenant(tenantId, (tx) =>
        tx.update(ventas).set({
          estado: 'error_afip',
          intentos_facturacion: siguienteIntento,
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
        inArray(ventas.tipo, ['factura_b', 'factura_a', 'factura_c', 'ticket']),
        eq(ventas.estado, 'facturado'),
      ];
      if (query.desde) conditions.push(gte(ventas.created_at, new Date(query.desde)));
      if (query.hasta) conditions.push(lte(ventas.created_at, new Date(`${query.hasta}T23:59:59Z`)));

      return tx.select().from(ventas).where(and(...conditions))
        .orderBy(ventas.created_at);
    });

    const etiquetaTipo: Record<string, string> = {
      factura_b: 'Factura B',
      factura_a: 'Factura A',
      factura_c: 'Factura C',
      ticket: 'Ticket',
    };

    const data = rows.map((v) => {
      const total = fromString(v.total);
      const exento = v.tipo === 'factura_c';
      const iva = exento ? ZERO : multiplyRatio(total, 21n, 121n);
      const neto = exento ? total : subtract(total, iva);
      const fecha = new Date(v.created_at);
      return {
        Fecha: `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`,
        Tipo: etiquetaTipo[v.tipo] ?? v.tipo,
        'Nro. Comprobante': v.numero_comprobante ?? '',
        CAE: v.cae ?? '',
        Estado: v.estado,
        'Neto gravado': toNumericString(neto),
        'IVA 21%': toNumericString(iva),
        Total: v.total,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IVA Ventas');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }
}
