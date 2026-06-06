import * as jwt from 'jsonwebtoken';
import type { Rol } from '@posta/shared-types';

const TEST_JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long';
const TEST_SUPABASE_URL = 'https://example.supabase.co';

/** Configura env mínimo para verificar JWT HS256 en specs de contrato. */
export function configurarEnvJwtTest(): void {
  process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;
  process.env.SUPABASE_URL = TEST_SUPABASE_URL;
}

export function crearTokenTest(opts: {
  userId?: string;
  tenantId?: string;
  rol: Rol;
}): string {
  const { userId = 'user-test', tenantId = 'tenant-1', rol } = opts;
  return jwt.sign(
    {
      sub: userId,
      role: 'authenticated',
      email: `${userId}@test.com`,
      app_metadata: { tenant_id: tenantId, rol },
    },
    TEST_JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' },
  );
}
