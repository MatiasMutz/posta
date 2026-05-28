/**
 * Utilidades de formato ARS para la UI (display).
 * Cálculos de negocio: usar @posta/money, nunca parseFloat para aritmética.
 */

import { fromString, add, multiply, toNumericString, ZERO } from '@posta/money';

export interface PartesARS {
  integer: string;
  cents: string;
  negative: boolean;
}

/** Separa un monto NUMERIC (string) en partes para APrice y tests. */
export function partesARS(raw: string | number): PartesARS {
  const num = typeof raw === 'string' ? parseFloat(raw) : raw;
  const negative = num < 0;
  const abs = Math.abs(num);
  const [intPart, decPart = '00'] = abs.toFixed(2).split('.');
  const integer = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return { integer, cents: decPart, negative };
}

/** Texto plano ARS: $ 1.234,56 */
export function formatARSPlain(raw: string | number): string {
  const { integer, cents, negative } = partesARS(raw);
  return `${negative ? '-' : ''}$ ${integer},${cents}`;
}

export interface ItemCarritoMoney {
  precio: string;
  cantidad: number;
}

/** Suma subtotales del carrito usando @posta/money (sin float). */
export function calcularTotalCarrito(items: ItemCarritoMoney[]): string {
  const total = items.reduce(
    (acc, item) => add(acc, multiply(fromString(item.precio), item.cantidad)),
    ZERO,
  );
  return toNumericString(total);
}

/** Subtotal de una línea (precio × cantidad). */
export function calcularSubtotalItem(precio: string, cantidad: number): string {
  return toNumericString(multiply(fromString(precio), cantidad));
}

/** Indica si un monto NUMERIC string es mayor a cero. */
export function esPositivo(monto: string): boolean {
  return fromString(monto) > 0n;
}
