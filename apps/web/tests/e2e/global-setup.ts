import { request, chromium, type APIRequestContext, type Browser } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { establecerSesionDesdeTokens } from './helpers/auth-ui';
const AUTH_DIR = 'tests/e2e/.auth';
export const AUTH_DUENO = `${AUTH_DIR}/dueno.json`;
export const AUTH_VENDEDOR = `${AUTH_DIR}/vendedor.json`;
export const AUTH_CONTADOR = `${AUTH_DIR}/contador.json`;

const DUENO_EMAIL = process.env.E2E_EMAIL ?? 'e2e@posta-test.com';
const DUENO_PASSWORD = process.env.E2E_PASSWORD ?? 'password123456';
const VENDEDOR_EMAIL = process.env.E2E_VENDEDOR_EMAIL ?? 'e2e-vendedor@posta-test.com';
const CONTADOR_EMAIL = process.env.E2E_CONTADOR_EMAIL ?? 'e2e-contador@posta-test.com';
const ROLE_PASSWORD = process.env.E2E_ROLE_PASSWORD ?? DUENO_PASSWORD;

function loadApiEnv() {
  const envPath = resolve(__dirname, '../../../api/.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

async function waitForApi(apiUrl: string, maxMs = 120_000) {
  const deadline = Date.now() + maxMs;
  const ctx = await request.newContext();
  while (Date.now() < deadline) {
    try {
      const res = await ctx.get(`${apiUrl}/api/v1/health`);
      if (res.ok()) {
        await ctx.dispose();
        return;
      }
    } catch {
      // API aún no levantó
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  await ctx.dispose();
  throw new Error(`API no respondió en ${apiUrl} tras ${maxMs}ms`);
}

async function apiFetch(
  ctx: APIRequestContext,
  url: string,
  opts: Parameters<APIRequestContext['fetch']>[1] = {},
  label = url,
): Promise<Awaited<ReturnType<APIRequestContext['fetch']>>> {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await ctx.fetch(url, opts);
    if (res.status() !== 429 || attempt === maxAttempts) {
      if (!res.ok() && res.status() === 429) {
        const body = await res.text();
        throw new Error(
          `${label} respondió 429 (rate limit). Reiniciá la API con THROTTLE_ENABLED=0 ` +
          `(pnpm dev:api o ./scripts/ci/write-e2e-env.sh). Detalle: ${body}`,
        );
      }
      return res;
    }
    await new Promise((r) => setTimeout(r, attempt * 2000));
  }
  throw new Error(`${label}: error inesperado tras reintentos`);
}

async function obtenerTenantIdDueno(apiCtx: APIRequestContext, duenoToken: string): Promise<string> {
  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3001';
  const meRes = await apiFetch(
    apiCtx,
    `${apiUrl}/api/v1/tenants/me`,
    { headers: { Authorization: `Bearer ${duenoToken}` } },
    'GET /tenants/me',
  );
  if (!meRes.ok()) {
    const body = await meRes.text();
    throw new Error(`No se pudo obtener tenant del dueño E2E (${meRes.status()}): ${body}`);
  }
  return ((await meRes.json()) as { data: { id: string } }).data.id;
}

async function ensureDueno(apiUrl: string, email: string, password: string) {
  const ctx = await request.newContext();
  let loginRes = await apiFetch(ctx, `${apiUrl}/api/v1/auth/login`, {
    method: 'POST',
    data: { email, password },
  }, 'POST /auth/login');
  if (!loginRes.ok()) {
    const registroRes = await apiFetch(ctx, `${apiUrl}/api/v1/auth/registro`, {
      method: 'POST',
      data: { email, password, nombreTenant: 'E2E Test' },
    }, 'POST /auth/registro');
    if (!registroRes.ok()) {
      const body = await registroRes.text();
      throw new Error(`No se pudo preparar el dueño E2E: ${body}`);
    }
    loginRes = await apiFetch(ctx, `${apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      data: { email, password },
    }, 'POST /auth/login');
  }
  if (!loginRes.ok()) {
    const body = await loginRes.text();
    throw new Error(`Login dueño E2E falló (${loginRes.status()}): ${body}`);
  }
  const body = await loginRes.json() as { data: { access_token: string } };
  await ctx.dispose();
  return body.data.access_token;
}

function createSupabaseAdmin(supabaseUrl: string, serviceRoleKey: string): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function buscarUsuarioAuth(
  admin: SupabaseClient,
  email: string,
): Promise<{ id: string } | undefined> {
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 200 });
  return listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

async function sincronizarUsuarioE2E(
  admin: SupabaseClient,
  userId: string,
  tenantId: string,
  rol: 'vendedor' | 'contador',
): Promise<void> {
  await admin.auth.admin.updateUserById(userId, {
    password: ROLE_PASSWORD,
    email_confirm: true,
    app_metadata: { tenant_id: tenantId, rol },
  });
}

async function limpiarEstadoInvitacion(
  apiCtx: APIRequestContext,
  duenoToken: string,
  admin: SupabaseClient,
  email: string,
): Promise<void> {
  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3001';
  const listRes = await apiFetch(
    apiCtx,
    `${apiUrl}/api/v1/tenants/usuarios`,
    { headers: { Authorization: `Bearer ${duenoToken}` } },
    'GET /tenants/usuarios',
  );
  if (!listRes.ok()) return;

  const { data } = (await listRes.json()) as {
    data: {
      miembros: Array<{ id: string; user_id: string }>;
      invitacionesPendientes: Array<{ id: string; email: string }>;
    };
  };

  for (const inv of data.invitacionesPendientes) {
    if (inv.email.toLowerCase() !== email.toLowerCase()) continue;
    await apiFetch(
      apiCtx,
      `${apiUrl}/api/v1/tenants/usuarios/invitaciones/${inv.id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${duenoToken}` } },
      `DELETE /tenants/usuarios/invitaciones/${inv.id}`,
    );
  }

  for (const miembro of data.miembros) {
    const { data: userData, error } = await admin.auth.admin.getUserById(miembro.user_id);
    const authUser = userData.user;
    const esHuerfano = !!error || !authUser;
    const esMismoEmail = authUser?.email?.toLowerCase() === email.toLowerCase();
    if (!esHuerfano && !esMismoEmail) continue;

    await apiFetch(
      apiCtx,
      `${apiUrl}/api/v1/tenants/usuarios/${miembro.id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${duenoToken}` } },
      `DELETE /tenants/usuarios/${miembro.id}`,
    );
  }
}

async function invitarMiembroE2E(
  apiCtx: APIRequestContext,
  duenoToken: string,
  email: string,
  rol: 'vendedor' | 'contador',
) {
  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3001';
  return apiFetch(
    apiCtx,
    `${apiUrl}/api/v1/tenants/usuarios/invitar`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${duenoToken}` },
      data: { email, rol },
    },
    `POST /tenants/usuarios/invitar (${rol})`,
  );
}

async function ensureMemberViaInvite(
  apiCtx: APIRequestContext,
  duenoToken: string,
  tenantId: string,
  email: string,
  rol: 'vendedor' | 'contador',
  supabaseUrl: string,
  serviceRoleKey: string,
) {
  const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey);

  let user = await buscarUsuarioAuth(admin, email);
  if (user) {
    await sincronizarUsuarioE2E(admin, user.id, tenantId, rol);
    return;
  }

  await limpiarEstadoInvitacion(apiCtx, duenoToken, admin, email);

  let inviteRes = await invitarMiembroE2E(apiCtx, duenoToken, email, rol);
  if (!inviteRes.ok()) {
    const text = await inviteRes.text();
    const esConflicto =
      inviteRes.status() === 409 &&
      (text.toLowerCase().includes('invitación pendiente') || text.toLowerCase().includes('ya tiene'));

    if (esConflicto) {
      await limpiarEstadoInvitacion(apiCtx, duenoToken, admin, email);
      inviteRes = await invitarMiembroE2E(apiCtx, duenoToken, email, rol);
    }

    if (!inviteRes.ok()) {
      throw new Error(`Invitar ${email} (${rol}): ${await inviteRes.text()}`);
    }
  }

  for (let attempt = 1; attempt <= 10; attempt++) {
    user = await buscarUsuarioAuth(admin, email);
    if (user) break;
    await new Promise((r) => setTimeout(r, attempt * 500));
  }

  if (!user) {
    throw new Error(
      `Usuario ${email} no encontrado tras invitar. ` +
      'Revisá Supabase local y borrá invitaciones/miembros huérfanos del tenant E2E.',
    );
  }

  await sincronizarUsuarioE2E(admin, user.id, tenantId, rol);
}

async function saveStorageState(
  baseURL: string,
  apiUrl: string,
  email: string,
  password: string,
  path: string,
  browser: Browser,
  rol: 'dueno' | 'vendedor' | 'contador',
) {
  const expectations = {
    dueno: { heading: /Inventario/i },
    vendedor: { heading: /Punto de venta/i },
    contador: { heading: /Historial de ventas/i },
  } as const;
  const { heading } = expectations[rol];

  const apiCtx = await request.newContext();
  const loginRes = await apiFetch(
    apiCtx,
    `${apiUrl}/api/v1/auth/login`,
    { method: 'POST', data: { email, password } },
    `POST /auth/login (${email})`,
  );
  if (!loginRes.ok()) {
    throw new Error(`Login E2E falló para ${email}: ${await loginRes.text()}`);
  }
  const { data: { access_token, refresh_token } } = (await loginRes.json()) as {
    data: { access_token: string; refresh_token: string };
  };

  const page = await browser.newPage();
  await establecerSesionDesdeTokens(page, apiCtx, access_token, refresh_token);
  await page.getByRole('heading', { name: heading }).waitFor({ timeout: 30_000 });
  mkdirSync(dirname(path), { recursive: true });
  const state = await page.context().storageState();
  writeFileSync(path, JSON.stringify(state, null, 2));
  await page.close();
  await apiCtx.dispose();
}

/** Prepara usuarios y archivos .auth/* (correr con API y web ya levantados). */
export async function prepareE2EAuthStates() {
  loadApiEnv();
  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3001';
  const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  await waitForApi(apiUrl);
  mkdirSync(AUTH_DIR, { recursive: true });

  const duenoToken = await ensureDueno(apiUrl, DUENO_EMAIL, DUENO_PASSWORD);
  const apiCtx = await request.newContext();

  if (supabaseUrl && serviceRoleKey) {
    const tenantId = await obtenerTenantIdDueno(apiCtx, duenoToken);
    await ensureMemberViaInvite(apiCtx, duenoToken, tenantId, VENDEDOR_EMAIL, 'vendedor', supabaseUrl, serviceRoleKey);
    await ensureMemberViaInvite(apiCtx, duenoToken, tenantId, CONTADOR_EMAIL, 'contador', supabaseUrl, serviceRoleKey);
  }

  const browser = await chromium.launch();
  await saveStorageState(baseURL, apiUrl, DUENO_EMAIL, DUENO_PASSWORD, AUTH_DUENO, browser, 'dueno');
  if (supabaseUrl && serviceRoleKey) {
    await saveStorageState(baseURL, apiUrl, VENDEDOR_EMAIL, ROLE_PASSWORD, AUTH_VENDEDOR, browser, 'vendedor');
    await saveStorageState(baseURL, apiUrl, CONTADOR_EMAIL, ROLE_PASSWORD, AUTH_CONTADOR, browser, 'contador');
  }
  await browser.close();
  await apiCtx.dispose();
}

/** Playwright globalSetup: solo crea directorio; auth corre en auth.setup.ts tras webServer. */
export default async function globalSetup() {
  mkdirSync(dirname(AUTH_DUENO), { recursive: true });
  if (process.env.E2E_PREPARE_AUTH_IN_GLOBAL === '1') {
    await prepareE2EAuthStates();
  }
}

export { AUTH_DUENO as AUTH_FILE };
