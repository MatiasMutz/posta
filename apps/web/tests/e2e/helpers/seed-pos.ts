import type { APIRequestContext } from '@playwright/test';
import { apiFetchE2E, E2E_API_URL, loginDuenoE2E } from './api-e2e';

export { loginDuenoE2E as obtenerTokenDueno };

const PREFIJO_PRODUCTO_E2E = '000 E2E POS';

/** Crea un producto con stock; devuelve el nombre exacto para buscarlo en el POS. */
export async function asegurarProductoPosConStock(request: APIRequestContext): Promise<string> {
  const token = await loginDuenoE2E(request);
  const nombre = `${PREFIJO_PRODUCTO_E2E} ${Date.now()}`;

  const res = await apiFetchE2E(
    request,
    `${E2E_API_URL}/api/v1/inventario/productos`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      data: {
        nombre,
        costo: '100.00',
        precio: '250.00',
        stock_inicial: 100,
        stock_minimo: 2,
      },
    },
    'POST /inventario/productos',
  );

  if (!res.ok()) {
    throw new Error(`No se pudo seedear producto POS: ${await res.text()}`);
  }

  return nombre;
}
