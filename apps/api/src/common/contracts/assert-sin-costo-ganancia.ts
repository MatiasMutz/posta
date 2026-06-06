import { expect } from 'vitest';

/** Campos que el vendedor y el contador nunca deben recibir (regla §3 CLAUDE.md). */
export const CAMPOS_SENSIBLES_VENDEDOR = [
  'costo',
  'ganancia',
  'gananciaMes',
  'ganancia_estimada_mes',
  'costo_mercaderia',
] as const;

/**
 * Recorre el JSON de respuesta y falla si aparece algún campo sensible.
 * Usado en specs de contrato para detectar regresiones silenciosas.
 */
export function assertSinCostoNiGanancia(body: unknown, path = '$'): void {
  if (body === null || body === undefined) return;

  if (Array.isArray(body)) {
    body.forEach((item, index) => assertSinCostoNiGanancia(item, `${path}[${index}]`));
    return;
  }

  if (typeof body === 'object') {
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      expect(
        (CAMPOS_SENSIBLES_VENDEDOR as readonly string[]).includes(key),
        `Campo sensible "${key}" en ${path}`,
      ).toBe(false);
      assertSinCostoNiGanancia(value, `${path}.${key}`);
    }
  }
}
