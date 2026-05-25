import {
  pgTable, uuid, varchar, boolean, timestamp, text, char, numeric, index,
} from 'drizzle-orm/pg-core';

export const clientes = pgTable(
  'clientes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    nombre: varchar('nombre', { length: 200 }).notNull(),
    email: varchar('email', { length: 200 }),
    telefono: varchar('telefono', { length: 30 }),
    cuit: char('cuit', { length: 11 }),
    direccion: text('direccion'),
    activo: boolean('activo').notNull().default(true),
    saldo_deudor: numeric('saldo_deudor', { precision: 14, scale: 2 }).notNull().default('0'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_clientes_tenant').on(t.tenant_id),
    index('idx_clientes_tenant_email').on(t.tenant_id, t.email),
  ],
);
