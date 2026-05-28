/**
 * E2E — Flujo completo de gestión de inventario.
 * Requiere: API (puerto 3001). El web lo levanta Playwright (playwright.config.ts).
 *
 * Corre con: pnpm test:e2e
 */
import { test, expect, type Page } from '@playwright/test';

async function irAInventario(page: Page) {
  await page.goto('/inventario');
  await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible();
}

async function crearProducto(
  page: Page,
  opts: {
    nombre: string;
    costo?: string;
    precio?: string;
    stockInicial?: string;
    stockMinimo?: string;
    sku?: string;
  },
) {
  await page.getByRole('link', { name: '+ Nuevo producto' }).click();
  await page.waitForURL('/inventario/nuevo');

  await page.fill('input[placeholder="Ej: Coca Cola 500ml"]', opts.nombre);
  if (opts.sku) {
    await page.fill('input[placeholder="Ej: CC500"]', opts.sku);
  }

  const costoInputs = page.locator('input[placeholder="0.00"]');
  await costoInputs.nth(0).fill(opts.costo ?? '100.00');
  await costoInputs.nth(1).fill(opts.precio ?? '200.00');

  const stockInputs = page.locator('input[type="number"]');
  if (opts.stockInicial !== undefined) await stockInputs.nth(0).fill(opts.stockInicial);
  if (opts.stockMinimo !== undefined) await stockInputs.nth(1).fill(opts.stockMinimo);

  await page.getByRole('button', { name: 'Crear producto' }).click();
  await page.waitForURL('/inventario', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible();

  // Con muchos productos E2E acumulados el nuevo ítem puede quedar fuera de la página 1.
  const buscador = page.locator('input[placeholder="Buscar producto..."]');
  await buscador.waitFor({ state: 'visible', timeout: 15_000 });
  await buscador.fill(opts.nombre);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForURL(/buscar=/);
}

test.describe('Inventario — gestión de productos', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await irAInventario(page);
  });

  test('lista de inventario se carga', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible();
  });

  test('crear un producto nuevo aparece en la lista', async ({ page }) => {
    const nombre = `Test E2E ${Date.now()}`;
    await crearProducto(page, {
      nombre,
      sku: `SKU-${Date.now()}`,
      costo: '500.00',
      precio: '900.00',
      stockInicial: '20',
      stockMinimo: '5',
    });
    await expect(page.getByText(nombre)).toBeVisible();
  });

  test('producto con stock bajo muestra alerta', async ({ page }) => {
    const nombre = `Prod Alerta ${Date.now()}`;
    await crearProducto(page, {
      nombre,
      costo: '100.00',
      precio: '200.00',
      stockInicial: '2',
      stockMinimo: '5',
    });

    const fila = page.locator('tr', { hasText: nombre });
    await expect(fila.getByText('Stock bajo', { exact: true })).toBeVisible();
  });

  test('filtro "Stock bajo" muestra solo productos con alerta', async ({ page }) => {
    await page.getByRole('link', { name: 'Stock bajo' }).click();
    await page.waitForURL(/solo_bajo_stock=1/);
    await expect(page.locator('text=OK')).toHaveCount(0);
  });

  test('editar nombre de un producto', async ({ page }) => {
    const nombreOriginal = `Prod Edit ${Date.now()}`;
    await crearProducto(page, { nombre: nombreOriginal });

    const fila = page.locator('tr', { hasText: nombreOriginal });
    await fila.getByRole('link', { name: 'Editar' }).click();
    await page.waitForURL(/\/editar$/);

    const nuevoNombre = `Editado ${Date.now()}`;
    await page.fill('input[placeholder="Ej: Coca Cola 500ml"]', nuevoNombre);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible({ timeout: 30_000 });
    await page.fill('input[placeholder="Buscar producto..."]', nuevoNombre);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.waitForURL(/buscar=/);
    await expect(page.getByText(nuevoNombre)).toBeVisible();
  });

  test('buscar producto por nombre filtra la tabla', async ({ page }) => {
    const nombre = `Busqueda ${Date.now()}`;
    await crearProducto(page, { nombre, costo: '50.00', precio: '80.00' });

    await page.fill('input[placeholder="Buscar producto..."]', nombre);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.waitForURL(/buscar=/);
    await expect(page.getByText(nombre)).toBeVisible();
  });

  test('registrar entrada de stock y ver en historial', async ({ page }) => {
    const nombre = `Mov Test ${Date.now()}`;
    await crearProducto(page, {
      nombre,
      costo: '100.00',
      precio: '150.00',
      stockInicial: '0',
      stockMinimo: '0',
    });

    const fila = page.locator('tr', { hasText: nombre });
    await fila.locator('text=Movimientos').click();
    await page.waitForURL(/\/movimientos$/);
    await expect(page.getByRole('heading', { name: nombre })).toBeVisible();

    await page.selectOption('select', 'entrada');
    await page.fill('input[type="number"]', '10');
    await page.fill('input[placeholder="Ej: Compra a proveedor"]', 'Compra inicial');
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();

    await expect(page.getByText('Entrada registrada.')).toBeVisible();
    await expect(page.getByText('Compra inicial')).toBeVisible();
    await expect(page.locator('p.font-mono.text-2xl', { hasText: '10' })).toBeVisible();
  });

  test('registrar salida de stock actualiza el historial', async ({ page }) => {
    const nombre = `Salida Test ${Date.now()}`;
    await crearProducto(page, {
      nombre,
      costo: '200.00',
      precio: '300.00',
      stockInicial: '20',
      stockMinimo: '5',
    });

    const fila = page.locator('tr', { hasText: nombre });
    await fila.locator('text=Movimientos').click();
    await page.waitForURL(/\/movimientos$/);

    await page.selectOption('select', 'salida');
    await page.fill('input[type="number"]', '5');
    await page.fill('input[placeholder="Ej: Venta mostrador"]', 'Venta cliente');
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();

    await expect(page.getByText('Salida registrada.')).toBeVisible();
    await expect(page.getByText('Venta cliente')).toBeVisible();
  });

  test('eliminar producto lo quita de la lista', async ({ page }) => {
    const nombre = `Prod Borrar ${Date.now()}`;
    await crearProducto(page, { nombre, costo: '50.00', precio: '80.00' });
    await expect(page.getByText(nombre)).toBeVisible();

    page.on('dialog', (dialog) => void dialog.accept());

    const fila = page.locator('tr', { hasText: nombre });
    await fila.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText(nombre)).not.toBeVisible({ timeout: 10_000 });
  });
});
