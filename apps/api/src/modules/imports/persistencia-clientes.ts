import { eq, inArray, or } from 'drizzle-orm';
import type { Tx } from '../../db';
import { clientes } from '../../db/schema';

type ClienteRow = typeof clientes.$inferSelect;

interface IndiceClientes {
  porCuit: Map<string, ClienteRow>;
  porEmail: Map<string, ClienteRow>;
}

async function cargarIndiceClientes(
  tx: Tx,
  rows: Record<string, unknown>[],
): Promise<IndiceClientes> {
  const cuits = [...new Set(rows.map((r) => r.cuit).filter(Boolean).map(String))];
  const emails = [...new Set(
    rows.map((r) => r.email).filter(Boolean).map((e) => String(e).trim().toLowerCase()),
  )];

  const condiciones = [];
  if (cuits.length > 0) condiciones.push(inArray(clientes.cuit, cuits));
  if (emails.length > 0) condiciones.push(inArray(clientes.email, emails));

  const porCuit = new Map<string, ClienteRow>();
  const porEmail = new Map<string, ClienteRow>();

  if (condiciones.length === 0) return { porCuit, porEmail };

  const existentes = await tx.select().from(clientes).where(or(...condiciones));

  for (const c of existentes) {
    if (c.cuit) porCuit.set(c.cuit, c);
    if (c.email) porEmail.set(c.email.toLowerCase(), c);
  }

  return { porCuit, porEmail };
}

function buscarClienteExistente(
  row: Record<string, unknown>,
  indice: IndiceClientes,
): ClienteRow | null {
  const cuit = row.cuit ? String(row.cuit).trim() : '';
  if (cuit && indice.porCuit.has(cuit)) return indice.porCuit.get(cuit)!;

  const email = row.email ? String(row.email).trim().toLowerCase() : '';
  if (email && indice.porEmail.has(email)) return indice.porEmail.get(email)!;

  return null;
}

export async function upsertCliente(
  tx: Tx,
  tenantId: string,
  row: Record<string, unknown>,
  indice: IndiceClientes,
): Promise<'creado' | 'actualizado'> {
  const cuit = row.cuit ? String(row.cuit).trim() : null;
  const email = row.email ? String(row.email).trim() : null;
  const existente = buscarClienteExistente(row, indice);

  if (existente) {
    await tx
      .update(clientes)
      .set({
        nombre: String(row.nombre),
        email,
        telefono: row.telefono ? String(row.telefono) : null,
        cuit,
        direccion: row.direccion ? String(row.direccion) : null,
        activo: true,
      })
      .where(eq(clientes.id, existente.id));

    const actualizado: ClienteRow = { ...existente, nombre: String(row.nombre), activo: true };
    if (cuit) indice.porCuit.set(cuit, actualizado);
    if (email) indice.porEmail.set(email.toLowerCase(), actualizado);

    return 'actualizado';
  }

  const [cliente] = await tx
    .insert(clientes)
    .values({
      tenant_id: tenantId,
      nombre: String(row.nombre),
      email,
      telefono: row.telefono ? String(row.telefono) : null,
      cuit,
      direccion: row.direccion ? String(row.direccion) : null,
    })
    .returning();

  if (cuit) indice.porCuit.set(cuit, cliente);
  if (email) indice.porEmail.set(email.toLowerCase(), cliente);

  return 'creado';
}

export async function guardarFilasClientes(
  tx: Tx,
  tenantId: string,
  rows: Record<string, unknown>[],
): Promise<{ creados: number; actualizados: number }> {
  const indice = await cargarIndiceClientes(tx, rows);
  let creados = 0;
  let actualizados = 0;

  for (const row of rows) {
    const resultado = await upsertCliente(tx, tenantId, row, indice);
    if (resultado === 'creado') creados++;
    else actualizados++;
  }

  return { creados, actualizados };
}
