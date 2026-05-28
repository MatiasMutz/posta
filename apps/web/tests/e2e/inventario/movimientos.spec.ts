import { test, expect, type Page } from '@playwright/test';

async function crearProductoConStockCero(page: Page, nombre: string) {
  await page.goto('/inventario/nuevo');

  await page.fill('input[placeholder="Ej: Coca Cola 500ml"]', nombre);

  const costoInputs = page.locator('input[placeholder="0.00"]');
  await costoInputs.nth(0).fill('100.00');
  await costoInputs.nth(1).fill('200.00');

  const stockInputs = page.locator('input[type="number"]');
  await stockInputs.nth(0).fill('0'); // stock inicial
  await stockInputs.nth(1).fill('0'); // stock mínimo

  await page.getByRole('button', { name: 'Crear producto' }).click();
  await page.waitForURL('/inventario', { waitUntil: 'domcontentloaded' });

  await page.fill('input[placeholder="Buscar producto..."]', nombre);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForURL(/buscar=/);
}

test.describe('Inventario — Movimientos de stock (spec aislado)', () => {
  test('entrada y salida de stock desde spec independiente', async ({ page }) => {
    const nombre = `Mov Aislado ${Date.now()}`;

    await crearProductoConStockCero(page, nombre);
    await expect(page.getByText(nombre)).toBeVisible({ timeout: 10_000 });

    const fila = page.locator('tr', { hasText: nombre });
    await fila.locator('text=Movimientos').click();
    await page.waitForURL(/\/movimientos$/);
    await expect(page.getByRole('heading', { name: nombre })).toBeVisible();

    // Entrada: +10
    await page.selectOption('select', 'entrada');
    await page.fill('input[type="number"]', '10');
    await page.fill('input[placeholder="Ej: Compra a proveedor"]', 'Compra test');
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();

    await expect(page.getByText('Entrada registrada.')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('p.font-mono.text-2xl', { hasText: '10' })).toBeVisible();

    // Salida: -3 → stock final 7
    await page.selectOption('select', 'salida');
    await page.fill('input[type="number"]', '3');
    await page.fill('input[placeholder="Ej: Venta mostrador"]', 'Venta test');
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();

    await expect(page.getByText('Salida registrada.')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('p.font-mono.text-2xl', { hasText: '7' })).toBeVisible();
  });
});
