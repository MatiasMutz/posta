import { describe, it, expect } from 'vitest';
import { parsePagina, rangoPaginacion } from './paginacion';

describe('parsePagina', () => {
  it('devuelve 1 si el valor es inválido', () => {
    expect(parsePagina(undefined)).toBe(1);
    expect(parsePagina('abc')).toBe(1);
    expect(parsePagina('0')).toBe(1);
  });

  it('parsea números enteros positivos', () => {
    expect(parsePagina('3')).toBe(3);
  });
});

describe('rangoPaginacion', () => {
  it('calcula rango y total de páginas', () => {
    expect(rangoPaginacion(2, 50, 120)).toEqual({
      desde: 51,
      hasta: 100,
      totalPaginas: 3,
    });
  });

  it('maneja lista vacía', () => {
    expect(rangoPaginacion(1, 50, 0)).toEqual({
      desde: 0,
      hasta: 0,
      totalPaginas: 1,
    });
  });
});
