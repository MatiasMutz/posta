import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { LIMITE_PAGINA_DEFAULT, parsePagina } from '@/lib/paginacion';
import { APrice, APaginacion, ABtn } from '@/components/ui';
import { BtnExportarIvaCompras } from '@/components/compras/BtnExportarIvaCompras';
import type { ApiResponse } from '@posta/shared-types';

interface Compra {
  id: string;
  proveedor_nombre?: string | null;
  categoria: string;
  tipo_comprobante: string;
  metodo_pago: string;
  total: string;
  created_at: string;
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  debito: 'Débito',
  credito: 'Crédito',
  transferencia: 'Transf.',
  cuenta_corriente: 'Cta. Cte.',
};

function formatFecha(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default async function HistorialComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const sesion = await requireSesion();
  if (sesion.rol === 'vendedor') redirect('/ventas');

  const { pagina: paginaParam } = await searchParams;
  const pagina = parsePagina(paginaParam);

  let lista: Compra[] = [];
  let total = 0;
  let errorMensaje: string | null = null;

  try {
    const res = await apiClient<ApiResponse<Compra[]>>(
      `/compras?pagina=${pagina}&limite=${LIMITE_PAGINA_DEFAULT}`,
      { token: sesion.accessToken },
    );
    lista = res.data;
    total = res.meta?.total ?? lista.length;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    errorMensaje = err instanceof Error ? err.message : 'Error al cargar el historial de compras.';
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">Compras y gastos</h1>
            <p className="font-sans text-sm text-muted">{total} registro{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {sesion.rol === 'dueno' && (
              <Link href="/compras/nueva">
                <ABtn variant="primary" size="sm">+ Registrar</ABtn>
              </Link>
            )}
            <BtnExportarIvaCompras token={sesion.accessToken} />
          </div>
        </div>

        {errorMensaje && (
          <p className="font-sans text-sm text-err mb-4">{errorMensaje}</p>
        )}

        <div className="bg-card border border-rule rounded-[2px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted">Fecha</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted">Proveedor</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted hidden sm:table-cell">Tipo</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted">Total</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} className="border-b border-rule last:border-0">
                  <td className="px-4 py-3 font-sans text-xs text-muted">{formatFecha(c.created_at)}</td>
                  <td className="px-4 py-3 font-sans text-sm text-ink">{c.proveedor_nombre ?? '—'}</td>
                  <td className="px-4 py-3 font-sans text-xs text-muted hidden sm:table-cell capitalize">
                    {c.categoria} · {METODO_LABEL[c.metodo_pago] ?? c.metodo_pago}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <APrice value={c.total} className="text-sm" />
                  </td>
                </tr>
              ))}
              {lista.length === 0 && !errorMensaje && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-sans text-sm text-muted">
                    No hay compras registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Suspense fallback={null}>
          <APaginacion pagina={pagina} limite={LIMITE_PAGINA_DEFAULT} total={total} />
        </Suspense>
      </div>
    </div>
  );
}
