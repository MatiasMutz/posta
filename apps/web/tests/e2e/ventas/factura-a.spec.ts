import { test, expect } from '@playwright/test';
import { asegurarProductoPosConStock } from '../helpers/seed-pos';
import { agregarProductoAlCarrito, irAlPOS } from '../helpers/pos-ui';

test.describe('POS — Factura A', () => {
  test('completa venta con tipo Factura A', async ({ page, request }) => {
    const nombre = await asegurarProductoPosConStock(request);
    await irAlPOS(page, { buscarProducto: nombre });
    await agregarProductoAlCarrito(page, nombre);

    await page.locator('select').nth(1).selectOption('factura_a');
    await expect(page.locator('select').nth(1)).toHaveValue('factura_a');

    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    await expect(page.getByText('Venta registrada')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Facturado|Pendiente de facturación/)).toBeVisible();
  });
});
