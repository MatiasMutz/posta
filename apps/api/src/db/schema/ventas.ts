import {
  pgTable, uuid, varchar, numeric, integer,
  timestamp, date, text, index,
} from 'drizzle-orm/pg-core';
import { productos } from './inventario';
import { clientes } from './clientes';

export type TipoComprobante = 'factura_b' | 'factura_a' | 'factura_c' | 'ticket' | 'remito' | 'presupuesto';
export type EstadoVenta = 'facturado' | 'pendiente_facturacion' | 'error_afip' | 'remito' | 'presupuesto';
export type MetodoPago = 'efectivo' | 'debito' | 'credito' | 'transferencia' | 'cuenta_corriente';

export const ventas = pgTable(
  'ventas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    cliente_id: uuid('cliente_id').references(() => clientes.id),
    tipo: varchar('tipo', { length: 20 }).notNull().$type<TipoComprobante>(),
    estado: varchar('estado', { length: 30 }).notNull().$type<EstadoVenta>(),
    metodo_pago: varchar('metodo_pago', { length: 20 }).notNull().$type<MetodoPago>(),
    // skill money: NUMERIC, nunca float
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
    descuento: numeric('descuento', { precision: 14, scale: 2 }).notNull().default('0'),
    total: numeric('total', { precision: 14, scale: 2 }).notNull(),
    // AFIP
    cae: varchar('cae', { length: 20 }),
    cae_vencimiento: date('cae_vencimiento'),
    numero_comprobante: integer('numero_comprobante'),
    intentos_facturacion: integer('intentos_facturacion').notNull().default(0),
    // Meta
    observaciones: text('observaciones'),
    created_by: uuid('created_by').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_ventas_tenant').on(t.tenant_id),
    index('idx_ventas_tenant_fecha').on(t.tenant_id, t.created_at),
    index('idx_ventas_tenant_estado').on(t.tenant_id, t.estado),
  ],
);

export const itemsVenta = pgTable(
  'items_venta',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    venta_id: uuid('venta_id').notNull().references(() => ventas.id),
    producto_id: uuid('producto_id').references(() => productos.id),
    descripcion: varchar('descripcion', { length: 200 }).notNull(),
    cantidad: numeric('cantidad', { precision: 14, scale: 3 }).notNull(),
    precio_unitario: numeric('precio_unitario', { precision: 14, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  },
  (t) => [
    index('idx_items_venta_tenant_venta').on(t.tenant_id, t.venta_id),
  ],
);
