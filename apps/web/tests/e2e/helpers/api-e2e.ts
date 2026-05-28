import type { APIRequestContext } from '@playwright/test';

export const E2E_API_URL = process.env.E2E_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const E2E_EMAIL = process.env.E2E_EMAIL ?? 'e2e@posta-test.com';
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'password123456';

let tokenDuenoCache: string | null = null;

/** Fetch con reintentos ante 429 (suite E2E hace muchos logins si la API no tiene THROTTLE_ENABLED=0). */
export async function apiFetchE2E(
  request: APIRequestContext,
  url: string,
  opts: Parameters<APIRequestContext['fetch']>[1] = {},
  label = url,
): Promise<Awaited<ReturnType<APIRequestContext['fetch']>>> {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await request.fetch(url, opts);
    if (res.status() !== 429 || attempt === 6) {
      if (!res.ok() && res.status() === 429) {
        throw new Error(
          `${label} respondió 429. Reiniciá la API con THROTTLE_ENABLED=0 (pnpm dev:api) o cerrá instancias viejas en :3001.`,
        );
      }
      return res;
    }
    await new Promise((r) => setTimeout(r, attempt * 1500));
  }
  throw new Error(`${label}: error inesperado tras reintentos`);
}

/** Token del dueño E2E; se cachea por worker para no spamear POST /auth/login. */
export async function loginDuenoE2E(request: APIRequestContext): Promise<string> {
  if (tokenDuenoCache) return tokenDuenoCache;

  let res = await apiFetchE2E(
    request,
    `${E2E_API_URL}/api/v1/auth/login`,
    { method: 'POST', data: { email: E2E_EMAIL, password: E2E_PASSWORD } },
    'POST /auth/login',
  );

  if (!res.ok()) {
    await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/auth/registro`,
      {
        method: 'POST',
        data: { email: E2E_EMAIL, password: E2E_PASSWORD, nombreTenant: 'E2E Test' },
      },
      'POST /auth/registro',
    );
    res = await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/auth/login`,
      { method: 'POST', data: { email: E2E_EMAIL, password: E2E_PASSWORD } },
      'POST /auth/login',
    );
  }

  if (!res.ok()) {
    throw new Error(`No se pudo autenticar dueño E2E: ${await res.text()}`);
  }

  const { data: { access_token } } = (await res.json()) as { data: { access_token: string } };
  tokenDuenoCache = access_token;
  return access_token;
}
