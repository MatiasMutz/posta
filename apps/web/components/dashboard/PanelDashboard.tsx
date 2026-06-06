'use client';
import Link from 'next/link';
import { ABtn, APrice, APill } from '@/components/ui';
import { esPositivo } from '@/lib/money';
import {
  GraficoVentas, KpiCard, saludoDesdeEmail, saludoHorario, formatFechaLarga,
} from '@/components/dashboard/DashboardWidgets';

export interface DashboardData {
  saludo: { email: string; tenant_nombre: string; fecha: string };
  kpis: {
    ventas_hoy: string;
    ventas_ayer: string;
    variacion_hoy: string | null;
    ventas_mes: string;
    promedio_diario_mes: string;
    saldo_caja: string;
    caja_abierta: boolean;
    cuentas_a_cobrar: string;
    clientes_con_deuda: number;
    ganancia_estimada_mes: string;
    productos_stock_bajo: number;
  };
  ventas_ultimos_dias: Array<{ dia: string; etiqueta: string; total: string; es_hoy: boolean }>;
  top_productos_hoy: Array<{ producto_id: string | null; nombre: string; cantidad: string; monto: string }>;
  horarios_pico: Array<{ hora: number; cantidad: number; total: string }>;
  alertas: Array<{ tipo: string; titulo: string; descripcion: string; tono: 'ok' | 'warn' | 'err' }>;
  cuentas_corrientes: Array<{ id: string; nombre: string; saldo: string }>;
  stock_bajo: Array<{ id: string; nombre: string; sku: string | null; stock_actual: number; stock_minimo: number }>;
}

const ALERTA_BG: Record<string, string> = {
  ok: 'bg-ok-soft',
  warn: 'bg-warn-soft',
  err: 'bg-err-soft',
};

interface PanelDashboardProps {
  data: DashboardData;
}

