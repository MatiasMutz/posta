import {
  pgTable, uuid, varchar, timestamp, text, numeric, index,
} from 'drizzle-orm/pg-core';
import { clientes } from './clientes';
import { proveedores } from './proveedores';

export type EstadoSesionCaja = 'abierta' | 'cerrada';
export type TipoMovimientoCaja = 'ingreso' | 'egreso' | 'pago_cliente' | 'pago_proveedor';
export type MetodoPagoCobro = 'efectivo' | 'debito' | 'credito' | 'transferencia';

export const sesionesCaja = pgTable(
  'sesiones_caja',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    estado: varchar('estado', { length: 10 }).notNull().$type<EstadoSesionCaja>(),
    monto_apertura: numeric('monto_apertura', { precision: 14, scale: 2 }).notNull(),
    monto_cierre: numeric('monto_cierre', { precision: 14, scale: 2 }),
    monto_esperado: numeric('monto_esperado', { precision: 14, scale: 2 }),
    diferencia: numeric('diferencia', { precision: 14, scale: 2 }),
    observaciones: text('observaciones'),
    abierta_at: timestamp('abierta_at', { withTimezone: true }).defaultNow().notNull(),
    cerrada_at: timestamp('cerrada_at', { withTimezone: true }),
    created_by: uuid('created_by').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_sesiones_caja_tenant_estado').on(t.tenant_id, t.estado),
    index('idx_sesiones_caja_tenant_fecha').on(t.tenant_id, t.abierta_at),
  ],
);

export const pagosCliente = pgTable(
  'pagos_cliente',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    cliente_id: uuid('cliente_id').notNull().references(() => clientes.id),
    monto: numeric('monto', { precision: 14, scale: 2 }).notNull(),
    metodo_pago: varchar('metodo_pago', { length: 20 }).notNull().$type<MetodoPagoCobro>(),
    observaciones: text('observaciones'),
    created_by: uuid('created_by').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_pagos_cliente_tenant_cliente').on(t.tenant_id, t.cliente_id),
    index('idx_pagos_cliente_tenant_fecha').on(t.tenant_id, t.created_at),
  ],
);

export const pagosProveedor = pgTable(
  'pagos_proveedor',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    proveedor_id: uuid('proveedor_id').notNull().references(() => proveedores.id),
    monto: numeric('monto', { precision: 14, scale: 2 }).notNull(),
    metodo_pago: varchar('metodo_pago', { length: 20 }).notNull().$type<MetodoPagoCobro>(),
    observaciones: text('observaciones'),
    created_by: uuid('created_by').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_pagos_proveedor_tenant_prov').on(t.tenant_id, t.proveedor_id),
    index('idx_pagos_proveedor_tenant_fecha').on(t.tenant_id, t.created_at),
  ],
);

export const movimientosCaja = pgTable(
  'movimientos_caja',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant_id: uuid('tenant_id').notNull(),
    sesion_caja_id: uuid('sesion_caja_id').notNull().references(() => sesionesCaja.id),
    tipo: varchar('tipo', { length: 20 }).notNull().$type<TipoMovimientoCaja>(),
    metodo_pago: varchar('metodo_pago', { length: 20 }).$type<MetodoPagoCobro>(),
    monto: numeric('monto', { precision: 14, scale: 2 }).notNull(),
    concepto: varchar('concepto', { length: 200 }).notNull(),
    pago_cliente_id: uuid('pago_cliente_id').references(() => pagosCliente.id),
    pago_proveedor_id: uuid('pago_proveedor_id').references(() => pagosProveedor.id),
    created_by: uuid('created_by').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_mov_caja_tenant_sesion').on(t.tenant_id, t.sesion_caja_id),
    index('idx_mov_caja_tenant_fecha').on(t.tenant_id, t.created_at),
  ],
);
