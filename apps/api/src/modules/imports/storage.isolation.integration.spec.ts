/**
 * Aislamiento cross-tenant en Supabase Storage (bucket imports).
 * Verifica policies RLS con JWT real (auth.jwt() → app_metadata.tenant_id).
 * Corre con: pnpm test:integration (requiere Supabase local + SUPABASE_* en .env).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

const skip = !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !JWT_SECRET;

const IMPORTS_BUCKET = 'imports';

function crearJwtTenant(tenantId: string): string {
  return jwt.sign(
    {
      sub: randomUUID(),
      role: 'authenticated',
      app_metadata: { tenant_id: tenantId, rol: 'dueno' },
    },
    JWT_SECRET!,
    { algorithm: 'HS256', expiresIn: '1h' },
  );
}

function clienteAutenticado(token: string): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

describe.skipIf(skip)('Aislamiento Storage: bucket imports (JWT)', () => {
  const tenantAId = randomUUID();
  const tenantBId = randomUUID();
  const storagePathA = `${tenantAId}/isolation-test-${Date.now()}.txt`;
  const contenido = 'contenido-aislamiento-storage';

  let admin: SupabaseClient;

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const tokenA = crearJwtTenant(tenantAId);
    const clienteA = clienteAutenticado(tokenA);

    const { error } = await clienteA.storage
      .from(IMPORTS_BUCKET)
      .upload(storagePathA, Buffer.from(contenido), { contentType: 'text/plain', upsert: true });

    expect(error).toBeNull();
  });

  afterAll(async () => {
    await admin.storage.from(IMPORTS_BUCKET).remove([storagePathA]);
  });

  it('tenant A lee su propio archivo', async () => {
    const tokenA = crearJwtTenant(tenantAId);
    const clienteA = clienteAutenticado(tokenA);

    const { data, error } = await clienteA.storage.from(IMPORTS_BUCKET).download(storagePathA);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    const texto = await data!.text();
    expect(texto).toBe(contenido);
  });

  it('tenant B no descarga archivo del tenant A', async () => {
    const tokenB = crearJwtTenant(tenantBId);
    const clienteB = clienteAutenticado(tokenB);

    const { data, error } = await clienteB.storage.from(IMPORTS_BUCKET).download(storagePathA);

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('tenant B no sube archivo en carpeta del tenant A', async () => {
    const tokenB = crearJwtTenant(tenantBId);
    const clienteB = clienteAutenticado(tokenB);
    const pathIntruso = `${tenantAId}/intrusion-${Date.now()}.txt`;

    const { error } = await clienteB.storage
      .from(IMPORTS_BUCKET)
      .upload(pathIntruso, Buffer.from('intruso'), { contentType: 'text/plain', upsert: true });

    expect(error).not.toBeNull();
  });

  it('tenant B no lista archivos del tenant A', async () => {
    const tokenB = crearJwtTenant(tenantBId);
    const clienteB = clienteAutenticado(tokenB);

    const { data, error } = await clienteB.storage.from(IMPORTS_BUCKET).list(tenantAId);

    expect(error).toBeNull();
    const nombres = (data ?? []).map((o) => o.name);
    expect(nombres).not.toContain(storagePathA.split('/').pop());
  });
});
