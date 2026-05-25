import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { apiClient, ApiError } from '@/lib/api-client';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { APrice, APill } from '@/components/ui';
import { BtnReintentarAfip } from '@/components/ventas/BtnReintentarAfip';
import type { Rol } from '@posta/shared-types';

interface ItemVenta {
  id: string;
  descripcion: string;
  cantidad: string;
  precio_unitario: string;
  subtotal: string;
}

interface Venta {
  id: string;
  tipo: string;
  estado: string;
  metodo_pago: string;
  subtotal: string;
  descuento: string;
  total: string;
  cae?: string | null;
  cae_vencimiento?: string | null;
  numero_comprobante?: number | null;
  observaciones?: string | null;
  created_at: string;
  items: ItemVenta[];
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
  pendiente_facturacion: 'Pendiente de facturación',
  error_afip: 'Error AFIP',
  remito: 'Remito',
  presupuesto: 'Presupuesto',
};

function formatFecha(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default async function VentaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const rol = (session.user.app_metadata?.rol ?? 'vendedor') as Rol;

  let venta: Venta;
  try {
    venta = await apiClient<Venta>(`/ventas/${id}`, { token: session.access_token });
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    notFound();
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Migas */}
        <div className="flex items-center gap-2 font-sans text-xs text-muted mb-6">
          <Link href="/ventas/historial" className="hover:text-accent transition-colors">Ventas</Link>
          <span>/</span>
          <span className="font-mono text-ink">{id.slice(0, 8)}…</span>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">
              {venta.tipo === 'factura_b' ? 'Factura B' :
               venta.tipo === 'factura_a' ? 'Factura A' :
               venta.tipo === 'remito' ? 'Remito' : 'Presupuesto'}
            </h1>
            <p className="font-sans text-xs text-muted mt-0.5">{formatFecha(venta.created_at)}</p>
          </div>
          <APill tone={ESTADO_TONE[venta.estado] ?? 'neutral'}>
            {ESTADO_LABEL[venta.estado] ?? venta.estado}
          </APill>
        </div>

        {/* Ítems */}
        <div className="bg-card border border-rule rounded-[2px] mb-4" style={{ boxShadow: 'var(--shadow-flat)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Producto</th>
                <th className="text-right py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Cant.</th>
                <th className="text-right py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">P. Unit.</th>
                <th className="text-right py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.items.map((item) => (
                <tr key={item.id} className="border-b border-rule-soft">
                  <td className="py-2 px-4 font-sans text-sm text-ink">{item.descripcion}</td>
                  <td className="py-2 px-4 text-right font-mono text-sm text-ink">{item.cantidad}</td>
                  <td className="py-2 px-4 text-right"><APrice value={item.precio_unitario} className="text-sm" /></td>
                  <td className="py-2 px-4 text-right"><APrice value={item.subtotal} className="text-sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-rule space-y-1">
            <div className="flex justify-between font-sans text-sm text-muted">
              <span>Subtotal</span>
              <APrice value={venta.subtotal} className="text-sm" />
            </div>
            {parseFloat(venta.descuento) > 0 && (
              <div className="flex justify-between font-sans text-sm text-muted">
                <span>Descuento</span>
                <span className="text-err">−<APrice value={venta.descuento} className="text-sm" /></span>
              </div>
            )}
            <div className="flex justify-between font-sans font-semibold text-ink">
              <span>Total</span>
              <APrice value={venta.total} className="text-base" />
            </div>
          </div>
        </div>

        {/* AFIP / Comprobante */}
        {venta.cae && (
          <div className="bg-card border border-rule rounded-[2px] px-4 py-3 mb-4 space-y-1">
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-muted uppercase tracking-wider">CAE</span>
              <span className="font-mono text-sm text-ink">{venta.cae}</span>
            </div>
            {venta.numero_comprobante && (
              <div className="flex justify-between">
                <span className="font-mono text-[11px] text-muted uppercase tracking-wider">Nro. Comprobante</span>
                <span className="font-mono text-sm text-ink">{venta.numero_comprobante}</span>
              </div>
            )}
            {venta.cae_vencimiento && (
              <div className="flex justify-between">
                <span className="font-mono text-[11px] text-muted uppercase tracking-wider">Venc. CAE</span>
                <span className="font-mono text-sm text-ink">{venta.cae_vencimiento}</span>
              </div>
            )}
          </div>
        )}

        {/* Reintento AFIP */}
        {(venta.estado === 'pendiente_facturacion' || venta.estado === 'error_afip') && rol === 'dueno' && (
          <div className="mb-4">
            <BtnReintentarAfip ventaId={venta.id} token={session.access_token} />
          </div>
        )}

        {venta.observaciones && (
          <p className="font-sans text-sm text-muted">{venta.observaciones}</p>
        )}
      </div>
    </div>
  );
}
