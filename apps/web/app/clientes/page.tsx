import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { apiClient, ApiError } from '@/lib/api-client';
import { LIMITE_PAGINA_DEFAULT, parsePagina } from '@/lib/paginacion';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { APrice, APaginacion } from '@/components/ui';
import type { ApiResponse } from '@posta/shared-types';

interface Cliente {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  cuit?: string | null;
  saldo_deudor: string;
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const rol = session.user.app_metadata?.rol;
  if (rol === 'vendedor') redirect('/ventas');

  const { pagina: paginaParam } = await searchParams;
  const pagina = parsePagina(paginaParam);

  let clientesList: Cliente[] = [];
  let total = 0;
  let errorMensaje: string | null = null;

  try {
    const res = await apiClient<ApiResponse<Cliente[]>>(
      `/clientes?pagina=${pagina}&limite=${LIMITE_PAGINA_DEFAULT}`,
      { token: session.access_token },
    );
    clientesList = res.data;
    total = res.meta?.total ?? clientesList.length;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    errorMensaje = err instanceof Error ? err.message : 'Error al cargar los clientes.';
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">Clientes</h1>
            <p className="font-sans text-sm text-muted">{total} cliente{total !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/clientes/nuevo"
            className="px-3 py-1.5 font-sans text-xs font-medium bg-accent text-card rounded-[2px] hover:opacity-90 transition-opacity"
          >
            + Nuevo cliente
          </Link>
        </div>

        {errorMensaje && (
          <div className="bg-err-soft border border-err rounded-[2px] px-4 py-3 mb-4">
            <p className="font-sans text-sm text-err">{errorMensaje}</p>
          </div>
        )}

        <div className="bg-card border border-rule rounded-[2px]" style={{ boxShadow: 'var(--shadow-flat)' }}>
          {clientesList.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="font-sans text-sm text-muted">
                No hay clientes todavía.{' '}
                <Link href="/clientes/nuevo" className="text-accent hover:underline">Agregar el primero</Link>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-rule">
                    <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Nombre</th>
                    <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">CUIT</th>
                    <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Email</th>
                    <th className="text-right py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Saldo deudor</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesList.map((c) => (
                    <tr key={c.id} className="border-b border-rule-soft hover:bg-paper-warm transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/clientes/${c.id}`} className="font-sans text-sm text-ink hover:text-accent transition-colors">
                          {c.nombre}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-muted">{c.cuit ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-sans text-xs text-muted">{c.email ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {parseFloat(c.saldo_deudor) > 0 ? (
                          <APrice value={c.saldo_deudor} className="text-sm text-err" />
                        ) : (
                          <span className="font-mono text-xs text-muted">$0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Suspense fallback={null}>
            <APaginacion pagina={pagina} limite={LIMITE_PAGINA_DEFAULT} total={total} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
