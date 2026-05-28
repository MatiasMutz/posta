/**
 * E2E — reintento manual AFIP vía API.
 * Requiere API con AFIP_MOCK_FAIL=true y E2E_AFIP_FAIL=1.
 */
import { test, expect } from '@playwright/test';
import { apiFetchE2E, E2E_API_URL, loginDuenoE2E } from '../helpers/api-e2e';

const skip = process.env.E2E_AFIP_FAIL !== '1';

test.describe('Ventas — reintento AFIP (API)', () => {
  test.skip(skip, 'Requiere AFIP_MOCK_FAIL=true en la API y E2E_AFIP_FAIL=1');

  test('venta pendiente expone data y reintento responde con data o error descriptivo', async ({ request }) => {
    const token = await loginDuenoE2E(request);

    const prodRes = await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/inventario/productos`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        data: {
          nombre: `000 E2E Reintento AFIP ${Date.now()}`,
          costo: '10.00',
          precio: '50.00',
          stock_inicial: 5,
          stock_minimo: 0,
        },
      },
      'POST /inventario/productos',
    );
    if (!prodRes.ok()) throw new Error(`Crear producto: ${await prodRes.text()}`);
    const { data: producto } = (await prodRes.json()) as { data: { id: string; nombre: string; precio: string } };

    const createRes = await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/ventas`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        data: {
          tipo: 'factura_b',
          metodo_pago: 'efectivo',
          items: [
            {
              producto_id: producto.id,
              descripcion: producto.nombre,
              cantidad: 1,
              precio_unitario: producto.precio,
            },
          ],
        },
      },
      'POST /ventas',
    );
    if (!createRes.ok()) throw new Error(`Crear venta: ${await createRes.text()}`);
    const { data: { id: ventaId } } = (await createRes.json()) as { data: { id: string } };

    const detalleRes = await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/ventas/${ventaId}`,
      { headers: { Authorization: `Bearer ${token}` } },
      'GET /ventas/:id',
    );
    expect(detalleRes.ok()).toBeTruthy();
    const detalle = (await detalleRes.json()) as { data: { id: string; estado: string } };
    expect(detalle.data.id).toBe(ventaId);
    expect(detalle.data.estado).toBe('pendiente_facturacion');

    const reintentoRes = await apiFetchE2E(
      request,
      `${E2E_API_URL}/api/v1/ventas/${ventaId}/reintentar-facturacion`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
      'POST /ventas/:id/reintentar-facturacion',
    );

    if (reintentoRes.ok()) {
      const body = (await reintentoRes.json()) as { data: { facturado: boolean; cae?: string } };
      expect(body.data).toBeDefined();
      expect(body.data.facturado).toBe(true);
      expect(body.data.cae).toBeTruthy();
    } else {
      expect(reintentoRes.status()).toBe(400);
      const err = (await reintentoRes.json()) as { mensaje?: string };
      expect(err.mensaje ?? '').toMatch(/AFIP/i);
    }
  });
});
