import { expect, type Page } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { asegurarProductoPosConStock } from './seed-pos';

const BUSCAR_PRODUCTO = 'input[placeholder="Buscar producto por nombre o SKU..."]';

export function productoConStock(page: Page, nombre?: string) {
  const base = page.locator('button:not([disabled])').filter({ hasText: 'stock:' });
  return nombre ? base.filter({ hasText: nombre }).first() : base.first();
}

export function primerProductoConStock(page: Page) {
  return productoConStock(page);
}

export async function irAlPOS(
  page: Page,
  opts?: { buscarProducto?: string; buscarCliente?: string },
): Promise<void> {
  const params = new URLSearchParams();
  if (opts?.buscarProducto) params.set('buscar', opts.buscarProducto);
  if (opts?.buscarCliente) params.set('cliente', opts.buscarCliente);
  const qs = params.toString() ? `?${params}` : '';
  await page.goto(`/ventas${qs}`);
  await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible();
  if (opts?.buscarProducto) {
    await expect(page.locator(BUSCAR_PRODUCTO)).toHaveValue(opts.buscarProducto);
  }
}

export async function buscarProductoEnPOS(page: Page, nombre: string): Promise<void> {
  await irAlPOS(page, { buscarProducto: nombre });
}

export async function agregarProductoAlCarrito(
  page: Page,
  nombreProducto: string,
  opts?: { buscarCliente?: string },
): Promise<void> {
  const producto = productoConStock(page, nombreProducto);
  const yaVisible = await producto.isVisible().catch(() => false);

  if (!yaVisible) {
    await irAlPOS(page, {
      buscarProducto: nombreProducto,
      buscarCliente: opts?.buscarCliente,
    });
  }

  await expect(productoConStock(page, nombreProducto)).toBeVisible({ timeout: 15_000 });
  await productoConStock(page, nombreProducto).click();
}

/** @deprecated Usar agregarProductoAlCarrito */
export async function agregarPrimerProductoAlCarrito(page: Page, nombreProducto?: string): Promise<void> {
  if (!nombreProducto) {
    const producto = productoConStock(page);
    await expect(producto).toBeVisible({ timeout: 15_000 });
    await producto.click();
    return;
  }
  await agregarProductoAlCarrito(page, nombreProducto);
}

export async function esperarProductoEnPOS(page: Page, nombreProducto: string): Promise<void> {
  await irAlPOS(page, { buscarProducto: nombreProducto });
  await expect(productoConStock(page, nombreProducto)).toBeVisible({ timeout: 15_000 });
}

/** Seed + POS con filtro server-side; patrón estándar para specs que venden. */
export async function prepararPosConProducto(
  page: Page,
  request: APIRequestContext,
): Promise<string> {
  const nombre = await asegurarProductoPosConStock(request);
  await esperarProductoEnPOS(page, nombre);
  return nombre;
}
