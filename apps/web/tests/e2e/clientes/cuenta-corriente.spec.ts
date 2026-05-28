import { test, expect } from '@playwright/test';
import { apiFetchE2E, E2E_API_URL, loginDuenoE2E } from '../helpers/api-e2e';
import { agregarProductoAlCarrito, irAlPOS } from '../helpers/pos-ui';

async function seedClienteConProducto(request: import('@playwright/test').APIRequestContext, nombreCliente: string) {
  const access_token = await loginDuenoE2E(request);

  const clienteRes = await apiFetchE2E(
    request,
    `${E2E_API_URL}/api/v1/clientes`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}` },
      data: { nombre: nombreCliente },
    },
    'POST /clientes',
  );
  if (!clienteRes.ok()) {
    throw new Error(`Crear cliente: ${await clienteRes.text()}`);
  }
  const cliente = await clienteRes.json() as { data: { id: string } };

  const prodNombre = `000 E2E CtaCte Prod ${Date.now()}`;
  await apiFetchE2E(
    request,
    `${E2E_API_URL}/api/v1/inventario/productos`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}` },
      data: {
        nombre: prodNombre,
        costo: '50.00',
        precio: '150.00',
        stock_inicial: 10,
        stock_minimo: 1,
      },
    },
    'POST /inventario/productos',
  );

  return { clienteId: cliente.data.id, prodNombre, nombreCliente };
}

test.describe('Cuenta corriente', () => {
  test.describe.configure({ mode: 'serial' });

  let nombreCliente = '';
  let clienteId = '';
  let prodNombre = '';

  test.beforeAll(async ({ request }) => {
    nombreCliente = `000 E2E CtaCte ${Date.now()}`;
    const seed = await seedClienteConProducto(request, nombreCliente);
    clienteId = seed.clienteId;
    prodNombre = seed.prodNombre;
  });

  test('venta en cuenta corriente incrementa saldo deudor', async ({ page }) => {
    await irAlPOS(page, { buscarProducto: prodNombre, buscarCliente: nombreCliente });

    await page.locator('select').first().selectOption(clienteId);
    await agregarProductoAlCarrito(page, prodNombre);
    await page.locator('select').nth(2).selectOption('cuenta_corriente');
    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    await expect(page.getByText('Venta registrada')).toBeVisible({ timeout: 15_000 });

    await page.goto(`/clientes/${clienteId}`);
    await expect(page.getByRole('heading', { name: nombreCliente })).toBeVisible();
    const saldoDeudor = page.locator('div.text-right').filter({ hasText: 'Saldo deudor' });
    await expect(saldoDeudor).toContainText('150');
  });
});
