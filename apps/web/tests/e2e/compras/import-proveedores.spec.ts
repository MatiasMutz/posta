import { test, expect } from '@playwright/test';
import { resolve } from 'path';
import { registrarDuenoRapido } from '../helpers/auth-ui';
import { esperarImportacionCompletada, irAImportar, subirArchivoImport } from '../helpers/import-ui';

const CSV = resolve(__dirname, '../fixtures/proveedores-saldos.csv');

test.use({ storageState: { cookies: [], origins: [] } });

test('flujo importación proveedores con saldo', async ({ page, request }) => {
  const email = `ui-proveedores-${Date.now()}@posta-test.com`;
  const password = 'password123456';

  await registrarDuenoRapido(page, request, {
    email,
    password,
    nombreTenant: 'UI Proveedores Import',
  });

  await irAImportar(page);
  await subirArchivoImport(page, 'Proveedores (saldos iniciales)', CSV, 'proveedores-saldos.csv');
  await page.getByRole('button', { name: 'Importar' }).click();
  await page.waitForURL(/\/importar\/[a-f0-9-]+/, { timeout: 15_000 });

  await esperarImportacionCompletada(page);

  await page.getByRole('link', { name: /Ver proveedores/i }).click();
  await expect(page.getByRole('heading', { name: 'Proveedores' })).toBeVisible();
  await expect(page.getByText('Proveedor Import Test')).toBeVisible();
});
