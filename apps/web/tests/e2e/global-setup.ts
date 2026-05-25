import { request, chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const AUTH_FILE = 'tests/e2e/.auth/dueno.json';

/**
 * Prepara el entorno E2E: usuario en la API + sesión guardada para reutilizar.
 * Requiere la API en E2E_API_URL (default :3001).
 */
export default async function globalSetup() {
  const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3001';
  const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
  const email = process.env.E2E_EMAIL ?? 'e2e@posta-test.com';
  const password = process.env.E2E_PASSWORD ?? 'password123456';

  const ctx = await request.newContext();

  const loginRes = await ctx.post(`${apiUrl}/api/v1/auth/login`, {
    data: { email, password },
  });

  if (!loginRes.ok()) {
    const registroRes = await ctx.post(`${apiUrl}/api/v1/auth/registro`, {
      data: { email, password, nombreTenant: 'E2E Test' },
    });
    if (!registroRes.ok()) {
      const body = await registroRes.text();
      throw new Error(
        `No se pudo preparar el usuario E2E. ¿Está corriendo la API en ${apiUrl}? ${body}`,
      );
    }
  }

  mkdirSync(dirname(AUTH_FILE), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.getByRole('heading', { name: 'Inventario' }).waitFor({ timeout: 30_000 });
  await page.context().storageState({ path: AUTH_FILE });
  await browser.close();
}

export { AUTH_FILE };
