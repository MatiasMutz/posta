import {
  pgTable, uuid, varchar, numeric, boolean,
  timestamp, text, index, char,
} from 'drizzle-orm/pg-core';

export const proveedores = pgTable(
  'proveedores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    nombre: varchar('nombre', { length: 200 }).notNull(),
    email: varchar('email', { length: 200 }),
    telefono: varchar('telefono', { length: 30 }),
    cuit: char('cuit', { length: 11 }),
    direccion: text('direccion'),
    saldo_acreedor: numeric('saldo_acreedor', { precision: 14, scale: 2 }).notNull().default('0'),
    activo: boolean('activo').notNull().default(true),
    created_by: uuid('created_by'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_proveedores_tenant').on(t.tenant_id),
    index('idx_proveedores_tenant_nombre').on(t.tenant_id, t.nombre),
    index('idx_proveedores_tenant_cuit').on(t.tenant_id, t.cuit),
  ],
);
