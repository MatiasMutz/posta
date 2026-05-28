import { test, expect } from '@playwright/test';
import { apiFetchE2E, E2E_API_URL, loginDuenoE2E } from '../helpers/api-e2e';

test.describe('Clientes — Editar', () => {
  let clienteId: string;
  const nombreOriginal = `000 E2E Editar ${Date.now()}`;

  test.beforeAll(async ({ request }) => {
    const access_token = await loginDuenoE2E(request);

    const createRes = await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/clientes`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}` },
        data: { nombre: nombreOriginal },
      },
      'POST /clientes',
    );
    if (!createRes.ok()) throw new Error(`Crear cliente falló: ${await createRes.text()}`);
    const body = (await createRes.json()) as { data: { id: string } };
    clienteId = body.data.id;
  });

  test('dueño edita nombre de cliente y ve el cambio reflejado', async ({ page }) => {
    const nuevoNombre = `000 E2E Editado ${Date.now()}`;

    await page.goto(`/clientes/${clienteId}`);
    await expect(page.getByRole('heading', { name: nombreOriginal })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('link', { name: 'Editar cliente →' }).click();
    await page.waitForURL(`/clientes/${clienteId}/editar`);
    await expect(page.getByRole('heading', { name: 'Editar cliente' })).toBeVisible();

    const input = page.locator('input[placeholder="Ej: Juan Pérez"]');
    await input.clear();
    await input.fill(nuevoNombre);

    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await page.waitForURL('/clientes', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible();

    await page.goto(`/clientes/${clienteId}`);
    await expect(page.getByRole('heading', { name: nuevoNombre })).toBeVisible({ timeout: 10_000 });
  });
});
