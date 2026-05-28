import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { FacturadorHttp } from './facturador-http';

const ventaPayload = {
  ventaId: 'venta-1',
  tipo: 'factura_b' as const,
  total: '1210.00',
  clienteCuit: '20123456789',
  items: [
    {
      descripcion: 'Producto test',
      cantidad: 1,
      precioUnitario: '1210.00',
      subtotal: '1210.00',
    },
  ],
};

describe('FacturadorHttp', () => {
  const originalUrl = process.env.AFIP_SERVICE_URL;

  beforeEach(() => {
    process.env.AFIP_SERVICE_URL = 'http://afip-mock.test';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalUrl === undefined) delete process.env.AFIP_SERVICE_URL;
    else process.env.AFIP_SERVICE_URL = originalUrl;
  });

  it('falla al instanciar sin AFIP_SERVICE_URL', () => {
    delete process.env.AFIP_SERVICE_URL;
    expect(() => new FacturadorHttp()).toThrow('AFIP_SERVICE_URL no está configurada');
  });

  it('emitirComprobante mapea respuesta HTTP exitosa', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        cae: '71000000000000',
        cae_vencimiento: '2026-12-31T00:00:00Z',
        numero_comprobante: 42,
      }),
    } as Response);

    const facturador = new FacturadorHttp();
    const result = await facturador.emitirComprobante(ventaPayload);

    expect(result.cae).toBe('71000000000000');
    expect(result.numeroComprobante).toBe(42);
    expect(result.caeVencimiento).toEqual(new Date('2026-12-31T00:00:00Z'));
    expect(fetch).toHaveBeenCalledWith(
      'http://afip-mock.test/v1/comprobantes',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('lanza ServiceUnavailableException cuando HTTP no es ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response);

    const facturador = new FacturadorHttp();
    await expect(facturador.emitirComprobante(ventaPayload)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('lanza ServiceUnavailableException ante error de red', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));

    const facturador = new FacturadorHttp();
    await expect(facturador.emitirComprobante(ventaPayload)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
