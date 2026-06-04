import { test, expect } from '@playwright/test';

test.describe('Proveedores CRUD', () => {
  test('dueño crea proveedor y lo ve en el listado', async ({ page }) => {
    const nombre = `Proveedor E2E ${Date.now()}`;

    await page.goto('/proveedores/nuevo');
    await expect(page.getByRole('heading', { name: 'Nuevo proveedor' })).toBeVisible();

    await page.getByPlaceholder('Ej: Distribuidora SA').fill(nombre);
    await page.getByRole('button', { name: 'Crear proveedor' }).click();

    await page.waitForURL('/proveedores', { timeout: 15_000 });
    await expect(page.getByText(nombre)).toBeVisible();
  });
});
