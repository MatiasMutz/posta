import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { LIMITE_PAGINA_DEFAULT, parsePagina } from '@/lib/paginacion';
import { APrice, APaginacion, ABtn } from '@/components/ui';
import { esPositivo } from '@/lib/money';
import type { ApiResponse } from '@posta/shared-types';

interface Proveedor {
  id: string;
  nombre: string;
  email?: string | null;
  cuit?: string | null;
  saldo_acreedor: string;
}

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;

  if (rol === 'vendedor') redirect('/ventas');

  const { pagina: paginaParam } = await searchParams;
  const pagina = parsePagina(paginaParam);

  let lista: Proveedor[] = [];
  let total = 0;
  let errorMensaje: string | null = null;

  try {
    const res = await apiClient<ApiResponse<Proveedor[]>>(
      `/proveedores?pagina=${pagina}&limite=${LIMITE_PAGINA_DEFAULT}`,
      { token: accessToken },
    );
    lista = res.data;
    total = res.meta?.total ?? lista.length;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    errorMensaje = err instanceof Error ? err.message : 'Error al cargar los proveedores.';
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">Proveedores</h1>
            <p className="font-sans text-sm text-muted">{total} proveedor{total !== 1 ? 'es' : ''}</p>
          </div>
          {rol === 'dueno' && (
            <Link href="/proveedores/nuevo">
              <ABtn variant="primary" size="sm">+ Nuevo</ABtn>
            </Link>
          )}
        </div>

        {errorMensaje && (
          <p className="font-sans text-sm text-err mb-4">{errorMensaje}</p>
        )}

        <div className="bg-card border border-rule rounded-[2px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted">Nombre</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted hidden sm:table-cell">CUIT</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className="border-b border-rule last:border-0 hover:bg-paper transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/proveedores/${p.id}`} className="font-sans text-sm text-ink hover:text-accent">
                      {p.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-sans text-xs text-muted hidden sm:table-cell">{p.cuit ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {esPositivo(p.saldo_acreedor) ? (
                      <APrice value={p.saldo_acreedor} className="text-sm text-warn" />
                    ) : (
                      <span className="font-sans text-sm text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {lista.length === 0 && !errorMensaje && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center font-sans text-sm text-muted">
                    No hay proveedores cargados.
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
