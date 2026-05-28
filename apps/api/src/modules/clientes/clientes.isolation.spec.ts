/**
 * Test de aislamiento RLS — clientes.
 * Corre con: pnpm test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, eq } from 'drizzle-orm';
import postgres from 'postgres';
import { tenants, clientes } from '../../db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
const skip = !DATABASE_URL;

type DB = ReturnType<typeof drizzle>;

describe.skipIf(skip)('Aislamiento RLS: clientes', () => {
  const client = postgres(DATABASE_URL!);
  const db: DB = drizzle(client, { schema: { tenants, clientes } });

  let tenantAId: string;
  let tenantBId: string;
  let clienteAId: string;

  async function withCtx<T>(tenantId: string, cb: (tx: DB) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
      return cb(tx as unknown as DB);
    });
  }

  beforeAll(async () => {
    const [a, b] = await db.insert(tenants)
      .values([{ nombre: 'Tenant A (clientes isolation)' }, { nombre: 'Tenant B (clientes isolation)' }])
      .returning();
    tenantAId = a.id;
    tenantBId = b.id;

    const [cliente] = await db.insert(clientes).values({
      tenant_id: tenantAId,
      nombre: 'Cliente A',
      email: 'cliente-a@test.com',
    }).returning();
    clienteAId = cliente.id;
  });

  afterAll(async () => {
    await db.delete(clientes).where(eq(clientes.tenant_id, tenantAId));
    await db.delete(clientes).where(eq(clientes.tenant_id, tenantBId));
    await db.delete(tenants).where(eq(tenants.id, tenantAId));
    await db.delete(tenants).where(eq(tenants.id, tenantBId));
    await client.end();
  });

  it('tenant B no puede leer clientes del tenant A', async () => {
    const rows = await withCtx(tenantBId, (tx) =>
      tx.select().from(clientes).where(eq(clientes.id, clienteAId)),
    );
    expect(rows).toHaveLength(0);
  });

  it('tenant A ve solo sus clientes', async () => {
    const rows = await withCtx(tenantAId, (tx) => tx.select().from(clientes));
    expect(rows.every((c) => c.tenant_id === tenantAId)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('tenant B no puede insertar un cliente con tenant_id del A', async () => {
    await expect(
      withCtx(tenantBId, (tx) =>
        tx.insert(clientes).values({
          tenant_id: tenantAId,
          nombre: 'Intruso',
        }),
      ),
    ).rejects.toThrow();
  });

  it('sin contexto de tenant, clientes devuelven 0 filas (fail-safe)', async () => {
    const rows = await db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      return tx.select().from(clientes);
    });
    expect(rows.filter((c) => c.id === clienteAId)).toHaveLength(0);
  });

  it('tenant B no puede actualizar clientes del tenant A', async () => {
    await withCtx(tenantBId, (tx) =>
      tx.update(clientes).set({ nombre: 'Hackeado' }).where(eq(clientes.id, clienteAId)),
    );
    const [row] = await withCtx(tenantAId, (tx) =>
      tx.select().from(clientes).where(eq(clientes.id, clienteAId)),
    );
    expect(row.nombre).toBe('Cliente A');
  });

  it('tenant B no puede eliminar clientes del tenant A', async () => {
    await withCtx(tenantBId, (tx) =>
      tx.delete(clientes).where(eq(clientes.id, clienteAId)),
    );
    const [row] = await withCtx(tenantAId, (tx) =>
      tx.select().from(clientes).where(eq(clientes.id, clienteAId)),
    );
    expect(row).toBeDefined();
  });
});
