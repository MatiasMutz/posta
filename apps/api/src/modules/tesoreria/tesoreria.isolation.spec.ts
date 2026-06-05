/**
 * Test de aislamiento RLS — tesorería (sesiones_caja, movimientos_caja, pagos).
 * Corre con: pnpm test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, eq } from 'drizzle-orm';
import postgres from 'postgres';
import {
  tenants, clientes, sesionesCaja, movimientosCaja, pagosCliente,
} from '../../db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
const skip = !DATABASE_URL;

type DB = ReturnType<typeof drizzle>;

describe.skipIf(skip)('Aislamiento RLS: tesorería', () => {
  const client = postgres(DATABASE_URL!);
  const db: DB = drizzle(client, {
    schema: { tenants, clientes, sesionesCaja, movimientosCaja, pagosCliente },
  });

  let tenantAId: string;
  let tenantBId: string;
  let sesionAId: string;

  async function withCtx<T>(tenantId: string, cb: (tx: DB) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
      return cb(tx as unknown as DB);
    });
  }

  beforeAll(async () => {
    const [a, b] = await db.insert(tenants)
      .values([
        { nombre: 'Tenant A (tesoreria isolation)' },
        { nombre: 'Tenant B (tesoreria isolation)' },
      ])
      .returning();
    tenantAId = a.id;
    tenantBId = b.id;

    await db.insert(clientes).values({
      tenant_id: tenantAId,
      nombre: 'Cliente A',
      saldo_deudor: '100.00',
    });

    const [sesion] = await db.insert(sesionesCaja).values({
      tenant_id: tenantAId,
      estado: 'abierta',
      monto_apertura: '500.00',
      created_by: tenantAId,
    }).returning();
    sesionAId = sesion.id;

    await db.insert(movimientosCaja).values({
      tenant_id: tenantAId,
      sesion_caja_id: sesionAId,
      tipo: 'ingreso',
      monto: '50.00',
      concepto: 'Ingreso test',
      created_by: tenantAId,
    });
  });

  afterAll(async () => {
    await db.delete(movimientosCaja).where(eq(movimientosCaja.tenant_id, tenantAId));
    await db.delete(pagosCliente).where(eq(pagosCliente.tenant_id, tenantAId));
    await db.delete(sesionesCaja).where(eq(sesionesCaja.tenant_id, tenantAId));
    await db.delete(clientes).where(eq(clientes.tenant_id, tenantAId));
    await db.delete(movimientosCaja).where(eq(movimientosCaja.tenant_id, tenantBId));
    await db.delete(sesionesCaja).where(eq(sesionesCaja.tenant_id, tenantBId));
    await db.delete(tenants).where(eq(tenants.id, tenantAId));
    await db.delete(tenants).where(eq(tenants.id, tenantBId));
    await client.end();
  });

  it('tenant B no lee sesiones del tenant A', async () => {
    const rows = await withCtx(tenantBId, (tx) =>
      tx.select().from(sesionesCaja).where(eq(sesionesCaja.id, sesionAId)),
    );
    expect(rows).toHaveLength(0);
  });

  it('tenant B no lee movimientos del tenant A', async () => {
    const rows = await withCtx(tenantBId, (tx) =>
      tx.select().from(movimientosCaja).where(eq(movimientosCaja.sesion_caja_id, sesionAId)),
    );
    expect(rows).toHaveLength(0);
  });

  it('tenant B no inserta sesión con tenant_id del A', async () => {
    await expect(withCtx(tenantBId, (tx) =>
      tx.insert(sesionesCaja).values({
        tenant_id: tenantAId,
        estado: 'abierta',
        monto_apertura: '100.00',
        created_by: tenantBId,
      }),
    )).rejects.toThrow();
  });

  it('sin contexto de tenant → 0 filas (fail-safe)', async () => {
    const rows = await db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      return tx.select().from(sesionesCaja);
    });
    expect(rows.filter((r) => r.id === sesionAId)).toHaveLength(0);
  });
});
