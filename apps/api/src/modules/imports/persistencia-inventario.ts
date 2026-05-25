import { eq, inArray, or } from 'drizzle-orm';
import type { Tx } from '../../db';
import { productos, movimientosStock } from '../../db/schema';

type ProductoRow = typeof productos.$inferSelect;

export interface IndiceProductos {
  porSku: Map<string, ProductoRow>;
  porCodigoBarras: Map<string, ProductoRow>;
}

export async function cargarIndiceProductos(
  tx: Tx,
  rows: Record<string, unknown>[],
): Promise<IndiceProductos> {
  const skus = [...new Set(rows.map((r) => r.sku).filter(Boolean).map(String))];
  const barras = [...new Set(rows.map((r) => r.codigo_barras).filter(Boolean).map(String))];

  const condiciones = [];
  if (skus.length > 0) condiciones.push(inArray(productos.sku, skus));
  if (barras.length > 0) condiciones.push(inArray(productos.codigo_barras, barras));

  const porSku = new Map<string, ProductoRow>();
  const porCodigoBarras = new Map<string, ProductoRow>();

  if (condiciones.length === 0) return { porSku, porCodigoBarras };

  const existentes = await tx
    .select()
    .from(productos)
    .where(or(...condiciones));

  for (const p of existentes) {
    if (p.sku) porSku.set(p.sku, p);
    if (p.codigo_barras) porCodigoBarras.set(p.codigo_barras, p);
  }

  return { porSku, porCodigoBarras };
}

export function buscarProductoExistente(
  row: Record<string, unknown>,
  indice: IndiceProductos,
): ProductoRow | null {
  const sku = row.sku ? String(row.sku).trim() : '';
  if (sku && indice.porSku.has(sku)) return indice.porSku.get(sku)!;

  const barras = row.codigo_barras ? String(row.codigo_barras).trim() : '';
  if (barras && indice.porCodigoBarras.has(barras)) return indice.porCodigoBarras.get(barras)!;

  return null;
}

const MOTIVO_ENTRADA = 'Stock inicial — importación Excel';
const MOTIVO_AJUSTE = 'Stock actualizado — importación Excel';

/** Inserta o actualiza un producto. Match por SKU, luego código de barras. */
export async function upsertProductoInventario(
  tx: Tx,
  tenantId: string,
  userId: string,
  row: Record<string, unknown>,
  indice: IndiceProductos,
): Promise<'creado' | 'actualizado'> {
  const stockNuevo = parseInt(String(row.stock_inicial ?? '0'), 10);
  const stockMinimo = parseInt(String(row.stock_minimo ?? '0'), 10);
  const sku = row.sku ? String(row.sku).trim() : null;
  const codigoBarras = row.codigo_barras ? String(row.codigo_barras).trim() : null;

  const existente = buscarProductoExistente(row, indice);

  if (existente) {
    const stockAnterior = existente.stock_actual;

    await tx
      .update(productos)
      .set({
        nombre: String(row.nombre),
        sku,
        codigo_barras: codigoBarras,
        costo: String(row.costo),
        precio: String(row.precio),
        stock_minimo: stockMinimo,
        stock_actual: stockNuevo,
        activo: true,
      })
      .where(eq(productos.id, existente.id));

    if (stockNuevo !== stockAnterior) {
      await tx.insert(movimientosStock).values({
        tenant_id: tenantId,
        producto_id: existente.id,
        tipo: 'ajuste',
        cantidad: stockNuevo,
        stock_anterior: stockAnterior,
        stock_posterior: stockNuevo,
        motivo: MOTIVO_AJUSTE,
        created_by: userId,
      });
    }

    const actualizado: ProductoRow = {
      ...existente,
      nombre: String(row.nombre),
      sku,
      codigo_barras: codigoBarras,
      stock_actual: stockNuevo,
      activo: true,
    };
    if (sku) indice.porSku.set(sku, actualizado);
    if (codigoBarras) indice.porCodigoBarras.set(codigoBarras, actualizado);

    return 'actualizado';
  }

  const [producto] = await tx
    .insert(productos)
    .values({
      tenant_id: tenantId,
      nombre: String(row.nombre),
      sku,
      codigo_barras: codigoBarras,
      costo: String(row.costo),
      precio: String(row.precio),
      stock_actual: stockNuevo,
      stock_minimo: stockMinimo,
    })
    .returning();

  if (stockNuevo > 0) {
    await tx.insert(movimientosStock).values({
      tenant_id: tenantId,
      producto_id: producto.id,
      tipo: 'entrada',
      cantidad: stockNuevo,
      stock_anterior: 0,
      stock_posterior: stockNuevo,
      motivo: MOTIVO_ENTRADA,
      created_by: userId,
    });
  }

  if (sku) indice.porSku.set(sku, producto);
  if (codigoBarras) indice.porCodigoBarras.set(codigoBarras, producto);

  return 'creado';
}

export async function guardarFilasInventario(
  tx: Tx,
  tenantId: string,
  userId: string,
  rows: Record<string, unknown>[],
): Promise<{ creados: number; actualizados: number }> {
  const indice = await cargarIndiceProductos(tx, rows);
  let creados = 0;
  let actualizados = 0;

  for (const row of rows) {
    const resultado = await upsertProductoInventario(tx, tenantId, userId, row, indice);
    if (resultado === 'creado') creados++;
    else actualizados++;
  }

  return { creados, actualizados };
}
