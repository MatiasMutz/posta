import { z } from 'zod';
import { PaginacionSchema } from './common';

/** Campos opcionales de formulario: string vacío → undefined (react-hook-form envía ""). */
function optionalField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    schema.optional(),
  );
}

export const CuitClienteSchema = optionalField(
  z.string().regex(/^\d{11}$/, 'El CUIT debe tener 11 dígitos (sin guiones)'),
);

export const CreateClienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  email: optionalField(z.string().email('Email inválido').max(200)),
  telefono: z.string().max(30).optional(),
  cuit: CuitClienteSchema,
  direccion: z.string().max(500).optional(),
});

export const UpdateClienteSchema = CreateClienteSchema.partial();

export const ListClientesQuerySchema = PaginacionSchema.extend({
  buscar: z.string().max(200).optional(),
});

export type CreateClienteDto = z.infer<typeof CreateClienteSchema>;
export type UpdateClienteDto = z.infer<typeof UpdateClienteSchema>;
export type ListClientesQuery = z.infer<typeof ListClientesQuerySchema>;
