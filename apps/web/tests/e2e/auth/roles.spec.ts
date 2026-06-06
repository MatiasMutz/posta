import { test, expect } from '@playwright/test';
import { AUTH_VENDEDOR, AUTH_CONTADOR } from '../global-setup';

test.describe('Roles — vendedor', () => {
  test.use({ storageState: AUTH_VENDEDOR });

  test('accede al POS pero no al historial', async ({ page }) => {
    await page.goto('/ventas');
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible();
    await page.goto('/ventas/historial');
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible({ timeout: 10_000 });
  });

  test('no accede a clientes (redirige a ventas)', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible({ timeout: 10_000 });
  });

  test('no accede a movimientos de stock', async ({ page }) => {
    await page.goto('/inventario/00000000-0000-0000-0000-000000000001/movimientos');
    await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Roles — contador', () => {
  test.use({ storageState: AUTH_CONTADOR });

  test('accede al historial de ventas', async ({ page }) => {
    await page.goto('/ventas/historial');
    await expect(page.getByRole('heading', { name: 'Historial de ventas' })).toBeVisible();
  });

  test('accede a clientes en lectura', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible();
  });

  test('no puede crear clientes', async ({ page }) => {
    await page.goto('/clientes/nuevo');
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible({ timeout: 10_000 });
  });

  test('no accede a inventario (redirige a contador)', async ({ page }) => {
    await page.goto('/inventario');
    await expect(page.getByRole('heading', { name: 'Libro IVA Ventas' })).toBeVisible({ timeout: 10_000 });
  });
});
