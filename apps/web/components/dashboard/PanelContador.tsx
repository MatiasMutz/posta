'use client';
import Link from 'next/link';
import { Suspense } from 'react';
import { ABtn, APrice, APill, APaginacion } from '@/components/ui';
import { LIMITE_PAGINA_DEFAULT } from '@/lib/paginacion';
import { BtnExportarIva } from '@/components/ventas/BtnExportarIva';
import { BtnExportarIvaCompras } from '@/components/compras/BtnExportarIvaCompras';

interface ResumenContador {
  periodo: { desde: string; hasta: string };
  ventas: {
    neto_gravado: string;
    iva_debito: string;
    total_facturado: string;
    comprobantes: number;
    pendientes_cae: number;
  };
  compras: {
    neto_gravado: string;
    iva_credito: string;
    total: string;
    comprobantes: number;
  };
}

interface Comprobante {
  id: string;
  fecha: string;
  tipo: string;
  estado: string;
  numero_comprobante: number | null;
  cae: string | null;
  cliente: string;
  cuit: string | null;
  neto: string;
  iva: string;
  total: string;
}

const ESTADO_TONE: Record<string, 'ok' | 'warn' | 'err' | 'neutral'> = {
  facturado: 'ok',
  pendiente_facturacion: 'warn',
  error_afip: 'err',
};

interface PanelContadorProps {
  resumen: ResumenContador;
  comprobantes: Comprobante[];
  totalComprobantes: number;
  pagina: number;
  token: string;
  tenantNombre: string;
}

function KpiFiscal({ label, value, numerico }: { label: string; value: string | number; numerico?: boolean }) {
  return (
    <div className="bg-card border border-rule rounded-[2px] p-4" style={{ boxShadow: 'var(--shadow-flat)' }}>
      <p className="font-mono text-[10px] text-muted uppercase tracking-wider mb-1.5">{label}</p>
      {numerico ? (
        <p className="font-serif text-2xl text-ink">{value}</p>
      ) : (
        <APrice value={String(value)} className="text-xl" />
      )}
    </div>
  );
}

export function PanelContador({
  resumen, comprobantes, totalComprobantes, pagina, token, tenantNombre,
}: PanelContadorProps) {
  const { ventas, compras, periodo } = resumen;
  const todosConCae = ventas.pendientes_cae === 0;

  return (
    <div className="space-y-5">
      <div className="bg-ink text-paper px-4 py-3 md:px-6 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-serif text-xl">Posta</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-paper/55">
            Modo contador · acceso limitado a comprobantes
          </span>
        </div>
        <span className="font-sans text-sm text-paper/80">{tenantNombre}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-ink tracking-tight">Libro IVA Ventas</h1>
          <p className="font-sans text-sm text-muted mt-1">
            Período {periodo.desde} → {periodo.hasta} · {tenantNombre}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <BtnExportarIva token={token} />
          <BtnExportarIvaCompras token={token} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiFiscal label="Neto gravado" value={ventas.neto_gravado} />
        <KpiFiscal label="IVA débito fiscal" value={ventas.iva_debito} />
        <KpiFiscal label="Total facturado" value={ventas.total_facturado} />
        <KpiFiscal label="Comprobantes" value={ventas.comprobantes} numerico />
        <KpiFiscal
          label="Pendientes CAE"
          value={ventas.pendientes_cae}
          numerico
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiFiscal label="IVA crédito compras" value={compras.iva_credito} />
        <KpiFiscal label="Neto compras" value={compras.neto_gravado} />
        <KpiFiscal label="Total compras" value={compras.total} />
        <KpiFiscal label="Comp. compras" value={compras.comprobantes} numerico />
      </div>

      <div className="bg-card border border-rule rounded-[2px] overflow-hidden" style={{ boxShadow: 'var(--shadow-flat)' }}>
        <div className="px-4 py-3 border-b border-rule bg-paper-warm flex justify-between items-center">
          <h2 className="font-serif text-lg text-ink">Comprobantes emitidos</h2>
          <span className="font-mono text-[10px] text-muted uppercase">{totalComprobantes} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-rule bg-paper-warm">
                {['Fecha', 'Comprobante', 'Tipo', 'Cliente', 'Neto', 'IVA', 'Total', 'Estado', 'CAE'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 font-mono text-[10px] uppercase tracking-wider text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comprobantes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center font-sans text-sm text-muted">
                    No hay comprobantes en este período.
                  </td>
                </tr>
              ) : (
                comprobantes.map((v) => (
                  <tr key={v.id} className="border-b border-rule-soft hover:bg-paper-warm transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs text-muted">
                      <Link href={`/ventas/${v.id}`} className="hover:text-accent">{v.fecha}</Link>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-ink">
                      {v.numero_comprobante ? `#${v.numero_comprobante}` : '—'}
                    </td>
                    <td className="py-2.5 px-3"><APill tone="neutral">{v.tipo}</APill></td>
                    <td className="py-2.5 px-3 font-sans text-sm text-ink max-w-[160px] truncate">{v.cliente}</td>
                    <td className="py-2.5 px-3 text-right"><APrice value={v.neto} className="text-xs" /></td>
                    <td className="py-2.5 px-3 text-right"><APrice value={v.iva} className="text-xs text-muted" /></td>
                    <td className="py-2.5 px-3 text-right"><APrice value={v.total} className="text-sm" /></td>
                    <td className="py-2.5 px-3"><APill tone={ESTADO_TONE[v.estado] ?? 'neutral'}>{v.estado}</APill></td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-muted max-w-[100px] truncate">{v.cae ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Suspense fallback={null}>
          <APaginacion pagina={pagina} limite={LIMITE_PAGINA_DEFAULT} total={totalComprobantes} />
        </Suspense>
      </div>

      {todosConCae ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-ok-soft border border-ok rounded-[2px]">
          <span className="text-pos font-sans text-sm">
            Todos los comprobantes facturados del período tienen CAE vigente.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 bg-warn-soft border border-warn rounded-[2px]">
          <span className="text-warn font-sans text-sm">
            Hay {ventas.pendientes_cae} comprobante{ventas.pendientes_cae === 1 ? '' : 's'} pendiente{ventas.pendientes_cae === 1 ? '' : 's'} de autorización AFIP.
          </span>
          <Link href="/ventas/historial"><ABtn variant="secondary" size="sm">Ver historial</ABtn></Link>
        </div>
      )}
    </div>
  );
}
