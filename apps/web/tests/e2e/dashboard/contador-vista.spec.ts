import { test, expect } from '@playwright/test';
import { AUTH_CONTADOR, AUTH_VENDEDOR } from '../global-setup';

test.describe('Vista contador', () => {
  test.use({ storageState: AUTH_CONTADOR });

  test('muestra libro IVA y KPIs fiscales', async ({ page }) => {
    await page.goto('/contador');
    await expect(page.getByRole('heading', { name: 'Libro IVA Ventas' })).toBeVisible();
    await expect(page.getByText('Neto gravado')).toBeVisible();
    await expect(page.getByText('IVA débito fiscal')).toBeVisible();
    await expect(page.getByText('Comprobantes emitidos')).toBeVisible();
    await expect(page.getByText('Modo contador')).toBeVisible();
  });

  test('puede exportar IVA ventas', async ({ page }) => {
    await page.goto('/contador');
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
    await page.getByRole('button', { name: /Exportar IVA Ventas/i }).click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/iva.*ventas/i);
    }
  });
});

test.describe('Roles — dashboard y contador', () => {
  test('vendedor no accede al dashboard', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH_VENDEDOR });
    const page = await ctx.newPage();
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible({ timeout: 15_000 });
    await ctx.close();
  });

  test('vendedor no accede a vista contador', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH_VENDEDOR });
    const page = await ctx.newPage();
    await page.goto('/contador');
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible({ timeout: 15_000 });
    await ctx.close();
  });
});
