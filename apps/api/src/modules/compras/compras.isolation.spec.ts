/**
 * Test de aislamiento RLS — proveedores, compras, items_compra.
 * Corre con: pnpm test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, eq } from 'drizzle-orm';
import postgres from 'postgres';
import { tenants, proveedores, compras, itemsCompra } from '../../db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
const skip = !DATABASE_URL;

type DB = ReturnType<typeof drizzle>;

describe.skipIf(skip)('Aislamiento RLS: compras y proveedores', () => {
  const client = postgres(DATABASE_URL!);
  const db: DB = drizzle(client, {
    schema: { tenants, proveedores, compras, itemsCompra },
  });

  let tenantAId: string;
  let tenantBId: string;
  let proveedorAId: string;
  let compraAId: string;

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
        { nombre: 'Tenant A (compras isolation)' },
        { nombre: 'Tenant B (compras isolation)' },
      ])
      .returning();
    tenantAId = a.id;
    tenantBId = b.id;

    const [prov] = await db.insert(proveedores).values({
      tenant_id: tenantAId,
      nombre: 'Proveedor A',
      cuit: '30111111111',
    }).returning();
    proveedorAId = prov.id;

    const [compra] = await db.insert(compras).values({
      tenant_id: tenantAId,
      proveedor_id: proveedorAId,
      categoria: 'gasto',
      tipo_comprobante: 'sin_comprobante',
      metodo_pago: 'efectivo',
      subtotal: '100.00',
      descuento: '0',
      total: '100.00',
      created_by: tenantAId,
    }).returning();
    compraAId = compra.id;

    await db.insert(itemsCompra).values({
      tenant_id: tenantAId,
      compra_id: compraAId,
      descripcion: 'Gasto test',
      cantidad: '1',
      precio_unitario: '100.00',
      subtotal: '100.00',
    });
  });

  afterAll(async () => {
    await db.delete(itemsCompra).where(eq(itemsCompra.tenant_id, tenantAId));
    await db.delete(compras).where(eq(compras.tenant_id, tenantAId));
    await db.delete(proveedores).where(eq(proveedores.tenant_id, tenantAId));
    await db.delete(itemsCompra).where(eq(itemsCompra.tenant_id, tenantBId));
    await db.delete(compras).where(eq(compras.tenant_id, tenantBId));
    await db.delete(proveedores).where(eq(proveedores.tenant_id, tenantBId));
    await db.delete(tenants).where(eq(tenants.id, tenantAId));
    await db.delete(tenants).where(eq(tenants.id, tenantBId));
    await client.end();
  });

  it('tenant B no lee proveedores del tenant A', async () => {
    const rows = await withCtx(tenantBId, (tx) =>
      tx.select().from(proveedores).where(eq(proveedores.id, proveedorAId)),
    );
    expect(rows).toHaveLength(0);
  });

  it('tenant B no lee compras del tenant A', async () => {
    const rows = await withCtx(tenantBId, (tx) =>
      tx.select().from(compras).where(eq(compras.id, compraAId)),
    );
    expect(rows).toHaveLength(0);
  });

  it('tenant B no inserta proveedor con tenant_id del A', async () => {
    await expect(
      withCtx(tenantBId, (tx) =>
        tx.insert(proveedores).values({
          tenant_id: tenantAId,
          nombre: 'Intruso',
        }),
      ),
    ).rejects.toThrow();
  });

  it('sin contexto de tenant, proveedores devuelven 0 filas (fail-safe)', async () => {
    const rows = await db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
      return tx.select().from(proveedores);
    });
    expect(rows).toHaveLength(0);
  });
});
