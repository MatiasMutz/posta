import { test, expect } from '@playwright/test';
import { resolve } from 'path';
import { registrarDuenoRapido } from '../helpers/auth-ui';
import { esperarImportacionCompletada, irAImportar, subirArchivoImport } from '../helpers/import-ui';

const CSV = resolve(__dirname, '../fixtures/clientes-ui-test.csv');

test.use({ storageState: { cookies: [], origins: [] } });

test('flujo importación clientes UI', async ({ page, request }) => {
  const email = `ui-clientes-${Date.now()}@posta-test.com`;
  const password = 'password123456';

  await registrarDuenoRapido(page, request, {
    email,
    password,
    nombreTenant: 'UI Clientes Import',
  });

  await irAImportar(page);
  await subirArchivoImport(page, 'Clientes', CSV, 'clientes-ui-test.csv');
  await page.getByRole('button', { name: 'Importar' }).click();
  await page.waitForURL(/\/importar\/[a-f0-9-]+/, { timeout: 15_000 });

  await esperarImportacionCompletada(page);

  await page.getByRole('link', { name: /Ver clientes/i }).click();
  await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible();
  await expect(page.getByText('Cliente UI Import A')).toBeVisible();
  await expect(page.getByText('Cliente UI Import B')).toBeVisible();
});
