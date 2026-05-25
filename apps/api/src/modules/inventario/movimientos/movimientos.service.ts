import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { withTenant } from '../../../db';
import { productos, movimientosStock } from '../../../db/schema';
import type { ResultadoPaginado } from '../../../common/pagination';
import type { MovimientoStockDto } from '@posta/validation';

@Injectable()
export class MovimientosService {
  async registrar(
    tenantId: string,
    userId: string,
    productoId: string,
    dto: MovimientoStockDto,
  ) {
    return withTenant(tenantId, async (tx) => {
      const [producto] = await tx
        .select()
        .from(productos)
        .where(eq(productos.id, productoId))
        .limit(1);

      if (!producto || !producto.activo) throw new NotFoundException('Producto no encontrado');

      const stockAnterior = producto.stock_actual;
      let stockPosterior: number;

      if (dto.tipo === 'entrada') {
        stockPosterior = stockAnterior + dto.cantidad;
      } else if (dto.tipo === 'salida') {
        if (stockAnterior - dto.cantidad < 0) {
          throw new BadRequestException(
            `Stock insuficiente. Disponible: ${stockAnterior}, solicitado: ${dto.cantidad}`,
          );
        }
        stockPosterior = stockAnterior - dto.cantidad;
      } else {
        // ajuste: la cantidad es el nuevo stock absoluto
        stockPosterior = dto.cantidad;
      }

      await tx
        .update(productos)
        .set({ stock_actual: stockPosterior })
        .where(eq(productos.id, productoId))
        .returning();

      const [movimiento] = await tx
        .insert(movimientosStock)
        .values({
          tenant_id: tenantId,
          producto_id: productoId,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          stock_anterior: stockAnterior,
          stock_posterior: stockPosterior,
          motivo: dto.motivo ?? null,
          created_by: userId,
        })
        .returning();

      return movimiento;
    });
  }

  async listar(
    tenantId: string,
    productoId: string,
    query: { pagina: number; limite: number },
  ): Promise<ResultadoPaginado<typeof movimientosStock.$inferSelect>> {
    return withTenant(tenantId, async (tx) => {
      const [producto] = await tx
        .select()
        .from(productos)
        .where(eq(productos.id, productoId))
        .limit(1);

      if (!producto) throw new NotFoundException('Producto no encontrado');

      const where = eq(movimientosStock.producto_id, productoId);

      const [items, [{ total }]] = await Promise.all([
        tx
          .select()
          .from(movimientosStock)
          .where(where)
          .orderBy(desc(movimientosStock.created_at))
          .limit(query.limite)
          .offset((query.pagina - 1) * query.limite),
        tx.select({ total: count() }).from(movimientosStock).where(where),
      ]);

      return { items, total };
    });
  }
}
