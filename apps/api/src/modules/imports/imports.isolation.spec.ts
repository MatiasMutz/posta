/**
 * Test de aislamiento RLS — import_jobs.
 * Corre con: pnpm test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, eq } from 'drizzle-orm';
import postgres from 'postgres';
import { tenants, importJobs } from '../../db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
const skip = !DATABASE_URL;

type DB = ReturnType<typeof drizzle>;

describe.skipIf(skip)('Aislamiento RLS: import_jobs', () => {
  const client = postgres(DATABASE_URL!);
  const db: DB = drizzle(client, { schema: { tenants, importJobs } });

  let tenantAId: string;
  let tenantBId: string;
  let jobAId: string;
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
      .values([{ nombre: 'Tenant A (imports isolation)' }, { nombre: 'Tenant B (imports isolation)' }])
      .returning();
    tenantAId = a.id;
    tenantBId = b.id;

    const [job] = await db.insert(importJobs).values({
      tenant_id: tenantAId,
      tipo: 'inventario',
      estado: 'completado',
      archivo_path: `${tenantAId}/test.csv`,
      column_map: [{ headerArchivo: 'nombre', campo: 'nombre' }],
      created_by: userId,
    }).returning();
    jobAId = job.id;
  });

  afterAll(async () => {
    await db.delete(importJobs).where(eq(importJobs.tenant_id, tenantAId));
    await db.delete(importJobs).where(eq(importJobs.tenant_id, tenantBId));
    await db.delete(tenants).where(eq(tenants.id, tenantAId));
    await db.delete(tenants).where(eq(tenants.id, tenantBId));
    await client.end();
  });

  it('tenant B no puede leer import_jobs del tenant A', async () => {
    const rows = await withCtx(tenantBId, (tx) =>
      tx.select().from(importJobs).where(eq(importJobs.id, jobAId)),
    );
    expect(rows).toHaveLength(0);
  });

  it('tenant A ve solo sus import_jobs', async () => {
    const rows = await withCtx(tenantAId, (tx) => tx.select().from(importJobs));
    expect(rows.every((j) => j.tenant_id === tenantAId)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('tenant B no puede insertar un job con tenant_id del A', async () => {
    await expect(
      withCtx(tenantBId, (tx) =>
        tx.insert(importJobs).values({
          tenant_id: tenantAId,
          tipo: 'inventario',
          estado: 'pendiente',
          archivo_path: 'intruso.csv',
          column_map: [],
          created_by: userId,
        }),
      ),
    ).rejects.toThrow();
  });

  it('sin contexto de tenant, import_jobs devuelven 0 filas (fail-safe)', async () => {
    const rows = await db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      return tx.select().from(importJobs);
    });
    expect(rows.filter((j) => j.id === jobAId)).toHaveLength(0);
  });

  it('tenant B no puede actualizar import_jobs del tenant A', async () => {
    await withCtx(tenantBId, (tx) =>
      tx.update(importJobs).set({ estado: 'error' }).where(eq(importJobs.id, jobAId)),
    );
    const [row] = await withCtx(tenantAId, (tx) =>
      tx.select().from(importJobs).where(eq(importJobs.id, jobAId)),
    );
    expect(row.estado).toBe('completado');
  });
});
