import { test, expect } from '@playwright/test';
import { AUTH_CONTADOR } from '../global-setup';

test.describe('Exportación IVA Compras', () => {
  test.use({ storageState: AUTH_CONTADOR });

  test('contador ve el botón de exportar en historial de compras', async ({ page }) => {
    await page.goto('/compras/historial');
    await expect(page.getByRole('heading', { name: 'Compras y gastos' })).toBeVisible();
    await expect(page.getByText('Exportar IVA Compras (.xlsx)')).toBeVisible();
  });

  test('descarga archivo al exportar', async ({ page }) => {
    await page.goto('/compras/historial');
    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 });
    await page.getByRole('button', { name: /Exportar IVA Compras/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/iva-compras/i);
  });
});

test.describe('Compras — vendedor bloqueado', () => {
  test.use({ storageState: 'tests/e2e/.auth/vendedor.json' });

  test('vendedor no accede a compras', async ({ page }) => {
    await page.goto('/compras/historial');
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible({ timeout: 10_000 });
  });
});
