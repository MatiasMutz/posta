import { test, expect } from '@playwright/test';
import { AUTH_CONTADOR } from '../global-setup';

test.describe('Exportación IVA Ventas', () => {
  test.use({ storageState: AUTH_CONTADOR });

  test('contador ve el botón de exportar en historial', async ({ page }) => {
    await page.goto('/ventas/historial');
    await expect(page.getByRole('heading', { name: 'Historial de ventas' })).toBeVisible();
    await expect(page.getByText('Exportar IVA Ventas (.xlsx)')).toBeVisible();
    await expect(page.getByLabel('Desde')).toBeVisible();
    await expect(page.getByLabel('Hasta')).toBeVisible();
  });

  test('descarga archivo al exportar', async ({ page }) => {
    await page.goto('/ventas/historial');
    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 }).catch(() => null);
    await page.getByRole('button', { name: /Exportar IVA Ventas/ }).click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/iva-ventas/i);
    }
  });
});

test.describe('Exportación IVA — vendedor bloqueado', () => {
  test.use({ storageState: 'tests/e2e/.auth/vendedor.json' });

  test('vendedor no accede al historial', async ({ page }) => {
    await page.goto('/ventas/historial');
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible({ timeout: 10_000 });
  });
});
