import { Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, ilike, lte } from 'drizzle-orm';
import { withTenant } from '../../../db';
import { productos, movimientosStock } from '../../../db/schema';
import type { ResultadoPaginado } from '../../../common/pagination';
import type { Rol } from '@posta/shared-types';
import type {
  CreateProductoDto,
  UpdateProductoDto,
  ListProductosQuery,
} from '@posta/validation';

function condicionesListadoProductos(query: ListProductosQuery) {
  const conditions = [eq(productos.activo, true)];

  if (query.solo_bajo_stock) {
    conditions.push(lte(productos.stock_actual, productos.stock_minimo));
  }
  if (query.buscar) {
    conditions.push(ilike(productos.nombre, `%${query.buscar}%`));
  }

  return and(...conditions);
}

@Injectable()
export class ProductosService {
  async findAll(
    tenantId: string,
    query: ListProductosQuery,
    rol?: Rol,
  ): Promise<ResultadoPaginado<(typeof productos.$inferSelect) | Omit<(typeof productos.$inferSelect), 'costo'>>> {
    const resultado = await withTenant(tenantId, async (tx) => {
      const where = condicionesListadoProductos(query);

      const [rows, [{ total }]] = await Promise.all([
        tx
          .select()
          .from(productos)
          .where(where)
          .orderBy(productos.nombre)
          .limit(query.limite)
          .offset((query.pagina - 1) * query.limite),
        tx.select({ total: count() }).from(productos).where(where),
      ]);

      return { items: rows, total };
    });

    // skill money + regla de roles: solo dueño recibe costo
    if (rol !== 'dueno') {
      return {
        items: resultado.items.map(({ costo: _costo, ...rest }) => rest),
        total: resultado.total,
      };
    }
    return resultado;
  }

  async findOne(tenantId: string, id: string, rol?: Rol) {
    const [row] = await withTenant(tenantId, (tx) =>
      tx.select().from(productos).where(eq(productos.id, id)).limit(1),
    );

    if (!row || !row.activo) throw new NotFoundException('Producto no encontrado');

    if (rol !== 'dueno') {
      const { costo: _costo, ...rest } = row;
      return rest;
    }
    return row;
  }

  async create(tenantId: string, userId: string, dto: CreateProductoDto) {
    return withTenant(tenantId, async (tx) => {
      const [producto] = await tx
        .insert(productos)
        .values({
          tenant_id: tenantId,
          nombre: dto.nombre,
          sku: dto.sku ?? null,
          codigo_barras: dto.codigo_barras ?? null,
          costo: dto.costo,
          precio: dto.precio,
          stock_actual: dto.stock_inicial ?? 0,
          stock_minimo: dto.stock_minimo ?? 0,
          created_by: userId,
        })
        .returning();

      // Registrar movimiento de entrada inicial si hay stock
      if ((dto.stock_inicial ?? 0) > 0) {
        await tx
          .insert(movimientosStock)
          .values({
            tenant_id: tenantId,
            producto_id: producto.id,
            tipo: 'entrada',
            cantidad: dto.stock_inicial!,
            stock_anterior: 0,
            stock_posterior: dto.stock_inicial!,
            motivo: 'Stock inicial',
            created_by: userId,
          })
          .returning();
      }

      return producto;
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProductoDto) {
    return withTenant(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(productos)
        .where(eq(productos.id, id))
        .limit(1);

      if (!existing || !existing.activo) throw new NotFoundException('Producto no encontrado');

      const [updated] = await tx
        .update(productos)
        .set({
          ...(dto.nombre !== undefined && { nombre: dto.nombre }),
          ...(dto.sku !== undefined && { sku: dto.sku }),
          ...(dto.codigo_barras !== undefined && { codigo_barras: dto.codigo_barras }),
          ...(dto.costo !== undefined && { costo: dto.costo }),
          ...(dto.precio !== undefined && { precio: dto.precio }),
          ...(dto.stock_minimo !== undefined && { stock_minimo: dto.stock_minimo }),
        })
        .where(eq(productos.id, id))
        .returning();

      return updated;
    });
  }

  async remove(tenantId: string, id: string) {
    return withTenant(tenantId, async (tx) => {
      const [existing] = await tx
        .select()
        .from(productos)
        .where(eq(productos.id, id))
        .limit(1);

      if (!existing || !existing.activo) throw new NotFoundException('Producto no encontrado');

      await tx
        .update(productos)
        .set({ activo: false })
        .where(eq(productos.id, id))
        .returning();
    });
  }
}
