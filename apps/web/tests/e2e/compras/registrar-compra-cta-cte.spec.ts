import { test, expect } from '@playwright/test';

test.describe('Compra en cuenta corriente', () => {
  test('registra compra y aumenta saldo del proveedor', async ({ page }) => {
    const nombreProv = `Prov Cta Cte ${Date.now()}`;

    await page.goto('/proveedores/nuevo');
    await page.getByPlaceholder('Ej: Distribuidora SA').fill(nombreProv);
    await page.getByRole('button', { name: 'Crear proveedor' }).click();
    await page.waitForURL('/proveedores');

    await page.goto('/compras/nueva');
    await page.locator('select').first().selectOption({ label: nombreProv });
    await page.locator('select').nth(2).selectOption('cuenta_corriente');
    await page.getByPlaceholder('Ej: Insumos de oficina').fill('Compra test cta cte');
    await page.getByPlaceholder('1234.56').fill('1000.00');
    await page.getByRole('button', { name: 'Registrar' }).click();
    await page.waitForURL('/compras/historial', { timeout: 20_000 });

    await page.goto('/proveedores');
    await page.getByText(nombreProv).click();
    await expect(page.getByText(/1\.000,00|1000\.00/)).toBeVisible({ timeout: 10_000 });
  });
});
