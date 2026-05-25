/**
 * Test de aislamiento RLS — ventas e items_venta.
 * Requiere DATABASE_URL con Supabase real.
 * Corre con: npx vitest run src/modules/ventas/ventas.isolation.spec.ts
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, eq } from 'drizzle-orm';
import postgres from 'postgres';
import { tenants, ventas, clientes } from '../../db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
const skip = !DATABASE_URL;

type DB = ReturnType<typeof drizzle>;

describe.skipIf(skip)('Aislamiento RLS: ventas', () => {
  const client = postgres(DATABASE_URL!);
  const db: DB = drizzle(client, { schema: { tenants, ventas, clientes } });

  let tenantAId: string;
  let tenantBId: string;
  let ventaAId: string;

  async function withCtx<T>(tenantId: string, cb: (tx: DB) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
      return cb(tx as unknown as DB);
    });
  }

  beforeAll(async () => {
    const [a, b] = await db.insert(tenants)
      .values([{ nombre: 'Tenant A (ventas isolation)' }, { nombre: 'Tenant B (ventas isolation)' }])
      .returning();
    tenantAId = a.id;
    tenantBId = b.id;

    // Crear una venta del tenant A (sin RLS — operación admin)
    const [venta] = await db.insert(ventas).values({
      tenant_id: tenantAId,
      tipo: 'factura_b',
      estado: 'facturado',
      metodo_pago: 'efectivo',
      subtotal: '100.00',
      descuento: '0',
      total: '100.00',
      created_by: tenantAId,
    }).returning();
    ventaAId = venta.id;
  });

  afterAll(async () => {
    await db.delete(ventas).where(eq(ventas.tenant_id, tenantAId));
    await db.delete(ventas).where(eq(ventas.tenant_id, tenantBId));
    await db.delete(tenants).where(eq(tenants.id, tenantAId));
    await db.delete(tenants).where(eq(tenants.id, tenantBId));
    await client.end();
  });

  it('tenant B no puede leer ventas del tenant A', async () => {
    const rows = await withCtx(tenantBId, (tx) =>
      (tx as any).select().from(ventas).where(eq(ventas.id, ventaAId)),
    );
    expect(rows).toHaveLength(0);
  });

  it('tenant A ve solo sus propias ventas', async () => {
    const rows = await withCtx(tenantAId, (tx) =>
      (tx as any).select().from(ventas),
    ) as any[];
    expect(rows.every((v: any) => v.tenant_id === tenantAId)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('tenant B no puede insertar una venta con tenant_id del A', async () => {
    await expect(
      withCtx(tenantBId, (tx) =>
        (tx as any).insert(ventas).values({
          tenant_id: tenantAId, // intento de insertar con tenant_id ajeno
          tipo: 'factura_b',
          estado: 'facturado',
          metodo_pago: 'efectivo',
          subtotal: '50.00',
          descuento: '0',
          total: '50.00',
          created_by: tenantBId,
        }).returning(),
      ),
    ).rejects.toThrow();
  });

  it('sin contexto de tenant, ventas devuelven 0 filas (fail-safe)', async () => {
    const rows = await db.transaction(async (tx) => {
      // Sin SET LOCAL, el setting queda vacío → policy retorna false → 0 filas
      return (tx as any).select().from(ventas) as unknown[];
    }) as unknown[];
    expect(rows).toHaveLength(0);
  });
});
