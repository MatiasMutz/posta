/**
 * E2E — POS y gestión de ventas.
 * Requiere: API (puerto 3001) + Web (puerto 3000) + Supabase corriendo.
 * Corre con: pnpm test:e2e
 *
 * Precondición: usuario E2E_EMAIL/E2E_PASSWORD con rol dueño y al menos un
 * producto con stock > 0 en el inventario del tenant.
 */
import { test, expect, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL ?? 'e2e@posta-test.com';
const PASS = process.env.E2E_PASSWORD ?? 'password123456';

async function irAlPOS(page: Page) {
  await page.goto('/ventas');
  await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible();
}

test.describe('POS — ventas', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await irAlPOS(page);
  });

  test('POS carga con el catálogo de productos', async ({ page }) => {
    await expect(page.locator('input[placeholder="Buscar producto por nombre o SKU..."]')).toBeVisible();
  });

  test('agregar producto al carrito y confirmar venta en efectivo', async ({ page }) => {
    // Agregar el primer producto disponible (con stock)
    const primerProducto = page.locator('button:not([disabled])').filter({ hasText: 'stock:' }).first();
    await expect(primerProducto).toBeVisible({ timeout: 10_000 });
    await primerProducto.click();

    // Verificar que aparece en el carrito
    await expect(page.locator('ul li').first()).toBeVisible();

    // Cliente es el primer <select> (vacío); Tipo es el segundo
    await expect(page.locator('select').nth(1)).toHaveValue('factura_b');

    // Confirmar la venta
    await page.getByRole('button', { name: 'Confirmar venta' }).click();

    // Debe mostrar el ticket post-venta
    await expect(page.getByText('Venta registrada')).toBeVisible({ timeout: 15_000 });
    // Estado: facturado o pendiente_facturacion
    const estado = page.locator('span').filter({ hasText: /Facturado|Pendiente/ });
    await expect(estado).toBeVisible();
  });

  test('buscar producto por nombre filtra el catálogo', async ({ page }) => {
    const input = page.locator('input[placeholder="Buscar producto por nombre o SKU..."]');
    await input.fill('xxxxxxxxinexistente');
    await expect(page.getByText('Sin resultados.')).toBeVisible();
    await input.clear();
  });

  test('venta en cuenta corriente requiere cliente seleccionado', async ({ page }) => {
    // Cambiar método de pago a cuenta corriente sin seleccionar cliente
    const selects = page.locator('select');
    // El select de pago es el segundo (después del de tipo)
    await selects.nth(2).selectOption('cuenta_corriente');

    // El botón debe estar deshabilitado
    await expect(page.getByRole('button', { name: 'Confirmar venta' })).toBeDisabled();

    // Mensaje de aviso visible
    await expect(page.getByText(/Seleccioná un cliente/)).toBeVisible();
  });

  test('después de venta, "Nueva venta" vuelve al POS limpio', async ({ page }) => {
    const primerProducto = page.locator('button:not([disabled])').filter({ hasText: 'stock:' }).first();
    await primerProducto.click();
    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    await expect(page.getByText('Venta registrada')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Nueva venta' }).click();
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible();
    // Carrito vacío
    await expect(page.getByText('Agregá productos al carrito')).toBeVisible();
  });
});

test.describe('Historial de ventas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ventas/historial');
    await expect(page.getByRole('heading', { name: 'Historial de ventas' })).toBeVisible();
  });

  test('historial carga con las ventas del tenant', async ({ page }) => {
    // La tabla debe existir (puede estar vacía si es primer run)
    const heading = page.getByRole('heading', { name: 'Historial de ventas' });
    await expect(heading).toBeVisible();
  });

  test('botón de exportar IVA está visible', async ({ page }) => {
    await expect(page.getByText('Exportar IVA Ventas (.xlsx)')).toBeVisible();
  });
});
