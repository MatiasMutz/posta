import { expect, type APIRequestContext, type Page } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const ESPERA_NAV = { timeout: 60_000, waitUntil: 'domcontentloaded' as const };

function nombreCookieSupabase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const hostname = new URL(url).hostname;
  const ref = hostname === '127.0.0.1' ? '127' : hostname.split('.')[0];
  return `sb-${ref}-auth-token`;
}

function decodificarJwt(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('JWT inválido');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
}

function rutaInicioPorRol(rol: string | undefined): string {
  switch (rol) {
    case 'vendedor':
      return '/ventas';
    case 'contador':
      return '/contador';
    default:
      return '/dashboard';
  }
}

function rolDesdeJwt(access_token: string): string | undefined {
  const meta = decodificarJwt(access_token).app_metadata as Record<string, unknown> | undefined;
  return typeof meta?.rol === 'string' ? meta.rol : undefined;
}

async function obtenerRolUsuario(
  request: APIRequestContext,
  access_token: string,
): Promise<string> {
  const rolJwt = rolDesdeJwt(access_token);
  if (rolJwt) return rolJwt;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const meRes = await request.get(`${API_URL}/api/v1/tenants/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (meRes.ok()) {
      const { data: { rol } } = (await meRes.json()) as { data: { rol: string } };
      return rol;
    }
    if (meRes.status() === 429 && attempt < 5) {
      await new Promise((r) => setTimeout(r, attempt * 2000));
      continue;
    }
    throw new Error(`GET /tenants/me falló (${meRes.status()}): ${await meRes.text()}`);
  }
  throw new Error('GET /tenants/me: error inesperado tras reintentos');
}

/** Establece sesión Supabase en el browser sin pasar por el form de login (evita races post-registro). */
export async function establecerSesionDesdeTokens(
  page: Page,
  request: APIRequestContext,
  access_token: string,
  refresh_token: string,
): Promise<string> {
  const payload = decodificarJwt(access_token);
  const expires_at = (payload.exp as number | undefined) ?? Math.floor(Date.now() / 1000) + 3600;
  const rol = await obtenerRolUsuario(request, access_token);
  const destino = rutaInicioPorRol(rol);

  const session = {
    access_token,
    refresh_token,
    token_type: 'bearer',
    expires_in: Math.max(expires_at - Math.floor(Date.now() / 1000), 60),
    expires_at,
    user: {
      id: payload.sub as string,
      aud: 'authenticated',
      role: 'authenticated',
      email: payload.email as string,
      app_metadata: payload.app_metadata ?? {},
      user_metadata: payload.user_metadata ?? {},
    },
  };

  const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;

  await page.context().addCookies([
    {
      name: nombreCookieSupabase(),
      value: cookieValue,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
      expires: expires_at,
    },
  ]);

  const origin = process.env.E2E_BASE_URL ?? '';
  await page.goto(`${origin}${destino}`, ESPERA_NAV);
  return destino;
}

async function esperarRedirect(page: Page, destino: RegExp): Promise<void> {
  try {
    await page.waitForURL(destino, ESPERA_NAV);
  } catch {
    const alert = page.locator('[role="alert"]').filter({ hasText: /.+/ });
    if (await alert.isVisible().catch(() => false)) {
      throw new Error(`Error en formulario: ${(await alert.textContent())?.trim()}`);
    }
    throw new Error(`No se redirigió a ${destino} (quedó en ${page.url()})`);
  }
}

/** Registro vía API + sesión en browser (estable para specs que no prueban el form de registro). */
export async function registrarDuenoRapido(
  page: Page,
  request: APIRequestContext,
  opts: { email: string; password: string; nombreTenant: string },
): Promise<void> {
  const res = await request.post(`${API_URL}/api/v1/auth/registro`, {
    data: {
      email: opts.email,
      password: opts.password,
      nombreTenant: opts.nombreTenant,
    },
  });
  if (!res.ok()) {
    throw new Error(`Registro API falló (${res.status()}): ${await res.text()}`);
  }

  const { data: { access_token, refresh_token } } = (await res.json()) as {
    data: { access_token: string; refresh_token: string };
  };

  await establecerSesionDesdeTokens(page, request, access_token, refresh_token);
  await expect(page.getByRole('heading', { name: /Buenos días|Buenas tardes|Buenas noches/ })).toBeVisible({ timeout: 15_000 });
}

/** Registro de dueño por UI (solo specs de auth). */
export async function registrarDuenoPorUI(
  page: Page,
  opts: { email: string; password: string; nombreTenant: string },
): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByPlaceholder('Ej: Kiosco Don Juan').fill(opts.nombreTenant);
  await page.getByLabel('Email').fill(opts.email);
  await page.getByLabel('Contraseña').fill(opts.password);
  await page.locator('form button[type="submit"]').click();
  await esperarRedirect(page, /\/dashboard/);
  await expect(page.getByRole('heading', { name: /Buenos días|Buenas tardes|Buenas noches/ })).toBeVisible({ timeout: 15_000 });
}

/** Login por UI; espera redirect según rol (dueño → dashboard por defecto). */
export async function loginPorUI(
  page: Page,
  opts: { email: string; password: string; destino?: RegExp },
): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Ingresar' }).first().click();
  await page.getByLabel('Email').fill(opts.email);
  await page.getByLabel('Contraseña').fill(opts.password);
  await page.locator('form button[type="submit"]').click();
  await esperarRedirect(page, opts.destino ?? /\/dashboard/);
}
