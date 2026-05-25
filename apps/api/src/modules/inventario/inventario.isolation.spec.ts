/**
 * Test de aislamiento RLS — productos + movimientos_stock.
 * Requiere DATABASE_URL con Supabase local o real.
 * Corre con: pnpm test:integration:inventario
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, eq } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../../db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
const skip = !DATABASE_URL;

describe.skipIf(skip)('Aislamiento RLS: inventario', () => {
  const client = skip ? null : postgres(DATABASE_URL!);
  const db = skip ? null : drizzle(client!, { schema });

  let tenantAId: string;
  let tenantBId: string;
  let _prodAId: string;

  async function withCtx<T>(tenantId: string, cb: (tx: typeof db) => Promise<T>): Promise<T> {
    return db!.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
      return cb(tx as unknown as typeof db);
    });
  }

  beforeAll(async () => {
    if (skip) return;
    // Setup como admin (sin RLS)
    const [a, b] = await db!
      .insert(schema.tenants)
      .values([
        { nombre: 'Tenant A inv-test' },
        { nombre: 'Tenant B inv-test' },
      ])
      .returning();
    tenantAId = a.id;
    tenantBId = b.id;

    // Producto del tenant A (como admin: sin withCtx)
    // Para crear con RLS activo necesitamos withCtx, pero como admin bypaseamos RLS
    // Esto solo es posible porque postgres es superuser
    const [prod] = await db!
      .insert(schema.productos)
      .values({
        tenant_id: tenantAId,
        nombre: 'Producto A',
        costo: '100.00',
        precio: '200.00',
      })
      .returning();
    _prodAId = prod.id;
  });

  afterAll(async () => {
    if (skip || !tenantAId) return;
    await db!.delete(schema.movimientosStock).where(eq(schema.movimientosStock.tenant_id, tenantAId));
    await db!.delete(schema.productos).where(eq(schema.productos.tenant_id, tenantAId));
    await db!.delete(schema.productos).where(eq(schema.productos.tenant_id, tenantBId));
    await db!.delete(schema.tenants).where(eq(schema.tenants.id, tenantAId));
    await db!.delete(schema.tenants).where(eq(schema.tenants.id, tenantBId));
    await client!.end();
  });

  it('tenant B no puede ver productos del tenant A', async () => {
    const rows = await withCtx(tenantBId, (d) => d!.select().from(schema.productos));
    expect(rows.some((r) => r.tenant_id === tenantAId)).toBe(false);
  });

  it('tenant A ve solo sus productos', async () => {
    const rows = await withCtx(tenantAId, (d) => d!.select().from(schema.productos));
    expect(rows.every((r) => r.tenant_id === tenantAId)).toBe(true);
  });

  it('tenant B no puede insertar un producto con tenant_id del A', async () => {
    await expect(
      withCtx(tenantBId, (d) =>
        d!.insert(schema.productos).values({
          tenant_id: tenantAId, // fuerza el tenant del A
          nombre: 'Intruso',
          costo: '1.00',
          precio: '2.00',
        }),
      ),
    ).rejects.toThrow();
  });

  it('sin contexto de tenant, productos devuelven 0 filas (fail-safe)', async () => {
    const rows = await db!.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      return tx.select().from(schema.productos);
    });
    expect(rows.filter((r) => r.tenant_id === tenantAId)).toHaveLength(0);
  });
});
