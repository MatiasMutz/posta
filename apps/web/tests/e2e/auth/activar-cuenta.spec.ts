import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiFetchE2E, E2E_API_URL, loginDuenoE2E } from '../helpers/api-e2e';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001';
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

function loadApiEnv() {
  const envPath = resolve(__dirname, '../../../../api/.env');
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

async function invitarVendedor(request: APIRequestContext, email: string) {
  const duenoToken = await loginDuenoE2E(request);

  const inviteRes = await apiFetchE2E(
    request,
    `${E2E_API_URL}/api/v1/tenants/usuarios/invitar`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${duenoToken}` },
      data: { email, rol: 'vendedor' },
    },
    'POST /tenants/usuarios/invitar',
  );
  if (!inviteRes.ok()) throw new Error(`Invitar falló: ${await inviteRes.text()}`);
}

test.describe('Activar cuenta', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('vendedor activa cuenta desde link de invitación y queda en punto de venta', async ({ page, request }, testInfo) => {
    loadApiEnv();
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      test.skip(true, 'Se requiere SUPABASE_SERVICE_ROLE_KEY para este test');
      return;
    }

    const vendedorEmail = `e2e-activar-${Date.now()}-${testInfo.project.name}@posta-test.com`;
    await invitarVendedor(request, vendedorEmail);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email: vendedorEmail,
      options: { redirectTo: `${BASE_URL}/activar-cuenta` },
    });
    if (linkError || !linkData?.properties?.action_link) {
      throw new Error(linkError?.message ?? 'No se pudo generar el link de invitación');
    }

    await page.goto(linkData.properties.action_link);
    await expect(page.getByRole('heading', { name: 'Activá tu cuenta' })).toBeVisible({ timeout: 15_000 });

    const inputs = page.locator('input[type="password"]');
    await expect(inputs.first()).toBeVisible({ timeout: 10_000 });

    const nuevaPassword = `nuevapass${Date.now()}`;
    await inputs.first().fill(nuevaPassword);
    await inputs.last().fill(nuevaPassword);

    await Promise.all([
      page.waitForURL(/\/ventas/, { timeout: 30_000, waitUntil: 'domcontentloaded' }),
      page.getByRole('button', { name: 'Activar cuenta' }).click(),
    ]);

    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible({ timeout: 15_000 });
  });
});
