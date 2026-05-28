import { z } from 'zod';

export const RegistroSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombreTenant: z.string().min(1, 'El nombre del negocio es requerido').max(200),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const ActivarCuentaSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirm: z.string().min(1, 'Confirmá la contraseña'),
}).refine((d) => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
});

export type RegistroDto = z.infer<typeof RegistroSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type ActivarCuentaDto = z.infer<typeof ActivarCuentaSchema>;
