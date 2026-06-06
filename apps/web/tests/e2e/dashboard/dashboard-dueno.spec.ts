import { test, expect } from '@playwright/test';
import { AUTH_DUENO } from '../global-setup';

test.describe('Dashboard dueño', () => {
  test.use({ storageState: AUTH_DUENO });

  test('carga KPIs y gráfico de ventas', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Buenos días|Buenas tardes|Buenas noches/ })).toBeVisible();
    await expect(page.getByText('Ventas hoy')).toBeVisible();
    await expect(page.getByText('Facturación del mes')).toBeVisible();
    await expect(page.getByText('Saldo en caja')).toBeVisible();
    await expect(page.getByText('Cuentas a cobrar').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Ventas · últimos \d+ días/ })).toBeVisible();
    await expect(page.locator('svg[aria-label="Gráfico de ventas"]')).toBeVisible();
    await expect(page.getByText('Ganancia estimada del mes')).toBeVisible();
  });

  test('accesos rápidos navegan al POS', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Ir al POS' }).click();
    await expect(page.getByRole('heading', { name: 'Punto de venta' })).toBeVisible({ timeout: 15_000 });
  });
});
