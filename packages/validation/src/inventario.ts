import { z } from 'zod';
import { MontoSchema, PaginacionSchema } from './common';

/** Campo opcional de formulario: string vacío → undefined (evita fallo silencioso de .min(1)). */
const optionalSku = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.string().min(1).max(50).optional(),
);

const optionalCodigoBarras = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.string().max(100).optional(),
);

export const CreateProductoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  sku: optionalSku,
  codigo_barras: optionalCodigoBarras,
  costo: MontoSchema,
  precio: MontoSchema,
  stock_inicial: z.coerce.number().int().min(0).default(0),
  stock_minimo: z.coerce.number().int().min(0).default(0),
});

export const UpdateProductoSchema = CreateProductoSchema.partial();

export const ListProductosQuerySchema = PaginacionSchema.extend({
  solo_bajo_stock: z.coerce.boolean().default(false),
  buscar: z.string().max(200).optional(),
});

export const MovimientoStockSchema = z.object({
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  motivo: z.string().max(200).optional(),
});

export type CreateProductoDto = z.infer<typeof CreateProductoSchema>;
export type UpdateProductoDto = z.infer<typeof UpdateProductoSchema>;
export type ListProductosQuery = z.infer<typeof ListProductosQuerySchema>;
export type MovimientoStockDto = z.infer<typeof MovimientoStockSchema>;
