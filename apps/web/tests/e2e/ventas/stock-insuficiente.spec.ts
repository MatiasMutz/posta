import { test, expect } from '@playwright/test';
import { apiFetchE2E, E2E_API_URL, loginDuenoE2E } from '../helpers/api-e2e';

test.describe('Ventas — stock insuficiente (API)', () => {
  test('rechaza venta cuando la cantidad supera el stock disponible', async ({ request }) => {
    const access_token = await loginDuenoE2E(request);

    const prodNombre = `000 E2E Stock Insuf ${Date.now()}`;
    const prodRes = await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/inventario/productos`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}` },
        data: {
          nombre: prodNombre,
          costo: '10.00',
          precio: '100.00',
          stock_inicial: 2,
          stock_minimo: 0,
        },
      },
      'POST /inventario/productos',
    );
    if (!prodRes.ok()) throw new Error(`Crear producto falló: ${await prodRes.text()}`);
    const { data: producto } = (await prodRes.json()) as { data: { id: string; precio: string; nombre: string } };

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
              producto_id: producto.id,
              descripcion: producto.nombre,
              cantidad: 99,
              precio_unitario: producto.precio,
            },
          ],
        },
      },
      'POST /ventas',
    );

    expect(ventaRes.status()).toBe(400);
    const body = (await ventaRes.json()) as { mensaje?: string };
    expect(body.mensaje ?? '').toMatch(/stock insuficiente/i);
  });
});
