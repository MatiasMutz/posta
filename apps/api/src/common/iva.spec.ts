import { describe, it, expect } from 'vitest';
import { calcularIvaComprobante } from './iva';

describe('calcularIvaComprobante', () => {
  it('descompone IVA 21% incluido en factura B', () => {
    const { neto, iva } = calcularIvaComprobante('factura_b', '1210.00');
    expect(neto).toBe('1000.00');
    expect(iva).toBe('210.00');
  });

  it('factura C es exenta (neto = total, IVA cero)', () => {
    const { neto, iva } = calcularIvaComprobante('factura_c', '1500.00');
    expect(neto).toBe('1500.00');
    expect(iva).toBe('0.00');
  });

  it('ticket usa la misma lógica gravada que factura B', () => {
    const { neto, iva } = calcularIvaComprobante('ticket', '242.00');
    expect(neto).toBe('200.00');
    expect(iva).toBe('42.00');
  });
});
