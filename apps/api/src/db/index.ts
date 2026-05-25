import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL no definida');

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export type Database = typeof db;
// Tipo de la transacción: misma interfaz que db, sin el cliente raw.
export type Tx = Omit<Database, '$client'>;

/**
 * Ejecuta un callback dentro de una transacción con contexto de tenant.
 * SET LOCAL ROLE authenticated → RLS aplica (authenticated no es superuser).
 * SET LOCAL app.tenant_id    → las policies comparan contra este valor.
 * Al terminar la transacción ambos settings se revierten automáticamente.
 */
export async function withTenant<T>(
  tenantId: string,
  callback: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    // SET LOCAL ROLE no acepta parámetros → sql.raw (es una constante conocida, no user input)
    await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
    // set_config con is_local=true equivale a SET LOCAL; SÍ acepta parámetros
    await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
    return callback(tx);
  });
}
