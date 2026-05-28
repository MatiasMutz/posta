import {
  pgTable, uuid, varchar, timestamp, index,
} from 'drizzle-orm/pg-core';
import type { Rol } from '@posta/shared-types';
import { tenants } from './tenants';

export type EstadoInvitacion = 'pendiente' | 'aceptada' | 'revocada';

export const invitaciones = pgTable(
  'invitaciones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 200 }).notNull(),
    rol: varchar('rol', { length: 20 }).notNull().$type<Exclude<Rol, 'dueno'>>(),
    invitado_por: uuid('invitado_por').notNull(),
    supabase_user_id: uuid('supabase_user_id'),
    estado: varchar('estado', { length: 20 }).notNull().default('pendiente').$type<EstadoInvitacion>(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('idx_invitaciones_tenant_email').on(t.tenant_id, t.email),
  ],
);
