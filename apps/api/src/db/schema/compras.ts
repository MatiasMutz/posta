import {
  pgTable, uuid, varchar, numeric, integer,
  timestamp, text, index,
} from 'drizzle-orm/pg-core';
import { productos } from './inventario';
import { proveedores } from './proveedores';

export type CategoriaCompra = 'compra' | 'gasto';
export type TipoComprobanteCompra = 'factura_a' | 'factura_b' | 'ticket' | 'sin_comprobante';
export type MetodoPagoCompra = 'efectivo' | 'debito' | 'credito' | 'transferencia' | 'cuenta_corriente';

export const compras = pgTable(
  'compras',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    proveedor_id: uuid('proveedor_id').references(() => proveedores.id),
    categoria: varchar('categoria', { length: 10 }).notNull().$type<CategoriaCompra>(),
    tipo_comprobante: varchar('tipo_comprobante', { length: 20 }).notNull().$type<TipoComprobanteCompra>(),
    metodo_pago: varchar('metodo_pago', { length: 20 }).notNull().$type<MetodoPagoCompra>(),
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
    descuento: numeric('descuento', { precision: 14, scale: 2 }).notNull().default('0'),
    total: numeric('total', { precision: 14, scale: 2 }).notNull(),
    numero_comprobante: integer('numero_comprobante'),
    observaciones: text('observaciones'),
    created_by: uuid('created_by').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_compras_tenant').on(t.tenant_id),
    index('idx_compras_tenant_fecha').on(t.tenant_id, t.created_at),
    index('idx_compras_tenant_prov').on(t.tenant_id, t.proveedor_id),
  ],
);

export const itemsCompra = pgTable(
  'items_compra',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    compra_id: uuid('compra_id').notNull().references(() => compras.id),
    producto_id: uuid('producto_id').references(() => productos.id),
    descripcion: varchar('descripcion', { length: 200 }).notNull(),
    cantidad: numeric('cantidad', { precision: 14, scale: 3 }).notNull(),
    precio_unitario: numeric('precio_unitario', { precision: 14, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  },
  (t) => [
    index('idx_items_compra_tenant_compra').on(t.tenant_id, t.compra_id),
  ],
);
