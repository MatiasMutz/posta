import { Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, ilike, or } from 'drizzle-orm';
import { withTenant } from '../../db';
import { clientes } from '../../db/schema';
import { respuestaPaginada } from '../../common/pagination';
import { PaginacionSchema } from '@posta/validation';
import type { CreateClienteDto, UpdateClienteDto } from '@posta/validation';
import type { z } from 'zod';

type ListClientesQuery = z.infer<typeof PaginacionSchema> & {
  buscar?: string;
};

@Injectable()
export class ClientesService {
  async findAll(tenantId: string, query: ListClientesQuery) {
    return withTenant(tenantId, async (tx) => {
      const where = query.buscar
        ? and(
            eq(clientes.activo, true),
            or(
              ilike(clientes.nombre, `%${query.buscar}%`),
              ilike(clientes.email, `%${query.buscar}%`),
            ),
          )
        : eq(clientes.activo, true);

      const [rows, [{ total }]] = await Promise.all([
        tx.select().from(clientes).where(where)
          .orderBy(clientes.nombre)
          .limit(query.limite)
          .offset((query.pagina - 1) * query.limite),
        tx.select({ total: count() }).from(clientes).where(where),
      ]);

      return respuestaPaginada(rows, query.pagina, query.limite, total);
    });
  }

  async findOne(tenantId: string, id: string) {
    const [row] = await withTenant(tenantId, (tx) =>
      tx.select().from(clientes).where(eq(clientes.id, id)).limit(1),
    );
    if (!row || !row.activo) throw new NotFoundException('Cliente no encontrado.');
    return row;
  }

  async create(tenantId: string, dto: CreateClienteDto) {
    const [row] = await withTenant(tenantId, (tx) =>
      tx.insert(clientes).values({
        tenant_id: tenantId,
        nombre: dto.nombre,
        email: dto.email ?? null,
        telefono: dto.telefono ?? null,
        cuit: dto.cuit ?? null,
        direccion: dto.direccion ?? null,
      }).returning(),
    );
    return row;
  }

  async update(tenantId: string, id: string, dto: UpdateClienteDto) {
    const [existing] = await withTenant(tenantId, (tx) =>
      tx.select().from(clientes).where(eq(clientes.id, id)).limit(1),
    );
    if (!existing || !existing.activo) throw new NotFoundException('Cliente no encontrado.');

    const [updated] = await withTenant(tenantId, (tx) =>
      tx.update(clientes).set({
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono }),
        ...(dto.cuit !== undefined && { cuit: dto.cuit }),
        ...(dto.direccion !== undefined && { direccion: dto.direccion }),
        updated_at: new Date(),
      }).where(eq(clientes.id, id)).returning(),
    );
    return updated;
  }
}
