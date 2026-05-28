import { test, expect } from '@playwright/test';

test.describe('Configuración — equipo', () => {
  test('dueño ve la página de equipo e invitaciones', async ({ page }) => {
    await page.goto('/configuracion/equipo');
    await expect(page.getByRole('heading', { name: 'Equipo' })).toBeVisible();
    await expect(page.getByText('Invitar por email')).toBeVisible();
    await expect(page.getByText('Miembros')).toBeVisible();
  });

});

test.describe('Configuración — equipo (vendedor)', () => {
  test.use({ storageState: 'tests/e2e/.auth/vendedor.json' });

  test('vendedor es redirigido fuera de equipo', async ({ page }) => {
    await page.goto('/configuracion/equipo');
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible({ timeout: 10_000 });
  });
});
