import { LIMITE_PAGINA_DEFAULT } from '@posta/validation';

export { LIMITE_PAGINA_DEFAULT };

export function parsePagina(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export function rangoPaginacion(pagina: number, limite: number, total: number) {
  const totalPaginas = total === 0 ? 1 : Math.ceil(total / limite);
  const desde = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const hasta = Math.min(pagina * limite, total);

  return { desde, hasta, totalPaginas };
}
