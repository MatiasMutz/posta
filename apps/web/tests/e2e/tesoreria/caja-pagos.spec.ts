import { test, expect } from '@playwright/test';
import { apiFetchE2E, E2E_API_URL, loginDuenoE2E } from '../helpers/api-e2e';
import { agregarProductoAlCarrito, irAlPOS } from '../helpers/pos-ui';

test.describe('Tesorería — caja y pagos', () => {
  test.describe.configure({ mode: 'serial' });

  let nombreCliente = '';
  let clienteId = '';
  let prodNombre = '';

  test.beforeAll(async ({ request }) => {
    const access_token = await loginDuenoE2E(request);
    nombreCliente = `000 E2E Pago ${Date.now()}`;
    prodNombre = `000 E2E Pago Prod ${Date.now()}`;

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
    const cliente = await clienteRes.json() as { data: { id: string } };
    clienteId = cliente.data.id;

    await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/inventario/productos`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}` },
        data: {
          nombre: prodNombre,
          costo: '50.00',
          precio: '200.00',
          stock_inicial: 10,
          stock_minimo: 1,
        },
      },
      'POST /inventario/productos',
    );
  });

  test('abre caja y muestra saldo', async ({ page }) => {
    await page.goto('/caja');

    const cajaCerrada = page.getByText('Caja cerrada');
    if (await cajaCerrada.isVisible()) {
      await page.getByLabel('Monto de apertura').fill('1000.00');
      await page.getByRole('button', { name: 'Abrir caja' }).click();
    }

    await expect(page.getByText('Caja del día')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Saldo actual en caja')).toBeVisible();
  });

  test('cobro a cliente reduce saldo deudor', async ({ page }) => {
    await irAlPOS(page, { buscarProducto: prodNombre, buscarCliente: nombreCliente });
    await page.locator('select').first().selectOption(clienteId);
    await agregarProductoAlCarrito(page, prodNombre);
    await page.locator('select').nth(2).selectOption('cuenta_corriente');
    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    await expect(page.getByText('Venta registrada')).toBeVisible({ timeout: 15_000 });

    await page.goto('/caja');
    await expect(page.getByText('Caja del día')).toBeVisible({ timeout: 10_000 });

    const seccionCobro = page.locator('div.bg-card').filter({
      has: page.getByText('Cobro / pago', { exact: true }),
    });
    await seccionCobro.locator('select').nth(1).selectOption(clienteId);
    await page.getByLabel('Monto del cobro').fill('200.00');
    await page.getByRole('button', { name: 'Registrar cobro' }).click();

    await page.goto(`/clientes/${clienteId}`);
    await expect(page.getByRole('heading', { name: nombreCliente })).toBeVisible();
    const saldoDeudor = page.locator('div.text-right').filter({ hasText: 'Saldo deudor' });
    await expect(saldoDeudor).toContainText('0', { timeout: 10_000 });
  });

  test('vendedor no accede a caja', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: 'tests/e2e/.auth/vendedor.json' });
    const page = await ctx.newPage();
    await page.goto('/caja');
    await page.waitForURL('/ventas', { timeout: 10_000 });
    await ctx.close();
  });
});
