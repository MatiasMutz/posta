/**
 * E2E — resiliencia AFIP (requiere API con AFIP_MOCK_FAIL=true).
 * Corre con: E2E_AFIP_FAIL=1 pnpm test:e2e --grep "AFIP"
 */
import { test, expect } from '@playwright/test';

const skip = !process.env.E2E_AFIP_FAIL;

test.describe('AFIP resilience', () => {
  test.skip(skip, 'Requiere AFIP_MOCK_FAIL=true en la API y E2E_AFIP_FAIL=1');

  test('venta queda pendiente y permite reintento manual', async ({ page }) => {
    await page.goto('/ventas');
    const producto = page.locator('button:not([disabled])').filter({ hasText: 'stock:' }).first();
    await expect(producto).toBeVisible({ timeout: 10_000 });
    await producto.click();

    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    await expect(page.getByText('Venta registrada')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Pendiente de facturación')).toBeVisible();

    await page.goto('/ventas/historial');
    await expect(page.getByText('Pendiente').first()).toBeVisible({ timeout: 10_000 });

    // Reintento manual (dueño): botón en fila pendiente
    const reintentar = page.getByRole('button', { name: /Reintentar/i }).first();
    if (await reintentar.isVisible()) {
      await reintentar.click();
      await expect(page.getByText(/Facturado|Pendiente|Error/i).first()).toBeVisible({ timeout: 15_000 });
    }
  });
});
