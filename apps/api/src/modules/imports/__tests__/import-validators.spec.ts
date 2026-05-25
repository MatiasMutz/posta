import { describe, it, expect } from 'vitest';
import {
  filtrarDuplicadosInventario,
  filtrarDuplicadosClientes,
} from '../import-validators';

describe('filtrarDuplicadosInventario', () => {
  it('conserva la primera fila y marca la segunda con SKU repetido', () => {
    const { filasOk, errores } = filtrarDuplicadosInventario([
      { numero: 2, datos: { nombre: 'A', sku: 'CC500', costo: '10', precio: '20' } },
      { numero: 5, datos: { nombre: 'B', sku: 'CC500', costo: '10', precio: '20' } },
    ]);
    expect(filasOk).toHaveLength(1);
    expect(filasOk[0].numero).toBe(2);
    expect(errores).toHaveLength(1);
    expect(errores[0].numero).toBe(5);
    expect(errores[0].problemas[0].campo).toBe('sku');
    expect(errores[0].problemas[0].motivo).toContain('fila 2');
  });

  it('detecta código de barras duplicado', () => {
    const { filasOk, errores } = filtrarDuplicadosInventario([
      { numero: 2, datos: { nombre: 'A', codigo_barras: '7790123', costo: '10', precio: '20' } },
      { numero: 3, datos: { nombre: 'B', codigo_barras: '7790123', costo: '10', precio: '20' } },
    ]);
    expect(filasOk).toHaveLength(1);
    expect(errores[0].problemas[0].campo).toBe('codigo_barras');
  });

  it('deja pasar filas sin claves repetidas', () => {
    const { filasOk, errores } = filtrarDuplicadosInventario([
      { numero: 2, datos: { nombre: 'A', sku: 'A1', costo: '10', precio: '20' } },
      { numero: 3, datos: { nombre: 'B', sku: 'B2', costo: '10', precio: '20' } },
    ]);
    expect(filasOk).toHaveLength(2);
    expect(errores).toHaveLength(0);
  });
});

describe('filtrarDuplicadosClientes', () => {
  it('marca CUIT duplicado en el archivo', () => {
    const { filasOk, errores } = filtrarDuplicadosClientes([
      { numero: 2, datos: { nombre: 'Juan', cuit: '20123456789' } },
      { numero: 4, datos: { nombre: 'Pedro', cuit: '20123456789' } },
    ]);
    expect(filasOk).toHaveLength(1);
    expect(errores[0].problemas[0].campo).toBe('cuit');
  });
});
