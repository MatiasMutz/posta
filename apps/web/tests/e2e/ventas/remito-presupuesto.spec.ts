import { test, expect } from '@playwright/test';
import { asegurarProductoPosConStock } from '../helpers/seed-pos';
import { agregarProductoAlCarrito, irAlPOS } from '../helpers/pos-ui';

test.describe('POS — remito y presupuesto', () => {
  let nombreProducto = '';

  test.beforeEach(async ({ page, request }) => {
    nombreProducto = await asegurarProductoPosConStock(request);
    await irAlPOS(page, { buscarProducto: nombreProducto });
  });

  for (const tipo of ['remito', 'presupuesto'] as const) {
    test(`confirma venta tipo ${tipo}`, async ({ page }) => {
      await agregarProductoAlCarrito(page, nombreProducto);

      await page.locator('select').nth(1).selectOption(tipo);
      await page.getByRole('button', { name: 'Confirmar venta' }).click();
      await expect(page.getByText('Venta registrada')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Remito|Presupuesto/i)).toBeVisible();
    });
  }
});
