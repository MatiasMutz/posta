import { z } from 'zod';
import { MontoSchema, PaginacionSchema } from './common';

export const TipoComprobanteSchema = z.enum(['factura_b', 'factura_a', 'remito', 'presupuesto']);
export const MetodoPagoSchema = z.enum(['efectivo', 'debito', 'credito', 'transferencia', 'cuenta_corriente']);
export const EstadoVentaSchema = z.enum(['facturado', 'pendiente_facturacion', 'error_afip', 'remito', 'presupuesto']);

export const ItemVentaSchema = z.object({
  producto_id: z.string().uuid().optional(),
  descripcion: z.string().min(1, 'La descripción es requerida').max(200),
  cantidad: z.coerce.number().int('La cantidad debe ser un número entero').positive('La cantidad debe ser mayor a 0'),
  precio_unitario: MontoSchema,
});

export const CreateVentaSchema = z
  .object({
    cliente_id: z.string().uuid().optional(),
    tipo: TipoComprobanteSchema.default('factura_b'),
    metodo_pago: MetodoPagoSchema.default('efectivo'),
    items: z.array(ItemVentaSchema).min(1, 'La venta debe tener al menos un ítem'),
    descuento: MontoSchema.optional().default('0'),
    observaciones: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.metodo_pago !== 'cuenta_corriente' || !!data.cliente_id,
    {
      message: 'Seleccioná un cliente para registrar una venta en cuenta corriente.',
      path: ['cliente_id'],
    },
  )
  .refine(
    (data) => data.tipo !== 'factura_a' || !!data.cliente_id,
    {
      message: 'Seleccioná un cliente con CUIT para emitir Factura A.',
      path: ['cliente_id'],
    },
  );

export const IvaVentasQuerySchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export const ListVentasQuerySchema = PaginacionSchema.extend({
  estado: EstadoVentaSchema.optional(),
  desde: z.string().optional(), // ISO date YYYY-MM-DD
  hasta: z.string().optional(),
  cliente_id: z.string().uuid().optional(),
});

export type TipoComprobante = z.infer<typeof TipoComprobanteSchema>;
export type MetodoPago = z.infer<typeof MetodoPagoSchema>;
export type EstadoVenta = z.infer<typeof EstadoVentaSchema>;
export type ItemVentaDto = z.infer<typeof ItemVentaSchema>;
export type CreateVentaDto = z.infer<typeof CreateVentaSchema>;
export type ListVentasQuery = z.infer<typeof ListVentasQuerySchema>;
export type IvaVentasQuery = z.infer<typeof IvaVentasQuerySchema>;
