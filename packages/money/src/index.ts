/**
 * Utilidades de dinero para Posta.
 *
 * Reglas (D-08 + skill money):
 * - Nunca float. Los montos viajan como string (serialización de NUMERIC de PG).
 * - Todas las operaciones se hacen en centavos enteros (bigint).
 * - El tipo Money es opaco: construirlo con fromString/fromCents, no directamente.
 */

declare const _moneyBrand: unique symbol;

/** Monto en centavos. Opaco para evitar mezclar con otros números. */
export type Money = bigint & { readonly [_moneyBrand]: true };

function asMoney(n: bigint): Money {
  return n as Money;
}

/** Construye Money desde un string NUMERIC de la base (ej. "1234.56") */
export function fromString(value: string): Money {
  const [intPart = '0', decPart = '00'] = value.split('.');
  const cents = BigInt(intPart) * 100n + BigInt(decPart.padEnd(2, '0').slice(0, 2));
  return asMoney(cents);
}

/** Construye Money desde centavos enteros */
export function fromCents(cents: bigint): Money {
  return asMoney(cents);
}

export function add(a: Money, b: Money): Money {
  return asMoney(a + b);
}

export function subtract(a: Money, b: Money): Money {
  return asMoney(a - b);
}

export function multiply(a: Money, factor: number): Money {
  // factor se escala a integer para evitar float: se trabaja con 4 decimales
  const scaled = BigInt(Math.round(factor * 10000));
  return asMoney((a * scaled) / 10000n);
}

/** Multiplica por una fracción exacta (numerador/denominador) sin float. Ej: IVA 21/121 */
export function multiplyRatio(a: Money, numerator: bigint, denominator: bigint): Money {
  return asMoney((a * numerator) / denominator);
}

const QTY_SCALE = 1000n; // hasta 3 decimales (NUMERIC 14,3 en items de venta/compra)

function quantityToScaled(quantity: number | string): bigint {
  if (typeof quantity === 'string') {
    const [intPart = '0', decPart = '000'] = quantity.split('.');
    return BigInt(intPart) * QTY_SCALE + BigInt(decPart.padEnd(3, '0').slice(0, 3));
  }
  if (Number.isInteger(quantity)) {
    return BigInt(quantity) * QTY_SCALE;
  }
  const [intPart, decPart = ''] = quantity.toFixed(3).split('.');
  return BigInt(intPart) * QTY_SCALE + BigInt(decPart.padEnd(3, '0').slice(0, 3));
}

/**
 * Multiplica un precio/costo unitario por cantidad de unidades.
 * La cantidad NO es dinero: es un factor entero o fraccional (hasta 3 decimales).
 * Usar esto en vez de `multiply(monto, Number(cantidad))` para no confundir unidades con montos.
 */
export function multiplyByQuantity(unitPrice: Money, quantity: number | string): Money {
  return asMoney((unitPrice * quantityToScaled(quantity)) / QTY_SCALE);
}

export function isNegative(m: Money): boolean {
  return m < 0n;
}

/** Serializa a string NUMERIC apto para INSERT en Postgres */
export function toNumericString(m: Money): string {
  const abs = m < 0n ? -m : m;
  const negative = m < 0n;
  const int = abs / 100n;
  const dec = abs % 100n;
  return `${negative ? '-' : ''}${int}.${String(dec).padStart(2, '0')}`;
}

export const ZERO: Money = asMoney(0n);
