/**
 * Test de aislamiento RLS — requiere DATABASE_URL con Supabase local o real.
 * Corre con: pnpm test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, eq } from 'drizzle-orm';
import postgres from 'postgres';
import { tenants, usuariosTenant } from '../../db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
const skip = !DATABASE_URL;

type DB = ReturnType<typeof drizzle>;

describe.skipIf(skip)('Aislamiento RLS: tenants', () => {
  // Aserciones non-null seguras: el bloque solo corre si !skip
  const client = postgres(DATABASE_URL!);
  const db: DB = drizzle(client, { schema: { tenants, usuariosTenant } });

  let tenantAId: string;
  let tenantBId: string;

  async function withTenantCtx<T>(tenantId: string, callback: (d: DB) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
      return callback(tx as unknown as DB);
    });
  }

  beforeAll(async () => {
    const [a, b] = await db
      .insert(tenants)
      .values([
        { nombre: 'Tenant A (isolation test)' },
        { nombre: 'Tenant B (isolation test)' },
      ])
      .returning();
    tenantAId = a.id;
    tenantBId = b.id;

    await db.insert(usuariosTenant).values([
      { tenant_id: tenantAId, user_id: '00000000-0000-0000-0000-000000000001', rol: 'dueno' },
      { tenant_id: tenantBId, user_id: '00000000-0000-0000-0000-000000000002', rol: 'dueno' },
    ]);
  });

  afterAll(async () => {
    if (!tenantAId || !tenantBId) return;
    await db.delete(usuariosTenant).where(eq(usuariosTenant.tenant_id, tenantAId));
    await db.delete(usuariosTenant).where(eq(usuariosTenant.tenant_id, tenantBId));
    await db.delete(tenants).where(eq(tenants.id, tenantAId));
    await db.delete(tenants).where(eq(tenants.id, tenantBId));
    await client.end();
  });

  it('tenant A solo ve su propio tenant, no el B', async () => {
    const rows = await withTenantCtx(tenantAId, (d) => d.select().from(tenants));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(tenantAId);
  });

  it('tenant B solo ve su propio tenant, no el A', async () => {
    const rows = await withTenantCtx(tenantBId, (d) => d.select().from(tenants));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(tenantBId);
  });

  it('tenant A solo ve sus propios usuarios_tenant', async () => {
    const rows = await withTenantCtx(tenantAId, (d) => d.select().from(usuariosTenant));
    expect(rows.every((r) => r.tenant_id === tenantAId)).toBe(true);
    expect(rows.some((r) => r.tenant_id === tenantBId)).toBe(false);
  });

  it('sin contexto de tenant, se devuelven 0 filas (fail-safe)', async () => {
    const rows = await db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      return tx.select().from(tenants);
    });
    expect(rows.filter((r) => r.id === tenantAId || r.id === tenantBId)).toHaveLength(0);
  });

  it('tenant A no puede insertar una membership con tenant_id del B', async () => {
    await expect(
      withTenantCtx(tenantAId, (d) =>
        d.insert(usuariosTenant).values({
          tenant_id: tenantBId,
          user_id: '00000000-0000-0000-0000-000000000099',
          rol: 'vendedor',
        }),
      ),
    ).rejects.toThrow();
  });
});
