import { z } from 'zod';

/** UUID v4 */
export const UuidSchema = z.string().uuid();

/** Monto NUMERIC en string (ej. "1234.56"). Nunca float. */
export const MontoSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido: use formato 1234.56');

/** CUIT argentino: 11 dígitos, guiones opcionales */
export const CuitSchema = z
  .string()
  .transform((v) => v.replace(/-/g, ''))
  .pipe(z.string().regex(/^\d{11}$/, 'CUIT inválido: debe tener 11 dígitos'));

/** Fecha local DD/MM/AAAA */
export const FechaLocalSchema = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Fecha inválida: use DD/MM/AAAA');

/** Tamaño de página por defecto en listados (API y web). */
export const LIMITE_PAGINA_DEFAULT = 50;

/** Paginación estándar para listados */
export const PaginacionSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(200).default(LIMITE_PAGINA_DEFAULT),
});
