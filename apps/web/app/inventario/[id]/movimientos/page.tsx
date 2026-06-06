import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { LIMITE_PAGINA_DEFAULT, parsePagina } from '@/lib/paginacion';
import { FormMovimiento } from '@/components/inventario/FormMovimiento';
import { APill, APaginacion } from '@/components/ui';
import type { ApiResponse } from '@posta/shared-types';

interface Movimiento {
  id: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stock_anterior: number;
  stock_posterior: number;
  motivo?: string | null;
  created_at: string;
}

interface Producto {
  id: string;
  nombre: string;
  sku?: string | null;
  stock_actual: number;
  stock_minimo: number;
}

const TIPO_LABEL: Record<Movimiento['tipo'], string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
};

const TIPO_TONE: Record<Movimiento['tipo'], 'ok' | 'err' | 'accent'> = {
  entrada: 'ok',
  salida: 'err',
  ajuste: 'accent',
};

function formatFecha(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export default async function MovimientosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;

  if (rol === 'vendedor') redirect('/inventario');

  const { id } = await params;
  const { pagina: paginaParam } = await searchParams;
  const pagina = parsePagina(paginaParam);

  let producto: Producto;
  try {
    const res = await apiClient<{ data: Producto }>(
      `/inventario/productos/${id}`,
      { token: accessToken },
    );
    producto = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    notFound();
  }

  let movimientos: Movimiento[] = [];
  let totalMovimientos = 0;
  try {
    const res = await apiClient<ApiResponse<Movimiento[]>>(
      `/inventario/productos/${id}/movimientos?pagina=${pagina}&limite=${LIMITE_PAGINA_DEFAULT}`,
      { token: accessToken },
    );
    movimientos = res.data;
    totalMovimientos = res.meta?.total ?? movimientos.length;
  } catch {
    // No bloquear la página si el historial falla
  }

  const puedeRegistrar = rol === 'dueno';

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">

      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Migas de pan */}
        <div className="flex items-center gap-2 font-sans text-xs text-muted mb-6">
          <Link href="/inventario" className="hover:text-accent transition-colors">
            Inventario
          </Link>
          <span>/</span>
          <span className="text-ink">{producto.nombre}</span>
          <span>/</span>
          <span>Movimientos</span>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">{producto.nombre}</h1>
            {producto.sku && (
              <p className="font-mono text-xs text-muted mt-0.5">{producto.sku}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl text-ink">{producto.stock_actual}</p>
            <p className="font-sans text-xs text-muted">stock actual</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_320px] md:items-start">
          {/* Historial */}
          <section>
            <h2 className="font-sans text-sm font-semibold text-ink mb-3">
              Historial de movimientos
            </h2>

            {movimientos.length === 0 ? (
              <div
                className="bg-card border border-rule rounded-[2px]"
                style={{ boxShadow: 'var(--shadow-flat)' }}
              >
                <div className="px-4 py-10 text-center">
                  <p className="font-sans text-sm text-muted">
                    No hay movimientos registrados todavía.
                  </p>
                </div>
                <Suspense fallback={null}>
                  <APaginacion
                    pagina={pagina}
                    limite={LIMITE_PAGINA_DEFAULT}
                    total={totalMovimientos}
                  />
                </Suspense>
              </div>
            ) : (
              <div
                className="bg-card border border-rule rounded-[2px] overflow-x-auto"
                style={{ boxShadow: 'var(--shadow-flat)' }}
              >
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="border-b border-rule">
                      <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">
                        Fecha
                      </th>
                      <th className="text-center py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">
                        Tipo
                      </th>
                      <th className="text-right py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">
                        Cant.
                      </th>
                      <th className="text-right py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">
                        Stock
                      </th>
                      <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">
                        Motivo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-rule-soft hover:bg-paper-warm transition-colors"
                      >
                        <td className="py-2 px-4">
                          <span className="font-mono text-xs text-muted">
                            {formatFecha(m.created_at)}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-center">
                          <APill tone={TIPO_TONE[m.tipo]}>
                            {TIPO_LABEL[m.tipo]}
                          </APill>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <span className="font-mono text-sm text-ink">
                            {m.tipo === 'ajuste' ? m.cantidad : `${m.tipo === 'salida' ? '−' : '+'}${m.cantidad}`}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <span className="font-mono text-xs text-muted">
                            {m.stock_anterior} → {m.stock_posterior}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span className="font-sans text-xs text-muted">
                            {m.motivo ?? '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Suspense fallback={null}>
                  <APaginacion
                    pagina={pagina}
                    limite={LIMITE_PAGINA_DEFAULT}
                    total={totalMovimientos}
                  />
                </Suspense>
              </div>
            )}
          </section>

          {/* Formulario de registro (solo dueño) */}
          {puedeRegistrar && (
            <section>
              <h2 className="font-sans text-sm font-semibold text-ink mb-3">
                Registrar movimiento
              </h2>
              <div
                className="bg-card border border-rule rounded-[2px] p-4"
                style={{ boxShadow: 'var(--shadow-flat)' }}
              >
                <FormMovimiento productoId={id} token={accessToken} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
