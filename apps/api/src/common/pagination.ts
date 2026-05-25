import type { ApiResponse } from '@posta/shared-types';

export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
}

export function respuestaPaginada<T>(
  items: T[],
  pagina: number,
  limite: number,
  total: number,
): ApiResponse<T[]> {
  return {
    data: items,
    meta: { pagina, limite, total },
  };
}
