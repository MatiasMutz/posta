import { z } from 'zod';
import { MontoSchema, PaginacionSchema } from './common';

export const MetodoPagoCobroSchema = z.enum(['efectivo', 'debito', 'credito', 'transferencia']);

export const AperturaCajaSchema = z.object({
  monto_apertura: MontoSchema,
});

export const CierreCajaSchema = z.object({
  monto_cierre: MontoSchema,
  observaciones: z.string().max(500).optional(),
});

export const MovimientoCajaSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']),
  monto: MontoSchema,
  concepto: z.string().min(1, 'Ingresá un concepto.').max(200),
});

export const PagoClienteSchema = z.object({
  cliente_id: z.string().uuid('Seleccioná un cliente.'),
  monto: MontoSchema,
  metodo_pago: MetodoPagoCobroSchema.default('efectivo'),
  observaciones: z.string().max(500).optional(),
});

export const PagoProveedorSchema = z.object({
  proveedor_id: z.string().uuid('Seleccioná un proveedor.'),
  monto: MontoSchema,
  metodo_pago: MetodoPagoCobroSchema.default('efectivo'),
  observaciones: z.string().max(500).optional(),
});

export const FlujoCajaQuerySchema = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida: use AAAA-MM-DD').optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida: use AAAA-MM-DD').optional(),
});

export const ListMovimientosCajaQuerySchema = PaginacionSchema;

export type AperturaCajaDto = z.infer<typeof AperturaCajaSchema>;
export type CierreCajaDto = z.infer<typeof CierreCajaSchema>;
export type MovimientoCajaDto = z.infer<typeof MovimientoCajaSchema>;
export type PagoClienteDto = z.infer<typeof PagoClienteSchema>;
export type PagoProveedorDto = z.infer<typeof PagoProveedorSchema>;
export type FlujoCajaQuery = z.infer<typeof FlujoCajaQuerySchema>;
export type ListMovimientosCajaQuery = z.infer<typeof ListMovimientosCajaQuerySchema>;
