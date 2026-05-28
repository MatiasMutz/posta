import { test, expect } from '@playwright/test';

test.describe('Clientes — CRUD', () => {
  test('dueño crea y lista un cliente', async ({ page }) => {
    const nombre = `000 E2E Cliente ${Date.now()}`;

    await page.goto('/clientes/nuevo');
    await expect(page.getByRole('heading', { name: 'Nuevo cliente' })).toBeVisible();
    await page.getByPlaceholder('Ej: Juan Pérez').fill(nombre);
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(nombre)).toBeVisible();
  });
});
