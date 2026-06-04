import { test, expect } from '@playwright/test';
import { asegurarProductoPosConStock } from '../helpers/seed-pos';
import { agregarProductoAlCarrito, irAlPOS } from '../helpers/pos-ui';
import { apiFetchE2E, E2E_API_URL, loginDuenoE2E } from '../helpers/api-e2e';

async function crearClienteConCuit(request: import('@playwright/test').APIRequestContext, cuit: string) {
  const token = await loginDuenoE2E(request);
  const nombre = `Cliente Factura A ${Date.now()}`;
  const res = await apiFetchE2E(
    request,
    `${E2E_API_URL}/api/v1/clientes`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      data: { nombre, cuit },
    },
    'POST /clientes',
  );
  if (!res.ok()) throw new Error(`No se pudo crear cliente: ${await res.text()}`);
  const { data } = (await res.json()) as { data: { id: string; nombre: string } };
  return data;
}

test.describe('POS — Factura A', () => {
  test('bloquea Factura A sin cliente seleccionado', async ({ page, request }) => {
    const nombre = await asegurarProductoPosConStock(request);
    await irAlPOS(page, { buscarProducto: nombre });
    await agregarProductoAlCarrito(page, nombre);

    await page.locator('select').nth(1).selectOption('factura_a');
    await expect(page.getByText(/cliente con CUIT/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmar venta' })).toBeDisabled();
  });

  test('completa venta con tipo Factura A y cliente con CUIT', async ({ page, request }) => {
    const [nombre, cliente] = await Promise.all([
      asegurarProductoPosConStock(request),
      crearClienteConCuit(request, '20123456789'),
    ]);

    await irAlPOS(page, { buscarProducto: nombre });
    await agregarProductoAlCarrito(page, nombre);

    await page.locator('select').first().selectOption(cliente.id);
    await page.locator('select').nth(1).selectOption('factura_a');
    await expect(page.locator('select').nth(1)).toHaveValue('factura_a');

    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    await expect(page.getByText('Venta registrada')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Facturado|Pendiente de facturación/)).toBeVisible();
  });
});
