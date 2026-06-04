import { describe, it, expect } from 'vitest';
import { respuestaPaginada, toPaginaTotal } from './pagination';

describe('toPaginaTotal', () => {
  it('convierte bigint de count() a number', () => {
    expect(toPaginaTotal(42n)).toBe(42);
  });

  it('acepta number', () => {
    expect(toPaginaTotal(3)).toBe(3);
  });
});

describe('respuestaPaginada', () => {
  it('serializa meta.total sin BigInt', () => {
    const res = respuestaPaginada([{ id: '1' }], 1, 50, 5n);
    expect(JSON.stringify(res)).toBe(
      JSON.stringify({ data: [{ id: '1' }], meta: { pagina: 1, limite: 50, total: 5 } }),
    );
  });
});
