import { fromString, subtract, multiplyRatio, toNumericString, ZERO } from '@posta/money';

export function calcularIvaComprobante(tipo: string, totalStr: string) {
  const total = fromString(totalStr);
  const exento = tipo === 'factura_c';
  const iva = exento ? ZERO : multiplyRatio(total, 21n, 121n);
  const neto = exento ? total : subtract(total, iva);
  return {
    neto: toNumericString(neto),
    iva: toNumericString(iva),
  };
}

export const TIPOS_FISCALES = ['factura_b', 'factura_a', 'factura_c', 'ticket'] as const;
