import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { resetJwksCacheForTests, verifySupabaseJwt } from './jwt-verifier';

const SECRET = 'test-jwt-secret-at-least-32-chars-long';
const SUPABASE_URL = 'https://example.supabase.co';

beforeEach(() => {
  resetJwksCacheForTests();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const validPayload = {
  sub: 'user-1',
  role: 'authenticated',
  app_metadata: { tenant_id: 'tenant-1', rol: 'dueno' },
};

// ── HS256 ──────────────────────────────────────────────────────────────────────

describe('verifySupabaseJwt — HS256', () => {
  it('verifica token válido con el secret correcto', async () => {
    const token = jwt.sign(validPayload, SECRET, { algorithm: 'HS256', expiresIn: '1h' });
    const result = await verifySupabaseJwt(token, { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL });
    expect(result.sub).toBe('user-1');
    expect(result.app_metadata.tenant_id).toBe('tenant-1');
  });

  it('rechaza si SUPABASE_JWT_SECRET está vacío', async () => {
    const token = jwt.sign(validPayload, SECRET, { algorithm: 'HS256' });
    await expect(
      verifySupabaseJwt(token, { jwtSecret: '', supabaseUrl: SUPABASE_URL }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza token firmado con secret distinto', async () => {
    const token = jwt.sign(validPayload, 'otro-secret-completamente-diferente-32ch', { algorithm: 'HS256' });
    await expect(
      verifySupabaseJwt(token, { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL }),
    ).rejects.toMatchObject({ message: 'Token inválido.' });
  });

  it('devuelve mensaje de sesión expirada para TokenExpiredError', async () => {
    const token = jwt.sign(validPayload, SECRET, { algorithm: 'HS256', expiresIn: -1 });
    await expect(
      verifySupabaseJwt(token, { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL }),
    ).rejects.toMatchObject({ message: 'La sesión expiró. Iniciá sesión de nuevo.' });
  });
});

// ── ES256 (JWKS) ───────────────────────────────────────────────────────────────

describe('verifySupabaseJwt — ES256 (JWKS)', () => {
  async function setup() {
    const { generateKeyPairSync } = await import('node:crypto');
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const jwk = { ...publicKey.export({ format: 'jwk' }) as object, kid: 'test-kid' };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ keys: [jwk] }),
    }));

    const token = jwt.sign(validPayload, privateKey, {
      algorithm: 'ES256',
      keyid: 'test-kid',
      expiresIn: '1h',
    });

    return { token, jwk };
  }

  it('verifica token ES256 usando JWKS de Supabase', async () => {
    const { token } = await setup();
    const result = await verifySupabaseJwt(token, { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL });
    expect(result.sub).toBe('user-1');
    expect(result.app_metadata.tenant_id).toBe('tenant-1');
  });

  it('cachea las claves: solo llama a fetch una vez en requests consecutivos', async () => {
    const { token } = await setup();
    await verifySupabaseJwt(token, { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL });
    await verifySupabaseJwt(token, { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('refresca claves si el kid no está en cache (rotación de claves)', async () => {
    const { generateKeyPairSync } = await import('node:crypto');
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const jwk = { ...publicKey.export({ format: 'jwk' }) as object, kid: 'kid-nuevo' };
    const token = jwt.sign(validPayload, privateKey, { algorithm: 'ES256', keyid: 'kid-nuevo', expiresIn: '1h' });

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ keys: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ keys: [jwk] }) } as Response),
    );

    const result = await verifySupabaseJwt(token, { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL });
    expect(result.sub).toBe('user-1');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it('usa claves stale si el endpoint JWKS no responde', async () => {
    const { token } = await setup();
    await verifySupabaseJwt(token, { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await verifySupabaseJwt(token, { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL });
    expect(result.sub).toBe('user-1');
  });

  it('rechaza si SUPABASE_URL está vacío', async () => {
    const { generateKeyPairSync } = await import('node:crypto');
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const token = jwt.sign(validPayload, privateKey, { algorithm: 'ES256', keyid: 'k', expiresIn: '1h' });
    await expect(
      verifySupabaseJwt(token, { jwtSecret: SECRET, supabaseUrl: '' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

// ── Algoritmos no soportados ───────────────────────────────────────────────────

describe('verifySupabaseJwt — algoritmos no soportados', () => {
  it('rechaza alg: none (ataque de bypass de firma)', async () => {
    const token = jwt.sign(validPayload, SECRET, { algorithm: 'HS256' });
    const [header, ...rest] = token.split('.');
    const hdr = JSON.parse(Buffer.from(header, 'base64url').toString());
    hdr.alg = 'none';
    const tampered = [Buffer.from(JSON.stringify(hdr)).toString('base64url'), ...rest].join('.');

    await expect(
      verifySupabaseJwt(tampered, { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL }),
    ).rejects.toMatchObject({ message: 'Token inválido.' });
  });

  it('rechaza tokens malformados', async () => {
    await expect(
      verifySupabaseJwt('not.a.jwt', { jwtSecret: SECRET, supabaseUrl: SUPABASE_URL }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
