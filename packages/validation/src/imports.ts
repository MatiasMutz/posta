import { z } from 'zod';

export const TipoImportSchema = z.enum(['inventario', 'clientes']);

export const ColumnaMapeoSchema = z.object({
  headerArchivo: z.string(),
  campo: z.string().nullable(),
});

export const AnalizarImportSchema = z.object({
  storagePath: z.string().min(1),
  tipo: TipoImportSchema,
});

export const CrearImportSchema = z.object({
  storagePath: z.string().min(1),
  tipo: TipoImportSchema,
  columnMap: z.array(ColumnaMapeoSchema).min(1),
});

export const FilaCorreccionSchema = z.object({
  numero: z.number().int().positive(),
  datos: z.record(z.unknown()),
});

export const ReintentarImportSchema = z.object({
  correcciones: z.array(FilaCorreccionSchema).min(1),
});

export const UploadUrlQuerySchema = z.object({
  filename: z.string().min(1).max(200),
  tipo: TipoImportSchema,
});

export type TipoImport = z.infer<typeof TipoImportSchema>;
export type ColumnaMapeo = z.infer<typeof ColumnaMapeoSchema>;
export type AnalizarImportDto = z.infer<typeof AnalizarImportSchema>;
export type CrearImportDto = z.infer<typeof CrearImportSchema>;
export type FilaCorreccion = z.infer<typeof FilaCorreccionSchema>;
export type ReintentarImportDto = z.infer<typeof ReintentarImportSchema>;
export type UploadUrlQuery = z.infer<typeof UploadUrlQuerySchema>;
