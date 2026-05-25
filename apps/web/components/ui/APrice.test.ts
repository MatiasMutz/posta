import { describe, it, expect } from 'vitest';

// Extraemos la lógica de formateo para testearla sin DOM
function formatARS(raw: string | number): { integer: string; cents: string } {
  const num = typeof raw === 'string' ? parseFloat(raw) : raw;
  const abs = Math.abs(num);
  const [intPart, decPart = '00'] = abs.toFixed(2).split('.');
  const integer = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return { integer, cents: decPart };
}

describe('formatARS', () => {
  it('formatea miles con punto', () => {
    expect(formatARS(1234.56)).toEqual({ integer: '1.234', cents: '56' });
  });
  it('formatea millones', () => {
    expect(formatARS(1234567.89)).toEqual({ integer: '1.234.567', cents: '89' });
  });
  it('formatea valores sin centavos', () => {
    expect(formatARS(500)).toEqual({ integer: '500', cents: '00' });
  });
  it('maneja negativos con el valor absoluto', () => {
    expect(formatARS(-1234.56)).toEqual({ integer: '1.234', cents: '56' });
  });
  it('acepta string NUMERIC de la base', () => {
    expect(formatARS('9999.00')).toEqual({ integer: '9.999', cents: '00' });
  });
});
