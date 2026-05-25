import { UnauthorizedException } from '@nestjs/common';
import { createPublicKey } from 'node:crypto';
import * as jwt from 'jsonwebtoken';

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role: string;
  app_metadata: {
    tenant_id?: string;
    rol?: string;
  };
  exp: number;
}

interface JwkKey {
  kid?: string;
  [key: string]: unknown;
}

const JWKS_TTL_MS = 10 * 60 * 1000;
const ASYMMETRIC_ALGS = new Set(['ES256', 'ES384', 'ES512', 'RS256', 'RS384', 'RS512']);

let cachedKeys: Map<string, string> | null = null;
let cachedAt = 0;

async function getJwksKeys(supabaseUrl: string): Promise<Map<string, string>> {
  const now = Date.now();
  if (cachedKeys && now - cachedAt < JWKS_TTL_MS) return cachedKeys;

  let body: { keys?: JwkKey[] };
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = await res.json() as { keys?: JwkKey[] };
  } catch {
    // Si el endpoint JWKS no responde, usar las claves anteriores (stale) si existen.
    // Evita que un corte breve de Supabase tire abajo todas las rutas protegidas.
    if (cachedKeys) return cachedKeys;
    throw new UnauthorizedException('No se pudo validar el token. Intentá de nuevo.');
  }

  const keys = new Map<string, string>();
  for (const jwk of body.keys ?? []) {
    if (!jwk.kid) continue;
    keys.set(
      jwk.kid,
      createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' }) as string,
    );
  }

  cachedKeys = keys;
  cachedAt = now;
  return keys;
}

function throwTokenError(err: unknown): never {
  const isExpired = err instanceof Error && err.name === 'TokenExpiredError';
  throw new UnauthorizedException(
    isExpired ? 'La sesión expiró. Iniciá sesión de nuevo.' : 'Token inválido.',
  );
}

export async function verifySupabaseJwt(
  token: string,
  options: { jwtSecret: string; supabaseUrl: string },
): Promise<SupabaseJwtPayload> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') {
    throw new UnauthorizedException('Token inválido.');
  }

  const alg = decoded.header.alg;

  try {
    if (alg === 'HS256') {
      if (!options.jwtSecret) {
        throw new UnauthorizedException(
          'El servidor no está configurado correctamente (SUPABASE_JWT_SECRET faltante).',
        );
      }
      return jwt.verify(token, options.jwtSecret) as SupabaseJwtPayload;
    }

    if (ASYMMETRIC_ALGS.has(alg ?? '')) {
      if (!options.supabaseUrl) {
        throw new UnauthorizedException(
          'El servidor no está configurado correctamente (SUPABASE_URL faltante).',
        );
      }

      const kid = decoded.header.kid;
      if (!kid) throw new UnauthorizedException('Token inválido.');

      let keys = await getJwksKeys(options.supabaseUrl);
      let publicKey = keys.get(kid);

      // Si el kid no está en cache, puede ser rotación de claves → refrescar una vez.
      if (!publicKey) {
        cachedKeys = null;
        keys = await getJwksKeys(options.supabaseUrl);
        publicKey = keys.get(kid);
      }

      if (!publicKey) throw new UnauthorizedException('Token inválido.');

      // jwt.verify con clave PEM y algoritmo conocido es sincrónico — no necesita wrapper de Promise.
      return jwt.verify(token, publicKey, {
        algorithms: [alg as jwt.Algorithm],
      }) as SupabaseJwtPayload;
    }
  } catch (err) {
    if (err instanceof UnauthorizedException) throw err;
    throwTokenError(err);
  }

  throw new UnauthorizedException('Token inválido.');
}

/** Solo para tests: limpia el cache de JWKS entre casos. */
export function resetJwksCacheForTests(): void {
  cachedKeys = null;
  cachedAt = 0;
}
