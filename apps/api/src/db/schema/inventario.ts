import {
  pgTable, uuid, varchar, numeric, integer, boolean,
  timestamp, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const productos = pgTable(
  'productos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    nombre: varchar('nombre', { length: 200 }).notNull(),
    sku: varchar('sku', { length: 50 }),
    codigo_barras: varchar('codigo_barras', { length: 100 }),
    // skill money: NUMERIC, nunca float
    costo: numeric('costo', { precision: 14, scale: 2 }).notNull(),
    precio: numeric('precio', { precision: 14, scale: 2 }).notNull(),
    stock_actual: integer('stock_actual').notNull().default(0),
    stock_minimo: integer('stock_minimo').notNull().default(0),
    activo: boolean('activo').notNull().default(true),
    created_by: uuid('created_by'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_productos_tenant').on(t.tenant_id),
    // SKU único por tenant; NULL se excluye del índice único
    uniqueIndex('idx_productos_tenant_sku')
      .on(t.tenant_id, t.sku)
      .where(sql`sku IS NOT NULL`),
  ],
);

export const movimientosStock = pgTable(
  'movimientos_stock',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    producto_id: uuid('producto_id')
      .notNull()
      .references(() => productos.id),
    tipo: varchar('tipo', { length: 20 })
      .notNull()
      .$type<'entrada' | 'salida' | 'ajuste'>(),
    cantidad: integer('cantidad').notNull(),
    stock_anterior: integer('stock_anterior').notNull(),
    stock_posterior: integer('stock_posterior').notNull(),
    motivo: varchar('motivo', { length: 200 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    created_by: uuid('created_by').notNull(),
  },
  (t) => [
    index('idx_movimientos_tenant_producto').on(t.tenant_id, t.producto_id),
    index('idx_movimientos_tenant_fecha').on(t.tenant_id, t.created_at),
  ],
);
