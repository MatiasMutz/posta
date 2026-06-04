import type { ApiResponse } from '@posta/shared-types';

export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
}

/** Postgres count() vía Drizzle devuelve bigint; JSON no lo serializa. */
export function toPaginaTotal(total: number | bigint): number {
  return typeof total === 'bigint' ? Number(total) : total;
}

export function respuestaPaginada<T>(
  items: T[],
  pagina: number,
  limite: number,
  total: number | bigint,
): ApiResponse<T[]> {
  return {
    data: items,
    meta: { pagina, limite, total: toPaginaTotal(total) },
  };
}
