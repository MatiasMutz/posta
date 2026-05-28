import { test, expect } from '@playwright/test';
import { registrarDuenoPorUI, loginPorUI } from '../helpers/auth-ui';
import { asegurarProductoPosConStock } from '../helpers/seed-pos';
import { esperarProductoEnPOS, irAlPOS } from '../helpers/pos-ui';

test.describe('Auth', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('registro y login redirigen a inventario', async ({ page }) => {
    const email = `auth-smoke-${Date.now()}@posta-test.com`;
    const password = 'password123456';

    await registrarDuenoPorUI(page, {
      email,
      password,
      nombreTenant: 'Auth Smoke Test',
    });

    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await loginPorUI(page, { email, password, destino: /\/inventario/ });
    await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible({ timeout: 15_000 });
  });

  test('login con credenciales inválidas muestra error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('no-existe@posta-test.com');
    await page.getByLabel('Contraseña').fill('wrongpassword123');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('POS — seed producto', () => {
  let nombreProducto = '';

  test.beforeAll(async ({ request }) => {
    nombreProducto = await asegurarProductoPosConStock(request);
  });

  test('POS encuentra producto seedeado', async ({ page }) => {
    await irAlPOS(page);
    await esperarProductoEnPOS(page, nombreProducto);
  });
});
