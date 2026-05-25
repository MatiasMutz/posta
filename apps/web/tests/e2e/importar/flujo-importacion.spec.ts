import { test, expect } from '@playwright/test';
import { resolve } from 'path';

const CSV = resolve(__dirname, '../fixtures/productos-ui-test.csv');

test('flujo importación inventario UI', async ({ page }) => {
  const email = `ui-import-${Date.now()}@posta-test.com`;
  const password = 'password123456';

  await page.goto('/login');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByPlaceholder('Ej: Kiosco Don Juan').fill('UI Import Test');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.getByRole('heading', { name: 'Inventario' }).waitFor({ timeout: 30_000 });

  await page.goto('/importar');
  await expect(page.getByRole('heading', { name: 'Importar datos' })).toBeVisible();

  await page.getByRole('button', { name: 'Inventario (productos)' }).click();
  await page.locator('input[type="file"]').setInputFiles(CSV);

  await expect(page.getByText('productos-ui-test.csv')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Auto ✓').first()).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Importar' }).click();
  await page.waitForURL(/\/importar\/[a-f0-9-]+/, { timeout: 15_000 });

  await expect(page.getByText('¡Importación completada!')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/importaron \d+ registros correctamente/)).toBeVisible();

  await page.getByRole('link', { name: /Ver inventario/i }).click();
  await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible();
  await expect(page.getByText('UI Test Producto A')).toBeVisible();
  await expect(page.getByText('UI Test Producto B')).toBeVisible();
});
