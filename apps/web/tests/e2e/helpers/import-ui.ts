import { expect, type Page } from '@playwright/test';

/** Espera a que el job de importación termine (BullMQ). */
export async function esperarImportacionCompletada(page: Page): Promise<void> {
  await expect(page.getByText('¡Importación completada!')).toBeVisible({ timeout: 30_000 });
}

/** Navega a /importar tras registrar un tenant nuevo (evita ERR_ABORTED post-redirect). */
export async function irAImportar(page: Page): Promise<void> {
  await page.goto('/importar', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Importar datos' })).toBeVisible();
}

/** Sube CSV/Excel y espera el mapeo de columnas (upload Storage + analizar API). */
export async function subirArchivoImport(
  page: Page,
  tipo: 'Inventario (productos)' | 'Clientes',
  rutaArchivo: string,
  nombreArchivo: string,
): Promise<void> {
  await page.getByRole('button', { name: tipo }).click();

  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached();

  await fileInput.setInputFiles(rutaArchivo);
  // Playwright locator.dispatchEvent no activa onChange de React 19; hace falta evento nativo.
  await fileInput.evaluate((el) => {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const alerta = page.locator('[role="alert"]').filter({ hasText: /.+/ });
  const nombreEnPantalla = page.getByText(nombreArchivo);

  await expect
    .poll(
      async () => {
        if (await nombreEnPantalla.isVisible()) return 'ok';
        if (await alerta.isVisible()) return 'error';
        if (await page.getByText('Analizando archivo...').isVisible()) return 'pending';
        return 'waiting';
      },
      { timeout: 15_000, message: `Esperando subida de ${nombreArchivo}` },
    )
    .not.toBe('waiting');

  if (await alerta.isVisible()) {
    throw new Error(`Subida falló: ${(await alerta.textContent())?.trim()}`);
  }

  await expect(nombreEnPantalla).toBeVisible();
}
