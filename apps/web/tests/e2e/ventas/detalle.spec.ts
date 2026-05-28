import { test, expect, type APIRequestContext } from '@playwright/test';
import { existsSync } from 'fs';
import { AUTH_CONTADOR } from '../global-setup';
import { apiFetchE2E, E2E_API_URL, loginDuenoE2E } from '../helpers/api-e2e';

async function loginYCrearVenta(request: APIRequestContext): Promise<string> {
  const access_token = await loginDuenoE2E(request);

  const ventaRes = await apiFetchE2E(
    request,
    `${E2E_API_URL}/api/v1/ventas`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}` },
      data: {
        tipo: 'factura_b',
        metodo_pago: 'efectivo',
        items: [
          {
            descripcion: 'Producto E2E Detalle',
            cantidad: 2,
            precio_unitario: '150.00',
          },
        ],
      },
    },
    'POST /ventas',
  );
  if (!ventaRes.ok()) throw new Error(`Crear venta falló: ${await ventaRes.text()}`);
  const venta = (await ventaRes.json()) as { data: { id: string } };
  return venta.data.id;
}

test.describe('Ventas — Detalle (dueño)', () => {
  let ventaId: string;

  test.beforeAll(async ({ request }) => {
    ventaId = await loginYCrearVenta(request);
  });

  test('dueño ve detalle de venta con heading, ítems y estado', async ({ page }) => {
    await page.goto(`/ventas/${ventaId}`);

    await expect(page.getByRole('heading', { name: /Factura B|Factura A|Remito|Presupuesto/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Producto E2E Detalle')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });

    const pill = page.locator('span').filter({ hasText: /Facturado|Pendiente|Remito|Presupuesto|Error/i }).first();
    await expect(pill).toBeVisible();
  });
});

test.describe('Ventas — Detalle (contador)', () => {
  test.use({ storageState: AUTH_CONTADOR });

  let ventaId: string;

  test.beforeAll(async ({ request }) => {
    ventaId = await loginYCrearVenta(request);
  });

  test('contador accede al detalle de venta desde el historial', async ({ page }) => {
    if (!existsSync(AUTH_CONTADOR)) {
      test.skip(true, 'Auth de contador no disponible (requiere SUPABASE_SERVICE_ROLE_KEY)');
      return;
    }

    await page.goto('/ventas/historial');
    await expect(page.getByRole('heading', { name: 'Historial de ventas' })).toBeVisible({ timeout: 10_000 });

    await page.goto(`/ventas/${ventaId}`);
    await expect(page.getByRole('heading', { name: /Factura B|Factura A|Remito|Presupuesto/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Producto E2E Detalle')).toBeVisible({ timeout: 10_000 });
  });
});
