import { eq, inArray, or } from 'drizzle-orm';
import type { Tx } from '../../db';
import { proveedores } from '../../db/schema';
import { fromString, add, toNumericString } from '@posta/money';

type ProveedorRow = typeof proveedores.$inferSelect;

export interface IndiceProveedores {
  porCuit: Map<string, ProveedorRow>;
  porEmail: Map<string, ProveedorRow>;
}

async function cargarIndiceProveedores(
  tx: Tx,
  rows: Record<string, unknown>[],
): Promise<IndiceProveedores> {
  const cuits = [...new Set(rows.map((r) => r.cuit).filter(Boolean).map(String))];
  const emails = [...new Set(
    rows.map((r) => r.email).filter(Boolean).map((e) => String(e).trim().toLowerCase()),
  )];

  const condiciones = [];
  if (cuits.length > 0) condiciones.push(inArray(proveedores.cuit, cuits));
  if (emails.length > 0) condiciones.push(inArray(proveedores.email, emails));

  const porCuit = new Map<string, ProveedorRow>();
  const porEmail = new Map<string, ProveedorRow>();

  if (condiciones.length === 0) return { porCuit, porEmail };

  const existentes = await tx.select().from(proveedores).where(or(...condiciones));

  for (const p of existentes) {
    if (p.cuit) porCuit.set(p.cuit, p);
    if (p.email) porEmail.set(p.email.toLowerCase(), p);
  }

  return { porCuit, porEmail };
}

export function buscarProveedorExistente(
  row: Record<string, unknown>,
  indice: IndiceProveedores,
): ProveedorRow | null {
  const cuit = row.cuit ? String(row.cuit).trim() : '';
  if (cuit && indice.porCuit.has(cuit)) return indice.porCuit.get(cuit)!;

  const email = row.email ? String(row.email).trim().toLowerCase() : '';
  if (email && indice.porEmail.has(email)) return indice.porEmail.get(email)!;

  return null;
}

export async function upsertProveedor(
  tx: Tx,
  tenantId: string,
  row: Record<string, unknown>,
  indice: IndiceProveedores,
): Promise<'creado' | 'actualizado'> {
  const cuit = row.cuit ? String(row.cuit).trim() : null;
  const email = row.email ? String(row.email).trim() : null;
  const saldoImport = row.saldo_acreedor ? String(row.saldo_acreedor) : null;
  const existente = buscarProveedorExistente(row, indice);

  if (existente) {
    const nuevoSaldo = saldoImport
      ? toNumericString(add(fromString(existente.saldo_acreedor), fromString(saldoImport)))
      : existente.saldo_acreedor;

    await tx
      .update(proveedores)
      .set({
        nombre: String(row.nombre),
        email,
        telefono: row.telefono ? String(row.telefono) : null,
        cuit,
        direccion: row.direccion ? String(row.direccion) : null,
        saldo_acreedor: nuevoSaldo,
        activo: true,
        updated_at: new Date(),
      })
      .where(eq(proveedores.id, existente.id));

    const actualizado: ProveedorRow = {
      ...existente,
      nombre: String(row.nombre),
      saldo_acreedor: nuevoSaldo,
      activo: true,
    };
    if (cuit) indice.porCuit.set(cuit, actualizado);
    if (email) indice.porEmail.set(email.toLowerCase(), actualizado);

    return 'actualizado';
  }

  const [proveedor] = await tx
    .insert(proveedores)
    .values({
      tenant_id: tenantId,
      nombre: String(row.nombre),
      email,
      telefono: row.telefono ? String(row.telefono) : null,
      cuit,
      direccion: row.direccion ? String(row.direccion) : null,
      saldo_acreedor: saldoImport ?? '0',
    })
    .returning();

  if (cuit) indice.porCuit.set(cuit, proveedor);
  if (email) indice.porEmail.set(email.toLowerCase(), proveedor);

  return 'creado';
}

export async function guardarFilasProveedores(
  tx: Tx,
  tenantId: string,
  rows: Record<string, unknown>[],
): Promise<{ creados: number; actualizados: number }> {
  const indice = await cargarIndiceProveedores(tx, rows);
  let creados = 0;
  let actualizados = 0;

  for (const row of rows) {
    const resultado = await upsertProveedor(tx, tenantId, row, indice);
    if (resultado === 'creado') creados++;
    else actualizados++;
  }

  return { creados, actualizados };
}
