import { test, expect } from '@playwright/test';
import { resolve } from 'path';
import { registrarDuenoRapido } from '../helpers/auth-ui';
import { esperarImportacionCompletada, irAImportar, subirArchivoImport } from '../helpers/import-ui';

const CSV = resolve(__dirname, '../fixtures/productos-ui-test.csv');

test.use({ storageState: { cookies: [], origins: [] } });

test('flujo importación inventario UI', async ({ page, request }) => {
  const email = `ui-import-${Date.now()}@posta-test.com`;
  const password = 'password123456';

  await registrarDuenoRapido(page, request, {
    email,
    password,
    nombreTenant: 'UI Import Test',
  });

  await irAImportar(page);
  await subirArchivoImport(page, 'Inventario (productos)', CSV, 'productos-ui-test.csv');
  await expect(page.getByText('Auto ✓').first()).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Importar' }).click();
  await page.waitForURL(/\/importar\/[a-f0-9-]+/, { timeout: 15_000 });

  await esperarImportacionCompletada(page);
  await expect(page.getByText(/importaron \d+ registros correctamente/)).toBeVisible();

  await page.getByRole('link', { name: /Ver inventario/i }).click();
  await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible();
  await expect(page.getByText('UI Test Producto A')).toBeVisible();
  await expect(page.getByText('UI Test Producto B')).toBeVisible();
});
