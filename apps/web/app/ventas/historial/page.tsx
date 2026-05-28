import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { LIMITE_PAGINA_DEFAULT, parsePagina } from '@/lib/paginacion';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { APrice, APill, APaginacion } from '@/components/ui';
import { BtnReintentarAfip } from '@/components/ventas/BtnReintentarAfip';
import { BtnExportarIva } from '@/components/ventas/BtnExportarIva';
import type { ApiResponse } from '@posta/shared-types';

interface Venta {
  id: string;
  tipo: string;
  estado: string;
  metodo_pago: string;
  total: string;
  cae?: string | null;
  numero_comprobante?: number | null;
  created_at: string;
}

const ESTADO_TONE: Record<string, 'ok' | 'warn' | 'err' | 'accent' | 'neutral'> = {
  facturado: 'ok',
  pendiente_facturacion: 'warn',
  error_afip: 'err',
  remito: 'accent',
  presupuesto: 'neutral',
};

const ESTADO_LABEL: Record<string, string> = {
  facturado: 'Facturado',
  pendiente_facturacion: 'Pendiente',
  error_afip: 'Error AFIP',
  remito: 'Remito',
  presupuesto: 'Presupuesto',
};

const TIPO_LABEL: Record<string, string> = {
  factura_b: 'Fac. B',
  factura_a: 'Fac. A',
  remito: 'Remito',
  presupuesto: 'Presupuesto',
};

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  debito: 'Débito',
  credito: 'Crédito',
  transferencia: 'Transf.',
  cuenta_corriente: 'Cta. Cte.',
};

function formatFecha(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default async function HistorialVentasPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;

  if (rol === 'vendedor') redirect('/ventas');

  const { pagina: paginaParam } = await searchParams;
  const pagina = parsePagina(paginaParam);

  let ventasList: Venta[] = [];
  let total = 0;
  let errorMensaje: string | null = null;

  try {
    const res = await apiClient<ApiResponse<Venta[]>>(
      `/ventas?pagina=${pagina}&limite=${LIMITE_PAGINA_DEFAULT}`,
      { token: accessToken },
    );
    ventasList = res.data;
    total = res.meta?.total ?? ventasList.length;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    errorMensaje = err instanceof Error ? err.message : 'Error al cargar el historial.';
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">Historial de ventas</h1>
            <p className="font-sans text-sm text-muted">{total} venta{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {rol === 'dueno' && (
              <Link href="/ventas" className="font-sans text-xs text-accent hover:underline">
                ← Ir al POS
              </Link>
            )}
            <BtnExportarIva token={accessToken} />
          </div>
        </div>

        {errorMensaje && (
          <div className="bg-err-soft border border-err rounded-[2px] px-4 py-3 mb-4">
            <p className="font-sans text-sm text-err">{errorMensaje}</p>
          </div>
        )}

        <div className="bg-card border border-rule rounded-[2px]" style={{ boxShadow: 'var(--shadow-flat)' }}>
          {ventasList.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="font-sans text-sm text-muted">No hay ventas registradas todavía.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-rule">
                    <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Fecha</th>
                    <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Tipo</th>
                    <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Pago</th>
                    <th className="text-center py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Estado</th>
                    <th className="text-right py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Total</th>
                    <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">CAE / Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasList.map((v) => (
                    <tr key={v.id} className="border-b border-rule-soft hover:bg-paper-warm transition-colors">
                      <td className="py-2 px-4">
                        <span className="font-mono text-xs text-muted">{formatFecha(v.created_at)}</span>
                      </td>
                      <td className="py-2 px-4">
                        <span className="font-sans text-sm text-ink">{TIPO_LABEL[v.tipo] ?? v.tipo}</span>
                      </td>
                      <td className="py-2 px-4">
                        <span className="font-sans text-xs text-muted">{METODO_LABEL[v.metodo_pago] ?? v.metodo_pago}</span>
                      </td>
                      <td className="py-2 px-4 text-center">
                        <APill tone={ESTADO_TONE[v.estado] ?? 'neutral'}>
                          {ESTADO_LABEL[v.estado] ?? v.estado}
                        </APill>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <APrice value={v.total} className="text-base" />
                      </td>
                      <td className="py-2 px-4">
                        {v.cae ? (
                          <span className="font-mono text-xs text-muted">{v.cae}</span>
                        ) : (v.estado === 'pendiente_facturacion' || v.estado === 'error_afip') && rol === 'dueno' ? (
                          <BtnReintentarAfip ventaId={v.id} token={accessToken} />
                        ) : '—'}
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
