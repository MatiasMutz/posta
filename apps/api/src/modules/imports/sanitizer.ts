/**
 * Sanitización de celdas de Excel/CSV para el motor de importación.
 * Cada función recibe el valor raw (string o cualquier tipo) y devuelve
 * el valor sanitizado o null si el valor es inválido.
 */

export type SanitizeFn = (v: unknown) => string | number | null;

export function sanitizarTexto(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

/**
 * Normaliza montos argentinos a string NUMERIC compatible (sin símbolo, con punto decimal).
 * Acepta: "$ 1.234,56" / "1234,56" / "1234.56" / "$1234" / "1,234.56"
 */
export function sanitizarMonto(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v.toFixed(2);

  const s = String(v).trim().replace(/[$\s]/g, '');
  if (s === '') return null;

  // Formato argentino: punto para miles, coma para decimal → "1.234,56"
  if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      // coma es decimal: "1.234,56"
      return s.replace(/\./g, '').replace(',', '.');
    } else {
      // punto es decimal: "1,234.56"
      return s.replace(/,/g, '');
    }
  }

  // Solo coma → decimal: "1234,56"
  if (s.includes(',') && !s.includes('.')) {
    return s.replace(',', '.');
  }

  // Solo punto o dígitos → "1234.56" / "1234"
  if (/^\d+(\.\d+)?$/.test(s)) return s;

  return null;
}

/**
 * Entero no negativo. Acepta tanto string como number.
 */
export function sanitizarEntero(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? Math.round(v) : parseInt(String(v).trim(), 10);
  if (isNaN(n) || n < 0) return null;
  return String(n);
}

/**
 * Normaliza fechas DD/MM/AAAA (y variantes comunes) a ISO 8601 (AAAA-MM-DD).
 * También acepta objetos Date (xlsx los parsea automáticamente).
 */
export function sanitizarFecha(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;

  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    return v.toISOString().substring(0, 10);
  }

  const s = String(v).trim();

  // DD/MM/AAAA o DD-MM-AAAA
  const dma = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dma) {
    const [, d, m, y] = dma;
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) return date.toISOString().substring(0, 10);
  }

  // AAAA-MM-DD (ISO ya ok)
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return s;

  return null;
}

/**
 * Normaliza CUIT/CUIL a 11 dígitos sin guiones.
 */
export function sanitizarCuit(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const digits = String(v).replace(/[^0-9]/g, '');
  return digits.length === 11 ? digits : null;
}

/**
 * Valida que un monto sanitizado sea >= 0.
 */
export function validarMontoPositivo(v: string | null): string | null {
  if (v === null) return 'El valor es requerido';
  if (isNaN(parseFloat(v)) || parseFloat(v) < 0) return 'Debe ser un número mayor o igual a 0';
  return null;
}

/**
 * Valida que un texto no sea vacío.
 */
export function validarRequerido(v: string | null): string | null {
  return v === null || v === '' ? 'El campo es requerido' : null;
}
