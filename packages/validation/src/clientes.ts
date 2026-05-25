import { z } from 'zod';

export const CuitClienteSchema = z
  .string()
  .regex(/^\d{11}$/, 'El CUIT debe tener 11 dígitos (sin guiones)')
  .optional();

export const CreateClienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  email: z.string().email('Email inválido').max(200).optional(),
  telefono: z.string().max(30).optional(),
  cuit: CuitClienteSchema,
  direccion: z.string().max(500).optional(),
});

export const UpdateClienteSchema = CreateClienteSchema.partial();

export type CreateClienteDto = z.infer<typeof CreateClienteSchema>;
export type UpdateClienteDto = z.infer<typeof UpdateClienteSchema>;
