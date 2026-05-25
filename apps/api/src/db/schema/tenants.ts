import { pgTable, uuid, varchar, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import type { Rol } from '@posta/shared-types';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usuariosTenant = pgTable(
  'usuarios_tenant',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').notNull(),
    rol: varchar('rol', { length: 20 }).notNull().$type<Rol>(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    // tenant_id primero en índices compuestos (skill rls-policy)
    uniqueIndex('usuarios_tenant_tenant_user_idx').on(t.tenant_id, t.user_id),
    index('usuarios_tenant_tenant_idx').on(t.tenant_id),
  ],
);
