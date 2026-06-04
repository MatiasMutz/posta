import { test, expect } from '@playwright/test';
import { apiFetchE2E, E2E_API_URL, loginDuenoE2E } from '../helpers/api-e2e';

test.describe('Configuración — equipo', () => {
  test('dueño ve la página de equipo e invitaciones', async ({ page }) => {
    await page.goto('/configuracion/equipo');
    await expect(page.getByRole('heading', { name: 'Equipo' })).toBeVisible();
    await expect(page.getByText('Invitar por email')).toBeVisible();
    await expect(page.getByText('Miembros')).toBeVisible();
  });

  test('dueño puede cambiar rol de un miembro vía API', async ({ request }) => {
    const token = await loginDuenoE2E(request);

    const listRes = await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/tenants/usuarios`,
      { headers: { Authorization: `Bearer ${token}` } },
      'GET /tenants/usuarios',
    );
    expect(listRes.ok()).toBe(true);

    const { data } = (await listRes.json()) as {
      data: { miembros: Array<{ id: string; rol: string; user_id: string }> };
    };

    const vendedor = data.miembros.find((m) => m.rol === 'vendedor');
    test.skip(!vendedor, 'No hay vendedor en el tenant E2E para probar cambio de rol');

    const patchRes = await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/tenants/usuarios/${vendedor!.id}/rol`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        data: { rol: 'contador' },
      },
      'PATCH /tenants/usuarios/:id/rol',
    );
    expect(patchRes.ok()).toBe(true);

    const revertRes = await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/tenants/usuarios/${vendedor!.id}/rol`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        data: { rol: 'vendedor' },
      },
      'PATCH /tenants/usuarios/:id/rol (revert)',
    );
    expect(revertRes.ok()).toBe(true);
  });
});

test.describe('Configuración — equipo (vendedor)', () => {
  test.use({ storageState: 'tests/e2e/.auth/vendedor.json' });

  test('vendedor es redirigido fuera de equipo', async ({ page }) => {
    await page.goto('/configuracion/equipo');
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible({ timeout: 10_000 });
  });
});
