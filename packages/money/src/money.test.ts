import { describe, it, expect } from 'vitest';
import { fromString, fromCents, add, subtract, multiply, toNumericString, ZERO } from './index';

describe('Money', () => {
  it('construye desde string NUMERIC', () => {
    expect(toNumericString(fromString('1234.56'))).toBe('1234.56');
  });

  it('construye desde string sin decimales', () => {
    expect(toNumericString(fromString('500'))).toBe('500.00');
  });

  it('suma dos montos', () => {
    expect(toNumericString(add(fromString('100.00'), fromString('200.50')))).toBe('300.50');
  });

  it('resta montos', () => {
    expect(toNumericString(subtract(fromString('500.00'), fromString('200.50')))).toBe('299.50');
  });

  it('multiplica por factor decimal', () => {
    // 100.00 * 1.21 = 121.00
    expect(toNumericString(multiply(fromString('100.00'), 1.21))).toBe('121.00');
  });

  it('serializa negativo', () => {
    expect(toNumericString(subtract(fromString('10.00'), fromString('20.00')))).toBe('-10.00');
  });

  it('ZERO es cero', () => {
    expect(toNumericString(ZERO)).toBe('0.00');
  });

  it('nunca usa float internamente', () => {
    // 0.1 + 0.2 en float = 0.30000000000000004, en Money = 0.30
    expect(toNumericString(add(fromString('0.10'), fromString('0.20')))).toBe('0.30');
  });
});
