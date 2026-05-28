/**
 * E2E — POS y gestión de ventas.
 */
import { test, expect } from '@playwright/test';
import { agregarProductoAlCarrito, prepararPosConProducto } from '../helpers/pos-ui';

test.describe('POS — ventas', () => {
  test.describe.configure({ mode: 'serial' });

  let nombreProducto = '';

  test.beforeEach(async ({ page, request }) => {
    nombreProducto = await prepararPosConProducto(page, request);
  });

  test('POS carga con el catálogo de productos', async ({ page }) => {
    await expect(page.locator('input[placeholder="Buscar producto por nombre o SKU..."]')).toBeVisible();
  });

  test('agregar producto al carrito y confirmar venta en efectivo', async ({ page }) => {
    await agregarProductoAlCarrito(page, nombreProducto);

    await expect(page.locator('ul li').first()).toBeVisible();
    await expect(page.locator('select').nth(1)).toHaveValue('factura_b');

    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    await expect(page.getByText('Venta registrada')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('span').filter({ hasText: /Facturado|Pendiente/ })).toBeVisible();
  });

  test('buscar producto por nombre filtra el catálogo', async ({ page }) => {
    const input = page.locator('input[placeholder="Buscar producto por nombre o SKU..."]');
    await input.fill('');
    await input.pressSequentially('zzzz-no-existe-zzzz');
    await expect(page.getByText('Sin resultados.')).toBeVisible();
  });

  test('venta en cuenta corriente requiere cliente seleccionado', async ({ page }) => {
    await page.locator('select').nth(2).selectOption('cuenta_corriente');
    await expect(page.getByRole('button', { name: 'Confirmar venta' })).toBeDisabled();
    await expect(page.getByText(/Seleccioná un cliente/)).toBeVisible();
  });

  test('después de venta, "Nueva venta" vuelve al POS limpio', async ({ page, request }) => {
    const nombre = await prepararPosConProducto(page, request);
    await agregarProductoAlCarrito(page, nombre);
    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    await expect(page.getByText('Venta registrada')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Nueva venta' }).click();
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible();
    await expect(page.getByText('Agregá productos al carrito')).toBeVisible();
  });
});

test.describe('Historial de ventas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ventas/historial');
    await expect(page.getByRole('heading', { name: 'Historial de ventas' })).toBeVisible();
  });

  test('historial carga con las ventas del tenant', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Historial de ventas' })).toBeVisible();
  });

  test('botón de exportar IVA está visible', async ({ page }) => {
    await expect(page.getByText('Exportar IVA Ventas (.xlsx)')).toBeVisible();
  });
});
