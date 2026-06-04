import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { withTenant } from '../../../db';
import {
  compras, itemsCompra, proveedores, productos, movimientosStock,
} from '../../../db/schema';
import { respuestaPaginada } from '../../../common/pagination';
import {
  fromString, add, subtract, multiply, multiplyRatio, toNumericString, ZERO, isNegative,
} from '@posta/money';
import {
  TIPOS_COMPROBANTE_IVA_COMPRAS,
  type CreateCompraDto,
  type ListComprasQuery,
  type ItemCompraDto,
} from '@posta/validation';

interface ItemConSubtotal extends ItemCompraDto {
  subtotal: string;
}

@Injectable()
export class ComprasService {
  async create(tenantId: string, userId: string, dto: CreateCompraDto) {
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

    const compra = await withTenant(tenantId, async (tx) => {
      if (dto.proveedor_id) {
        const [prov] = await tx.select().from(proveedores)
          .where(eq(proveedores.id, dto.proveedor_id))
          .limit(1);
        if (!prov || !prov.activo) {
          throw new BadRequestException('Proveedor no encontrado.');
        }
      }

      const [nuevaCompra] = await tx.insert(compras).values({
        tenant_id: tenantId,
        proveedor_id: dto.proveedor_id ?? null,
        categoria: dto.categoria,
        tipo_comprobante: dto.tipo_comprobante,
        metodo_pago: dto.metodo_pago,
        subtotal,
        descuento,
        total,
        numero_comprobante: dto.numero_comprobante ?? null,
        observaciones: dto.observaciones ?? null,
        created_by: userId,
      }).returning();

      for (const item of itemsConSubtotal) {
        await tx.insert(itemsCompra).values({
          tenant_id: tenantId,
          compra_id: nuevaCompra.id,
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
              `El producto "${producto.nombre}" no está activo.`,
            );
          }

          const stockAnterior = producto.stock_actual;
          const cantidadEntero = item.cantidad;
          const stockPosterior = stockAnterior + cantidadEntero;

          await tx.update(productos)
            .set({
              stock_actual: stockPosterior,
              costo: item.precio_unitario,
              updated_at: new Date(),
            })
            .where(eq(productos.id, item.producto_id));

          await tx.insert(movimientosStock).values({
            tenant_id: tenantId,
            producto_id: item.producto_id,
            tipo: 'entrada',
            cantidad: cantidadEntero,
            stock_anterior: stockAnterior,
            stock_posterior: stockPosterior,
            motivo: `Compra #${nuevaCompra.id.slice(0, 8)}`,
            created_by: userId,
          });
        }
      }

      if (dto.proveedor_id && dto.metodo_pago === 'cuenta_corriente') {
        const [prov] = await tx.select().from(proveedores)
          .where(eq(proveedores.id, dto.proveedor_id))
          .limit(1);
        if (prov) {
          const nuevoSaldo = toNumericString(add(fromString(prov.saldo_acreedor), fromString(total)));
          await tx.update(proveedores)
            .set({ saldo_acreedor: nuevoSaldo, updated_at: new Date() })
            .where(eq(proveedores.id, dto.proveedor_id));
        }
      }

      return nuevaCompra;
    });

