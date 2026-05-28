import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError } from '@posta/shared-types';
import { apiClient, NetworkError, parseApiErrorResponse } from './api-client';

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve JSON en respuestas OK', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: '1' } }), { status: 200 }),
    );

    const result = await apiClient<{ data: { id: string } }>('/clientes/1', { token: 't' });
    expect(result.data.id).toBe('1');
  });

  it('lanza ApiError con mensaje del backend', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ statusCode: 403, mensaje: 'Sin permiso.' }),
        { status: 403 },
      ),
    );

    await expect(apiClient('/ventas')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 403,
      message: 'Sin permiso.',
    });
  });

  it('mapea errores de validación con campo/motivo', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 400,
          mensaje: 'Datos inválidos',
          errores: [{ campo: 'nombre', motivo: 'El nombre es requerido' }],
        }),
        { status: 400 },
      ),
    );

    try {
      await apiClient('/clientes', { method: 'POST', body: '{}' });
      expect.fail('debió lanzar');
    } catch (err) {
      expect(ApiError.isApiError(err)).toBe(true);
      if (ApiError.isApiError(err)) {
        expect(err.errores).toEqual([{ campo: 'nombre', motivo: 'El nombre es requerido' }]);
      }
    }
  });

  it('acepta errores legacy con path/mensaje y los normaliza', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 400,
          mensaje: 'Datos inválidos',
          errores: [{ path: 'email', mensaje: 'Email inválido' }],
        }),
        { status: 400 },
      ),
    );

    try {
      await apiClient('/clientes', { method: 'POST', body: '{}' });
      expect.fail('debió lanzar');
    } catch (err) {
      expect(ApiError.isApiError(err)).toBe(true);
      if (ApiError.isApiError(err)) {
        expect(err.errores?.[0]).toEqual({ campo: 'email', motivo: 'Email inválido' });
      }
    }
  });

  it('lanza NetworkError si fetch falla', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(apiClient('/health')).rejects.toBeInstanceOf(NetworkError);
  });
});

describe('parseApiErrorResponse', () => {
  it('construye ApiError desde el body tipado', () => {
    const err = parseApiErrorResponse({
      statusCode: 422,
      mensaje: 'Revisá los datos.',
      errores: [{ campo: 'cuit', motivo: 'CUIT inválido' }],
    });
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe('Revisá los datos.');
    expect(err.errores?.[0].campo).toBe('cuit');
  });
});
