import { z } from 'zod';

const RolInvitableSchema = z.enum(['vendedor', 'contador']);

export const InvitarUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  rol: RolInvitableSchema,
});

export const CambiarRolUsuarioSchema = z.object({
  rol: RolInvitableSchema,
});

export type InvitarUsuarioDto = z.infer<typeof InvitarUsuarioSchema>;
export type CambiarRolUsuarioDto = z.infer<typeof CambiarRolUsuarioSchema>;
