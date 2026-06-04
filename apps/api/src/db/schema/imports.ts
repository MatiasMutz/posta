import {
  pgTable, uuid, varchar, integer, timestamp, text, jsonb, index,
} from 'drizzle-orm/pg-core';

export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    tipo: varchar('tipo', { length: 20 }).notNull().$type<'inventario' | 'clientes' | 'proveedores'>(),
    estado: varchar('estado', { length: 20 }).notNull().default('pendiente')
      .$type<'pendiente' | 'procesando' | 'completado' | 'error'>(),
    fase: varchar('fase', { length: 20 }).$type<'parseando' | 'validando' | 'importando'>(),
    progreso: integer('progreso').notNull().default(0),
    total: integer('total').notNull().default(0),
    filas_ok: integer('filas_ok').notNull().default(0),
    filas_error: integer('filas_error').notNull().default(0),
    errores: jsonb('errores').$type<FilaConError[]>(),
    archivo_path: text('archivo_path').notNull(),
    column_map: jsonb('column_map').notNull().$type<ColumnaMapeo[]>(),
    created_by: uuid('created_by').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_import_jobs_tenant').on(t.tenant_id),
    index('idx_import_jobs_tenant_estado').on(t.tenant_id, t.estado),
  ],
);

export interface ColumnaMapeo {
  headerArchivo: string;
  campo: string | null; // null = skip
}

export interface FilaConError {
  numero: number;
  datos: Record<string, unknown>;
  problemas: Array<{ campo: string; valor: unknown; motivo: string }>;
}
