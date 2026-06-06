import { z } from 'zod';
import { PaginacionSchema } from './common';

export const DashboardQuerySchema = z.object({
  dias_grafico: z.coerce.number().int().min(3).max(30).default(7),
});

export const ContadorResumenQuerySchema = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida: use AAAA-MM-DD').optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida: use AAAA-MM-DD').optional(),
});

export const ContadorComprobantesQuerySchema = PaginacionSchema.extend({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  estado: z.enum(['facturado', 'pendiente_facturacion', 'error_afip', 'todos']).default('todos'),
});

export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;
export type ContadorResumenQuery = z.infer<typeof ContadorResumenQuerySchema>;
export type ContadorComprobantesQuery = z.infer<typeof ContadorComprobantesQuerySchema>;
