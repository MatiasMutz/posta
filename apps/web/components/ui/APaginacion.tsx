'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { rangoPaginacion } from '@/lib/paginacion';
import { ABtn } from './ABtn';

interface APaginacionProps {
  pagina: number;
  limite: number;
  total: number;
}

export function APaginacion({ pagina, limite, total }: APaginacionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { desde, hasta, totalPaginas } = rangoPaginacion(pagina, limite, total);
  const hayAnterior = pagina > 1;
  const haySiguiente = pagina < totalPaginas;

  function irAPagina(nuevaPagina: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nuevaPagina <= 1) {
      params.delete('pagina');
    } else {
      params.set('pagina', String(nuevaPagina));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3"
    >
      <p className="font-sans text-xs text-muted">
        {total === 0 ? (
          'Sin resultados'
        ) : (
          <>
            <span className="font-mono text-ink">{desde}</span>
            {' – '}
            <span className="font-mono text-ink">{hasta}</span>
            {' de '}
            <span className="font-mono text-ink">{total}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <ABtn
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => irAPagina(pagina - 1)}
          disabled={!hayAnterior}
          aria-label="Página anterior"
        >
          Anterior
        </ABtn>
        <span className="font-mono text-xs text-muted min-w-[4.5rem] text-center">
          {pagina} / {totalPaginas}
        </span>
        <ABtn
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => irAPagina(pagina + 1)}
          disabled={!haySiguiente}
          aria-label="Página siguiente"
        >
          Siguiente
        </ABtn>
      </div>
    </nav>
  );
}
