import { describe, it, expect } from 'vitest';
import { partesARS, formatARSPlain } from './money';

describe('partesARS', () => {
  it('formatea miles con punto y decimales', () => {
    expect(partesARS('1234.56')).toEqual({
      integer: '1.234',
      cents: '56',
      negative: false,
    });
  });

  it('maneja negativos', () => {
    const p = partesARS('-500.00');
    expect(p.negative).toBe(true);
    expect(p.integer).toBe('500');
    expect(p.cents).toBe('00');
  });
});

describe('formatARSPlain', () => {
  it('devuelve string legible en español', () => {
    expect(formatARSPlain('1000.50')).toBe('$ 1.000,50');
  });
});