export function PanelDashboard({ data }: PanelDashboardProps) {
  const nombre = saludoDesdeEmail(data.saludo.email);
  const alertasActivas = data.alertas.length;

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-ink tracking-tight">
            {saludoHorario()}, {nombre}.
          </h1>
          <p className="font-mono text-[11px] text-muted uppercase tracking-wider mt-1.5">
            {formatFechaLarga(data.saludo.fecha)} · {data.saludo.tenant_nombre}
            {alertasActivas > 0 && ` · ${alertasActivas} alerta${alertasActivas === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/ventas">
            <ABtn variant="ink" size="sm">Ir al POS</ABtn>
          </Link>
          {alertasActivas > 0 && (
            <Link href="/inventario?solo_bajo_stock=1">
              <ABtn variant="secondary" size="sm">{alertasActivas} alertas</ABtn>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-3.5">
        <KpiCard
          label="Ventas hoy"
          value={data.kpis.ventas_hoy}
          sub={data.kpis.variacion_hoy ? `${data.kpis.variacion_hoy} vs ayer` : undefined}
          subTone={data.kpis.variacion_hoy?.startsWith('+') ? 'ok' : 'neutral'}
        />
        <KpiCard
          label="Facturación del mes"
          value={data.kpis.ventas_mes}
          sub={`${data.kpis.promedio_diario_mes} / día promedio`}
        />
        <KpiCard label="Saldo en caja" value={data.kpis.saldo_caja} sub={data.kpis.caja_abierta ? 'Caja abierta' : 'Caja cerrada'} subTone={data.kpis.caja_abierta ? 'ok' : 'warn'} />
        <KpiCard
          label="Cuentas a cobrar"
          value={data.kpis.cuentas_a_cobrar}
          sub={data.kpis.clientes_con_deuda > 0 ? `${data.kpis.clientes_con_deuda} con saldo` : 'Al día'}
          subTone={data.kpis.clientes_con_deuda > 0 ? 'warn' : 'ok'}
          valueClassName="text-neg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          <div className="bg-card border border-rule rounded-[2px] p-5" style={{ boxShadow: 'var(--shadow-flat)' }}>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-serif text-xl text-ink">Ventas · últimos {data.ventas_ultimos_dias.length} días</h2>
            </div>
            <GraficoVentas datos={data.ventas_ultimos_dias} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-rule rounded-[2px] overflow-hidden" style={{ boxShadow: 'var(--shadow-flat)' }}>
              <div className="px-4 py-3 border-b border-rule bg-paper-warm">
                <h2 className="font-serif text-lg text-ink">Más vendidos hoy</h2>
              </div>
              {data.top_productos_hoy.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted text-center">Sin ventas hoy todavía.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-rule">
                      <th className="py-2 px-4 text-left font-mono text-[10px] uppercase text-muted">#</th>
                      <th className="py-2 px-4 text-left font-mono text-[10px] uppercase text-muted">Producto</th>
                      <th className="py-2 px-4 text-right font-mono text-[10px] uppercase text-muted">Unid.</th>
                      <th className="py-2 px-4 text-right font-mono text-[10px] uppercase text-muted">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_productos_hoy.map((p, i) => (
                      <tr key={`${p.producto_id ?? p.nombre}-${i}`} className="border-b border-rule-soft">
                        <td className="py-2.5 px-4 font-serif text-lg text-muted">{i + 1}</td>
                        <td className="py-2.5 px-4 font-sans text-sm text-ink font-medium">{p.nombre}</td>
                        <td className="py-2.5 px-4 text-right font-serif text-lg text-ink-soft">{parseFloat(p.cantidad).toFixed(0)}</td>
                        <td className="py-2.5 px-4 text-right"><APrice value={p.monto} className="text-sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-card border border-rule rounded-[2px] overflow-hidden" style={{ boxShadow: 'var(--shadow-flat)' }}>
              <div className="px-4 py-3 border-b border-rule bg-paper-warm">
                <h2 className="font-serif text-lg text-ink">Horarios pico</h2>
                <p className="font-mono text-[10px] text-muted uppercase mt-0.5">Este mes</p>
              </div>
              {data.horarios_pico.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted text-center">Sin datos suficientes.</p>
              ) : (
                <ul>
                  {data.horarios_pico.map((h) => (
                    <li key={h.hora} className="flex items-center justify-between px-4 py-3 border-b border-rule-soft last:border-0">
                      <span className="font-mono text-sm text-ink">{String(h.hora).padStart(2, '0')}:00 – {String(h.hora).padStart(2, '0')}:59</span>
                      <div className="text-right">
                        <APrice value={h.total} className="text-sm" />
                        <p className="font-mono text-[10px] text-muted">{h.cantidad} venta{h.cantidad === 1 ? '' : 's'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-ink rounded-[2px] p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-paper/55 mb-1">Ganancia estimada del mes</p>
              <APrice value={data.kpis.ganancia_estimada_mes} className="text-3xl text-paper" />
              <p className="font-sans text-xs text-paper/50 mt-1">Precio de venta menos costo actual de productos</p>
            </div>
            <Link href="/caja">
              <ABtn variant="secondary" size="sm">Ver tesorería</ABtn>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-rule rounded-[2px] overflow-hidden" style={{ boxShadow: 'var(--shadow-flat)' }}>
            <div className="px-4 py-3 border-b border-rule bg-paper-warm flex justify-between items-center">
              <h2 className="font-serif text-lg text-ink">Alertas</h2>
              {alertasActivas > 0 && <APill tone="warn">{alertasActivas} activas</APill>}
            </div>
            {data.alertas.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted text-center">Todo en orden.</p>
            ) : (
              data.alertas.map((a, i) => (
                <div key={`${a.tipo}-${i}`} className="px-4 py-3 border-b border-rule-soft last:border-0 flex gap-3">
                  <div className={`w-7 h-7 rounded-[2px] shrink-0 ${ALERTA_BG[a.tono]}`} />
                  <div>
                    <p className="font-sans text-sm font-semibold text-ink">{a.titulo}</p>
                    <p className="font-mono text-[11px] text-muted mt-0.5">{a.descripcion}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-card border border-rule rounded-[2px] p-4" style={{ boxShadow: 'var(--shadow-flat)' }}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-3">Accesos rápidos</p>
            <div className="flex flex-col gap-2">
              <Link href="/ventas"><ABtn variant="primary" className="w-full">Abrir punto de venta</ABtn></Link>
              <Link href="/importar"><ABtn variant="secondary" className="w-full">Importar datos</ABtn></Link>
              <Link href="/contador"><ABtn variant="ghost" className="w-full">Vista contador</ABtn></Link>
            </div>
          </div>

          <div className="bg-card border border-rule rounded-[2px] overflow-hidden" style={{ boxShadow: 'var(--shadow-flat)' }}>
            <div className="px-4 py-3 border-b border-rule bg-paper-warm">
              <h2 className="font-serif text-base text-ink">Cuentas corrientes</h2>
            </div>
            {data.cuentas_corrientes.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted text-center">Sin saldos pendientes.</p>
            ) : (
              data.cuentas_corrientes.map((c) => (
                <Link key={c.id} href={`/clientes/${c.id}`} className="block px-4 py-3 border-b border-rule-soft last:border-0 hover:bg-paper-warm transition-colors">
                  <div className="flex justify-between items-baseline">
                    <span className="font-sans text-sm text-ink font-medium">{c.nombre}</span>
                    {esPositivo(c.saldo) ? (
                      <APrice value={c.saldo} className="text-sm text-neg" />
                    ) : (
                      <span className="font-mono text-sm text-muted">$0</span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
