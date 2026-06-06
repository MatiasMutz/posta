import { APrice } from '@/components/ui';
import { saludoDesdeEmail, saludoHorario, formatFechaLarga } from '@/lib/dashboard-utils';

export { saludoDesdeEmail, saludoHorario, formatFechaLarga };

interface PuntoGrafico {
  etiqueta: string;
  total: string;
  es_hoy?: boolean;
}

interface GraficoVentasProps {
  datos: PuntoGrafico[];
  className?: string;
}

export function GraficoVentas({ datos, className = '' }: GraficoVentasProps) {
  if (datos.length === 0) {
    return (
      <p className="font-sans text-sm text-muted py-8 text-center">
        Sin ventas en este período.
      </p>
    );
  }

  const vals = datos.map((d) => parseFloat(d.total) || 0);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const chartW = 520;
  const chartH = 72;

  const py = (v: number) => chartH - ((v - minV) / range) * (chartH - 8) - 4;
  const px = (i: number) => (datos.length <= 1 ? chartW / 2 : (i / (datos.length - 1)) * chartW);

  const linePath = vals
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(v).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${chartW},${chartH} L0,${chartH} Z`;

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH + 24}`}
      className={`w-full h-24 ${className}`}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Gráfico de ventas"
    >
      <defs>
        <linearGradient id="chart-fill-ventas" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chart-fill-ventas)" />
      <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinejoin="round" />
      {datos.map((d, i) => (
        <g key={d.etiqueta}>
          <circle
            cx={px(i)}
            cy={py(vals[i])}
            r={d.es_hoy ? 4 : 3}
            fill={d.es_hoy ? 'var(--color-accent)' : 'var(--color-paper)'}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          />
          <text
            x={px(i)}
            y={chartH + 18}
            textAnchor="middle"
            className="fill-muted font-mono text-[9px]"
            fontWeight={d.es_hoy ? 600 : 400}
            fill={d.es_hoy ? 'var(--color-accent)' : 'var(--color-muted)'}
          >
            {d.etiqueta}
          </text>
        </g>
      ))}
    </svg>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string | null;
  subTone?: 'ok' | 'warn' | 'neutral' | 'neg';
  valueClassName?: string;
}

export function KpiCard({ label, value, sub, subTone = 'neutral', valueClassName = '' }: KpiCardProps) {
  const subColors = {
    ok: 'text-pos',
    warn: 'text-warn',
    neg: 'text-neg',
    neutral: 'text-muted',
  };

  return (
    <div
      className="bg-card border border-rule rounded-[2px] p-4 md:p-5 flex-1 min-w-[140px]"
      style={{ boxShadow: 'var(--shadow-flat)' }}
    >
      <p className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">{label}</p>
      <APrice value={value} className={`text-2xl md:text-3xl ${valueClassName}`} />
      {sub && (
        <p className={`font-mono text-[11px] mt-1.5 ${subColors[subTone]}`}>{sub}</p>
      )}
    </div>
  );
}
