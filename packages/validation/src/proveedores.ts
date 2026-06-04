import { z } from 'zod';
import { PaginacionSchema } from './common';

function optionalField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    schema.optional(),
  );
}

export const CuitProveedorSchema = optionalField(
  z.string().regex(/^\d{11}$/, 'El CUIT debe tener 11 dígitos (sin guiones)'),
);

export const CreateProveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  email: optionalField(z.string().email('Email inválido').max(200)),
  telefono: z.string().max(30).optional(),
  cuit: CuitProveedorSchema,
  direccion: z.string().max(500).optional(),
});

export const UpdateProveedorSchema = CreateProveedorSchema.partial();

export const ListProveedoresQuerySchema = PaginacionSchema.extend({
  buscar: z.string().max(200).optional(),
});

export type CreateProveedorDto = z.infer<typeof CreateProveedorSchema>;
export type UpdateProveedorDto = z.infer<typeof UpdateProveedorSchema>;
export type ListProveedoresQuery = z.infer<typeof ListProveedoresQuerySchema>;
