import { Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, ilike, or } from 'drizzle-orm';
import { withTenant } from '../../../db';
import { proveedores } from '../../../db/schema';
import { respuestaPaginada } from '../../../common/pagination';
import type { CreateProveedorDto, UpdateProveedorDto, ListProveedoresQuery } from '@posta/validation';

@Injectable()
export class ProveedoresService {
  async findAll(tenantId: string, query: ListProveedoresQuery) {
    return withTenant(tenantId, async (tx) => {
      const where = query.buscar
        ? and(
            eq(proveedores.activo, true),
            or(
              ilike(proveedores.nombre, `%${query.buscar}%`),
              ilike(proveedores.email, `%${query.buscar}%`),
            ),
          )
        : eq(proveedores.activo, true);

      const [rows, [{ total }]] = await Promise.all([
        tx.select().from(proveedores).where(where)
          .orderBy(proveedores.nombre)
          .limit(query.limite)
          .offset((query.pagina - 1) * query.limite),
        tx.select({ total: count() }).from(proveedores).where(where),
      ]);

      return respuestaPaginada(rows, query.pagina, query.limite, total);
    });
  }

  async findOne(tenantId: string, id: string) {
    const [row] = await withTenant(tenantId, (tx) =>
      tx.select().from(proveedores).where(eq(proveedores.id, id)).limit(1),
    );
    if (!row || !row.activo) throw new NotFoundException('Proveedor no encontrado.');
    return row;
  }

  async create(tenantId: string, userId: string, dto: CreateProveedorDto) {
    const [row] = await withTenant(tenantId, (tx) =>
      tx.insert(proveedores).values({
        tenant_id: tenantId,
        nombre: dto.nombre,
        email: dto.email ?? null,
        telefono: dto.telefono ?? null,
        cuit: dto.cuit ?? null,
        direccion: dto.direccion ?? null,
        created_by: userId,
      }).returning(),
    );
    return row;
  }

  async update(tenantId: string, id: string, dto: UpdateProveedorDto) {
    const [existing] = await withTenant(tenantId, (tx) =>
      tx.select().from(proveedores).where(eq(proveedores.id, id)).limit(1),
    );
    if (!existing || !existing.activo) throw new NotFoundException('Proveedor no encontrado.');

    const [updated] = await withTenant(tenantId, (tx) =>
      tx.update(proveedores).set({
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono }),
        ...(dto.cuit !== undefined && { cuit: dto.cuit }),
        ...(dto.direccion !== undefined && { direccion: dto.direccion }),
        updated_at: new Date(),
      }).where(eq(proveedores.id, id)).returning(),
    );
    return updated;
  }
}
