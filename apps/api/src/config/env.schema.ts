import { z } from 'zod';

/**
 * Variables de entorno requeridas/opcionales de la API.
 * Validar al boot evita fallos opacos en runtime.
 */
export const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  SUPABASE_URL: z.string().url('SUPABASE_URL debe ser una URL válida'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  AFIP_SERVICE_URL: z.string().url().optional(),
  AFIP_MOCK_FAIL: z.string().optional(),
  AFIP_MOCK_DELAY_MS: z.string().optional(),
  WEB_URL: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(raw: NodeJS.ProcessEnv = process.env): EnvConfig {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (i) => `  - ${i.path.join('.')}: ${i.message}`,
    );
    throw new Error(`Configuración de entorno inválida:\n${lines.join('\n')}`);
  }
  return parsed.data;
}