    return this.findOne(tenantId, compra.id);
  }

  async findAll(tenantId: string, query: ListComprasQuery) {
    return withTenant(tenantId, async (tx) => {
      const conditions = [];
      if (query.categoria) conditions.push(eq(compras.categoria, query.categoria));
      if (query.proveedor_id) conditions.push(eq(compras.proveedor_id, query.proveedor_id));
      if (query.desde) conditions.push(gte(compras.created_at, new Date(query.desde)));
      if (query.hasta) conditions.push(lte(compras.created_at, new Date(`${query.hasta}T23:59:59Z`)));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, [{ total }]] = await Promise.all([
        tx.select({
          id: compras.id,
          proveedor_id: compras.proveedor_id,
          proveedor_nombre: proveedores.nombre,
          categoria: compras.categoria,
          tipo_comprobante: compras.tipo_comprobante,
          metodo_pago: compras.metodo_pago,
          subtotal: compras.subtotal,
          descuento: compras.descuento,
          total: compras.total,
          numero_comprobante: compras.numero_comprobante,
          created_at: compras.created_at,
        })
          .from(compras)
          .leftJoin(proveedores, eq(compras.proveedor_id, proveedores.id))
          .where(where)
          .orderBy(desc(compras.created_at))
          .limit(query.limite)
          .offset((query.pagina - 1) * query.limite),
        tx.select({ total: count() }).from(compras).where(where),
      ]);

      return respuestaPaginada(rows, query.pagina, query.limite, total);
    });
  }

  async findOne(tenantId: string, id: string) {
    const [compra] = await withTenant(tenantId, async (tx) => {
      const rows = await tx.select({
        id: compras.id,
        proveedor_id: compras.proveedor_id,
        proveedor_nombre: proveedores.nombre,
        categoria: compras.categoria,
        tipo_comprobante: compras.tipo_comprobante,
        metodo_pago: compras.metodo_pago,
        subtotal: compras.subtotal,
        descuento: compras.descuento,
        total: compras.total,
        numero_comprobante: compras.numero_comprobante,
        observaciones: compras.observaciones,
        created_at: compras.created_at,
      })
        .from(compras)
        .leftJoin(proveedores, eq(compras.proveedor_id, proveedores.id))
        .where(eq(compras.id, id))
        .limit(1);
      return rows;
    });

    if (!compra) throw new NotFoundException('Compra no encontrada.');

    const items = await withTenant(tenantId, (tx) =>
      tx.select({
        id: itemsCompra.id,
        producto_id: itemsCompra.producto_id,
        descripcion: itemsCompra.descripcion,
        cantidad: itemsCompra.cantidad,
        precio_unitario: itemsCompra.precio_unitario,
        subtotal: itemsCompra.subtotal,
      }).from(itemsCompra).where(eq(itemsCompra.compra_id, id)),
    );

    return { ...compra, items };
  }

  async exportarIvaCompras(
    tenantId: string,
    query: { desde?: string; hasta?: string },
  ): Promise<Buffer> {
    const rows = await withTenant(tenantId, async (tx) => {
      const conditions = [
        inArray(compras.tipo_comprobante, [...TIPOS_COMPROBANTE_IVA_COMPRAS]),
      ];
      if (query.desde) conditions.push(gte(compras.created_at, new Date(query.desde)));
      if (query.hasta) conditions.push(lte(compras.created_at, new Date(`${query.hasta}T23:59:59Z`)));

      return tx.select({
        created_at: compras.created_at,
        tipo_comprobante: compras.tipo_comprobante,
        numero_comprobante: compras.numero_comprobante,
        categoria: compras.categoria,
        total: compras.total,
        proveedor_nombre: proveedores.nombre,
        proveedor_cuit: proveedores.cuit,
      })
        .from(compras)
        .leftJoin(proveedores, eq(compras.proveedor_id, proveedores.id))
        .where(and(...conditions))
        .orderBy(compras.created_at);
    });

    const etiquetaTipo: Record<string, string> = {
      factura_b: 'Factura B',
      factura_a: 'Factura A',
      ticket: 'Ticket',
    };

    const data = rows.map((c) => {
      const total = fromString(c.total);
      const iva = multiplyRatio(total, 21n, 121n);
      const neto = subtract(total, iva);
      const fecha = new Date(c.created_at);
      return {
        Fecha: `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`,
        Proveedor: c.proveedor_nombre ?? '',
        CUIT: c.proveedor_cuit ?? '',
        Tipo: etiquetaTipo[c.tipo_comprobante] ?? c.tipo_comprobante,
        Categoría: c.categoria === 'gasto' ? 'Gasto' : 'Compra',
        'Nro. Comprobante': c.numero_comprobante ?? '',
        'Neto gravado': toNumericString(neto),
        'IVA 21%': toNumericString(iva),
        Total: c.total,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IVA Compras');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }
}
