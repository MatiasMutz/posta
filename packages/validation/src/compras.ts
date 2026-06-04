import { z } from 'zod';
import { MontoSchema, PaginacionSchema } from './common';
import { MetodoPagoSchema } from './ventas';

export const CategoriaCompraSchema = z.enum(['compra', 'gasto']);

export const TipoComprobanteCompraSchema = z.enum([
  'factura_a',
  'factura_b',
  'ticket',
  'sin_comprobante',
]);

export const TIPOS_COMPROBANTE_IVA_COMPRAS = ['factura_a', 'factura_b', 'ticket'] as const;

export const ItemCompraSchema = z.object({
  producto_id: z.string().uuid().optional(),
  descripcion: z.string().min(1, 'La descripción es requerida').max(200),
  cantidad: z.coerce.number().int('La cantidad debe ser un número entero').positive('La cantidad debe ser mayor a 0'),
  precio_unitario: MontoSchema,
});

export const CreateCompraSchema = z
  .object({
    proveedor_id: z.string().uuid().optional(),
    categoria: CategoriaCompraSchema.default('compra'),
    tipo_comprobante: TipoComprobanteCompraSchema.default('factura_b'),
    metodo_pago: MetodoPagoSchema.default('efectivo'),
    items: z.array(ItemCompraSchema).min(1, 'La compra debe tener al menos un ítem'),
    descuento: MontoSchema.optional().default('0'),
    numero_comprobante: z.coerce.number().int().positive().optional(),
    observaciones: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.metodo_pago !== 'cuenta_corriente' || !!data.proveedor_id,
    {
      message: 'Seleccioná un proveedor para registrar una compra en cuenta corriente.',
      path: ['proveedor_id'],
    },
  )
  .refine(
    (data) => data.categoria !== 'gasto' || data.items.every((i) => !i.producto_id),
    {
      message: 'Los gastos no pueden vincularse a productos del inventario.',
      path: ['items'],
    },
  );

export const IvaComprasQuerySchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export const ListComprasQuerySchema = PaginacionSchema.extend({
  categoria: CategoriaCompraSchema.optional(),
  proveedor_id: z.string().uuid().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export type CategoriaCompra = z.infer<typeof CategoriaCompraSchema>;
export type TipoComprobanteCompra = z.infer<typeof TipoComprobanteCompraSchema>;
export type ItemCompraDto = z.infer<typeof ItemCompraSchema>;
export type CreateCompraDto = z.infer<typeof CreateCompraSchema>;
export type ListComprasQuery = z.infer<typeof ListComprasQuerySchema>;
export type IvaComprasQuery = z.infer<typeof IvaComprasQuerySchema>;
