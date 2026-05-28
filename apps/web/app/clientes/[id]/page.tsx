import { redirect, notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { LIMITE_PAGINA_DEFAULT, parsePagina } from '@/lib/paginacion';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { APrice, APill, APaginacion } from '@/components/ui';
import { esPositivo } from '@/lib/money';
import type { ApiResponse } from '@posta/shared-types';

interface Cliente {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  cuit?: string | null;
  direccion?: string | null;
  saldo_deudor: string;
}

interface Venta {
  id: string;
  tipo: string;
  estado: string;
  metodo_pago: string;
  total: string;
  created_at: string;
}

const ESTADO_TONE: Record<string, 'ok' | 'warn' | 'err' | 'accent' | 'neutral'> = {
  facturado: 'ok',
  pendiente_facturacion: 'warn',
  error_afip: 'err',
  remito: 'accent',
  presupuesto: 'neutral',
};

function formatFecha(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default async function ClienteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;

  const { id } = await params;
  const { pagina: paginaParam } = await searchParams;
  const pagina = parsePagina(paginaParam);

  let cliente: Cliente;
  try {
    const res = await apiClient<{ data: Cliente }>(`/clientes/${id}`, { token: accessToken });
    cliente = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) redirect(`/login?error=${encodeURIComponent(err.message)}`);
    notFound();
  }

  let ventas: Venta[] = [];
  let totalVentas = 0;
  let errorHistorial: string | null = null;
  try {
    const res = await apiClient<ApiResponse<Venta[]>>(
      `/ventas?cliente_id=${id}&pagina=${pagina}&limite=${LIMITE_PAGINA_DEFAULT}`,
      { token: accessToken },
    );
    ventas = res.data;
    totalVentas = res.meta?.total ?? ventas.length;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    errorHistorial = err instanceof Error ? err.message : 'Error al cargar el historial de compras.';
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Migas */}
        <div className="flex items-center gap-2 font-sans text-xs text-muted mb-6">
          <Link href="/clientes" className="hover:text-accent transition-colors">Clientes</Link>
          <span>/</span>
          <span className="text-ink">{cliente.nombre}</span>
        </div>

        {/* Cabecera */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">{cliente.nombre}</h1>
            {cliente.cuit && <p className="font-mono text-xs text-muted mt-0.5">CUIT {cliente.cuit}</p>}
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-muted mb-0.5">Saldo deudor</p>
            {esPositivo(cliente.saldo_deudor) ? (
              <APrice value={cliente.saldo_deudor} className="text-xl text-neg" />
            ) : (
              <span className="font-mono text-xl text-pos">$0</span>
            )}
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {cliente.email && (
            <div className="bg-card border border-rule rounded-[2px] px-3 py-2">
              <p className="font-mono text-[10px] text-muted uppercase tracking-wider">Email</p>
              <p className="font-sans text-sm text-ink">{cliente.email}</p>
            </div>
          )}
          {cliente.telefono && (
            <div className="bg-card border border-rule rounded-[2px] px-3 py-2">
              <p className="font-mono text-[10px] text-muted uppercase tracking-wider">Teléfono</p>
              <p className="font-sans text-sm text-ink">{cliente.telefono}</p>
            </div>
          )}
          {cliente.direccion && (
            <div className="bg-card border border-rule rounded-[2px] px-3 py-2">
              <p className="font-mono text-[10px] text-muted uppercase tracking-wider">Dirección</p>
              <p className="font-sans text-sm text-ink">{cliente.direccion}</p>
            </div>
          )}
        </div>

        {/* Historial de ventas del cliente */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-sans text-sm font-semibold text-ink">
              Historial de compras ({totalVentas})
            </h2>
            {rol === 'dueno' && (
              <Link href={`/clientes/${id}/editar`} className="font-sans text-xs text-muted hover:text-accent transition-colors">
                Editar cliente →
              </Link>
            )}
          </div>

          {errorHistorial && (
            <div className="bg-err-soft border border-err rounded-[2px] px-4 py-3 mb-3">
              <p className="font-sans text-sm text-err">{errorHistorial}</p>
            </div>
          )}

          <div className="bg-card border border-rule rounded-[2px]" style={{ boxShadow: 'var(--shadow-flat)' }}>
            {ventas.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="font-sans text-sm text-muted">No hay ventas registradas para este cliente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-rule">
                      <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Fecha</th>
                      <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Tipo</th>
                      <th className="text-center py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Estado</th>
                      <th className="text-right py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((v) => (
                      <tr key={v.id} className="border-b border-rule-soft hover:bg-paper-warm transition-colors">
                        <td className="py-2 px-4">
                          <Link href={`/ventas/${v.id}`} className="font-mono text-xs text-muted hover:text-accent transition-colors">
                            {formatFecha(v.created_at)}
                          </Link>
                        </td>
                        <td className="py-2 px-4 font-sans text-sm text-ink">{v.tipo}</td>
                        <td className="py-2 px-4 text-center">
                          <APill tone={ESTADO_TONE[v.estado] ?? 'neutral'}>{v.estado}</APill>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <APrice value={v.total} className="text-sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Suspense fallback={null}>
              <APaginacion pagina={pagina} limite={LIMITE_PAGINA_DEFAULT} total={totalVentas} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
