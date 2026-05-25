import { describe, it, expect } from 'vitest';
import { buscarProductoExistente, type IndiceProductos } from '../persistencia-inventario';

const producto = (overrides: Partial<{
  id: string;
  sku: string | null;
  codigo_barras: string | null;
  stock_actual: number;
}>) => ({
  id: overrides.id ?? 'uuid-1',
  tenant_id: 'tenant-1',
  nombre: 'Test',
  sku: overrides.sku ?? null,
  codigo_barras: overrides.codigo_barras ?? null,
  costo: '100.00',
  precio: '200.00',
  stock_actual: overrides.stock_actual ?? 0,
  stock_minimo: 0,
  activo: true,
  created_at: new Date(),
  updated_at: new Date(),
});

describe('buscarProductoExistente', () => {
  it('prioriza match por SKU sobre código de barras', () => {
    const porSku = new Map([['CC500', producto({ id: 'por-sku', sku: 'CC500' })]]);
    const porCodigoBarras = new Map([['7790123', producto({ id: 'por-barras', codigo_barras: '7790123' })]]);
    const indice: IndiceProductos = { porSku, porCodigoBarras };

    const found = buscarProductoExistente(
      { sku: 'CC500', codigo_barras: '7790123' },
      indice,
    );
    expect(found?.id).toBe('por-sku');
  });

  it('busca por código de barras si no hay SKU', () => {
    const indice: IndiceProductos = {
      porSku: new Map(),
      porCodigoBarras: new Map([['7790123', producto({ id: 'por-barras', codigo_barras: '7790123' })]]),
    };
    const found = buscarProductoExistente({ codigo_barras: '7790123' }, indice);
    expect(found?.id).toBe('por-barras');
  });

  it('devuelve null si no hay claves de match', () => {
    const indice: IndiceProductos = { porSku: new Map(), porCodigoBarras: new Map() };
    expect(buscarProductoExistente({ nombre: 'Sin clave' }, indice)).toBeNull();
  });
});
