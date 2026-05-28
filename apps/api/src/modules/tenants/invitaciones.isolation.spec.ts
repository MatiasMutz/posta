/**
 * Test de aislamiento RLS — invitaciones.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, eq } from 'drizzle-orm';
import postgres from 'postgres';
import { tenants, invitaciones } from '../../db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
const skip = !DATABASE_URL;

type DB = ReturnType<typeof drizzle>;

describe.skipIf(skip)('Aislamiento RLS: invitaciones', () => {
  const client = postgres(DATABASE_URL!);
  const db: DB = drizzle(client, { schema: { tenants, invitaciones } });

  let tenantAId: string;
  let tenantBId: string;
  let invitacionAId: string;
  const userId = '00000000-0000-0000-0000-000000000001';

  async function withCtx<T>(tenantId: string, cb: (tx: DB) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
      return cb(tx as unknown as DB);
    });
  }

  beforeAll(async () => {
    const [a, b] = await db.insert(tenants)
      .values([{ nombre: 'Tenant A inv' }, { nombre: 'Tenant B inv' }])
      .returning();
    tenantAId = a.id;
    tenantBId = b.id;

    const [inv] = await db.insert(invitaciones).values({
      tenant_id: tenantAId,
      email: 'inv-a@test.com',
      rol: 'vendedor',
      invitado_por: userId,
      estado: 'pendiente',
      expires_at: new Date(Date.now() + 86400000),
    }).returning();
    invitacionAId = inv.id;
  });

  afterAll(async () => {
    await db.delete(invitaciones).where(eq(invitaciones.tenant_id, tenantAId));
    await db.delete(invitaciones).where(eq(invitaciones.tenant_id, tenantBId));
    await db.delete(tenants).where(eq(tenants.id, tenantAId));
    await db.delete(tenants).where(eq(tenants.id, tenantBId));
    await client.end();
  });

  it('tenant B no puede leer invitaciones del tenant A', async () => {
    const rows = await withCtx(tenantBId, (tx) =>
      tx.select().from(invitaciones).where(eq(invitaciones.id, invitacionAId)),
    );
    expect(rows).toHaveLength(0);
  });

  it('tenant B no puede insertar invitación con tenant_id del A', async () => {
    await expect(
      withCtx(tenantBId, (tx) =>
        tx.insert(invitaciones).values({
          tenant_id: tenantAId,
          email: 'intruso@test.com',
          rol: 'vendedor',
          invitado_por: userId,
          estado: 'pendiente',
          expires_at: new Date(Date.now() + 86400000),
        }),
      ),
    ).rejects.toThrow();
  });

  it('tenant B no puede actualizar invitaciones del tenant A', async () => {
    await withCtx(tenantBId, (tx) =>
      tx.update(invitaciones).set({ estado: 'revocada' }).where(eq(invitaciones.id, invitacionAId)),
    );
    const [row] = await withCtx(tenantAId, (tx) =>
      tx.select().from(invitaciones).where(eq(invitaciones.id, invitacionAId)),
    );
    expect(row.estado).toBe('pendiente');
  });

  it('tenant B no puede eliminar invitaciones del tenant A', async () => {
    await withCtx(tenantBId, (tx) =>
      tx.delete(invitaciones).where(eq(invitaciones.id, invitacionAId)),
    );
    const [row] = await withCtx(tenantAId, (tx) =>
      tx.select().from(invitaciones).where(eq(invitaciones.id, invitacionAId)),
    );
    expect(row).toBeDefined();
  });

  it('sin contexto de tenant, invitaciones devuelven 0 filas (fail-safe)', async () => {
    const rows = await db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      return (tx as unknown as DB).select().from(invitaciones).where(eq(invitaciones.id, invitacionAId));
    });
    expect(rows).toHaveLength(0);
  });
});
