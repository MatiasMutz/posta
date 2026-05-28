import { test, expect } from '@playwright/test';
import { resolve } from 'path';
import { registrarDuenoRapido } from '../helpers/auth-ui';
import { esperarImportacionCompletada, irAImportar, subirArchivoImport } from '../helpers/import-ui';

const CSV = resolve(__dirname, '../fixtures/productos-con-errores.csv');

test.use({ storageState: { cookies: [], origins: [] } });

test('flujo importación con errores y corrección in-line', async ({ page, request }) => {
  const email = `ui-errores-${Date.now()}@posta-test.com`;
  const password = 'password123456';

  await registrarDuenoRapido(page, request, {
    email,
    password,
    nombreTenant: 'UI Errores Test',
  });

  await irAImportar(page);
  await subirArchivoImport(page, 'Inventario (productos)', CSV, 'productos-con-errores.csv');
  await page.getByRole('button', { name: 'Importar' }).click();
  await page.waitForURL(/\/importar\/[a-f0-9-]+/, { timeout: 15_000 });

  await esperarImportacionCompletada(page);

  const resumen = page.getByRole('status', { name: 'Resumen de importación' });
  await expect(resumen).toContainText('✓ 2 importadas');
  await expect(resumen).toContainText('✗ 1 rechazada');

  const grilla = page.getByRole('region', { name: 'Corrección de filas con errores' });
  await expect(grilla).toBeVisible();
  await expect(grilla.getByText(/precio:/i)).toBeVisible();

  const precioConError = grilla.getByRole('textbox', { name: /precio, fila/i });
  await expect(precioConError).toHaveAttribute('aria-invalid', 'true');
  await precioConError.fill('1800');

  await grilla.getByRole('button', { name: /Reimportar 1 fila/i }).click();

  await expect(page.getByText(/Se importaron 3 registros correctamente/)).toBeVisible({ timeout: 15_000 });
  await expect(grilla).not.toBeVisible();

  await page.getByRole('link', { name: /Ver inventario/i }).click();
  await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible();
  await expect(page.getByText('Producto Valido E2E', { exact: true })).toBeVisible();
  await expect(page.getByText('Producto Valido E2E B', { exact: true })).toBeVisible();
  await expect(page.getByText('Producto Error Precio', { exact: true })).toBeVisible();
});
