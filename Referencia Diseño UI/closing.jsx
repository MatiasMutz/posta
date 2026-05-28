// closing.jsx — Alcance del POC y hoja de ruta de Posta

const ClosingRecommendation = () => {
  const A = {
    ink:        '#1a1612',
    inkSoft:    '#3a312a',
    muted:      '#7a6e62',
    rule:       '#d8cfc0',
    ruleSoft:   '#ece5d6',
    paper:      '#faf6ec',
    paperWarm:  '#f3ecdb',
    paperDeep:  '#ebe2cc',
    card:       '#ffffff',
    accent:     '#c9542e',
    accentSoft: '#f4d6c8',
    accentDeep: '#9a3e21',
    ok:         '#3e7d4a',
    okSoft:     '#dde8d2',
    warn:       '#b8862a',
    warnSoft:   '#f3e4be',
    serif:      '"Instrument Serif", "Source Serif Pro", Georgia, serif',
    sans:       '"Geist", -apple-system, system-ui, sans-serif',
    mono:       '"JetBrains Mono", ui-monospace, monospace',
    radius:     2,
  };

  const ModuleCard = ({ icon, title, status, bullets, statusTone }) => {
    const tones = {
      poc:  { bg: A.accentSoft,  fg: A.accentDeep, label: 'En este POC' },
      next: { bg: A.warnSoft,    fg: A.warn,        label: 'Próxima fase' },
      road: { bg: A.paperDeep,   fg: A.muted,       label: 'Hoja de ruta' },
    };
    const t = tones[statusTone] || tones.road;
    return (
      <div style={{
        background: A.card,
        border: `1px solid ${A.rule}`,
        borderRadius: A.radius,
        padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 10,
        flex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, background: statusTone === 'poc' ? A.accentSoft : A.paperDeep, borderRadius: A.radius, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <window.Icon name={icon} size={14} color={statusTone === 'poc' ? A.accentDeep : A.muted} stroke={1.7} />
            </div>
            <span style={{ fontFamily: A.sans, fontWeight: 600, fontSize: 14, color: A.ink }}>{title}</span>
          </div>
          <span style={{ padding: '3px 8px', borderRadius: A.radius, background: t.bg, color: t.fg, fontFamily: A.mono, fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{t.label}</span>
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ fontFamily: A.sans, fontSize: 12, color: A.inkSoft, lineHeight: 1.5 }}>{b}</li>
          ))}
        </ul>
      </div>
    );
  };

  const TechChip = ({ label }) => (
    <span style={{
      padding: '5px 10px', borderRadius: A.radius,
      background: A.paperDeep, color: A.inkSoft,
      fontFamily: A.mono, fontSize: 11, letterSpacing: 0.3,
    }}>{label}</span>
  );

  return (
    <div style={{
      width: 1380, height: 820, padding: '44px 56px',
      background: A.paper, color: A.ink,
      fontFamily: A.sans,
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 24, borderBottom: `1px solid ${A.rule}` }}>
        <div>
          <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>alcance del poc · mayo 2026</div>
          <h1 style={{
            margin: 0,
            fontFamily: A.serif, fontWeight: 400,
            fontSize: 60, lineHeight: 0.96, letterSpacing: -1.2,
            color: A.ink,
          }}>
            De la idea al negocio real.
          </h1>
        </div>
        <div style={{ maxWidth: 380, paddingBottom: 4 }}>
          <p style={{ margin: 0, fontFamily: A.sans, fontSize: 14, lineHeight: 1.6, color: A.muted }}>
            Este POC muestra el flujo de trabajo completo de una PyME argentina: ventas,
            stock, caja, migración de datos y cumplimiento fiscal. El diseño está listo para
            validar con usuarios reales y derivar hacia el producto.
          </p>
        </div>
      </div>

      {/* Módulos */}
      <div>
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>módulos del producto</div>
        <div style={{ display: 'flex', gap: 14 }}>
          <ModuleCard
            icon="report"
            title="Dashboard"
            statusTone="poc"
            bullets={[
              'KPIs en tiempo real: ventas, caja, cuentas por cobrar',
              'Alertas proactivas de stock y deudas vencidas',
              'Gráfico de ventas semanal + top sellers del día',
            ]}
          />
          <ModuleCard
            icon="pos"
            title="POS y Ventas"
            statusTone="poc"
            bullets={[
              'Venta a 3 clics con emisión de comprobante',
              'Búsqueda y escaneo de productos (F2)',
              'Selección de medio de pago · versión móvil incluida',
            ]}
          />
          <ModuleCard
            icon="box"
            title="Inventario"
            statusTone="poc"
            bullets={[
              'Tabla con KPIs: valor total, stock bajo, agotados',
              'Filtros por categoría y estado',
              'Importación masiva vía Excel/CSV',
            ]}
          />
          <ModuleCard
            icon="cash"
            title="Caja y Tesorería"
            statusTone="poc"
            bullets={[
              'Saldo en tiempo real por medio de pago',
              'Registro de ingresos y egresos del día',
              'Cuentas corrientes de clientes con deuda',
            ]}
          />
          <ModuleCard
            icon="upload"
            title="Migración de datos"
            statusTone="poc"
            bullets={[
              'Asistente de 4 pasos con drag & drop',
              'Mapeo automático de columnas con IA',
              'Detección y corrección inline de errores',
            ]}
          />
          <ModuleCard
            icon="file"
            title="Vista Contador AFIP"
            statusTone="poc"
            bullets={[
              'Perfil de acceso limitado para el contador',
              'Libro IVA Ventas con CAE en tiempo real',
              'Exportación CITI y libro IVA en Excel',
            ]}
          />
        </div>
      </div>

      {/* Próxima fase + Stack */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, flex: 1 }}>

        {/* Próximos módulos */}
        <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: '18px 20px' }}>
          <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
            próximos módulos · roadmap
          </div>
          {[
            { icon: 'pos',    label: 'Sincronización Mercado Libre · Shopify · Tiendanube' },
            { icon: 'user',   label: 'CRM de clientes · historial de compras' },
            { icon: 'report', label: 'Compras y proveedores · cuentas corrientes pasivas' },
            { icon: 'bank',   label: 'Integración bancaria · Mercado Pago' },
            { icon: 'sparkle',label: 'Asistente IA fiscal · Copiloto de migración' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 4 ? `1px solid ${A.ruleSoft}` : 'none' }}>
              <window.Icon name={m.icon} size={14} color={A.muted} stroke={1.6} />
              <span style={{ fontFamily: A.sans, fontSize: 12.5, color: A.inkSoft, lineHeight: 1.4 }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Stack técnico */}
        <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: '18px 20px' }}>
          <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>stack técnico propuesto</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { cat: 'Frontend',  stack: ['Next.js (React)', 'TypeScript', 'Tailwind CSS'] },
              { cat: 'Backend',   stack: ['Node.js / Python', 'REST + Webhooks', 'Bull (colas async)'] },
              { cat: 'Base de datos', stack: ['PostgreSQL', 'Row-Level Security', 'Multi-tenant'] },
              { cat: 'Integraciones', stack: ['AFIP WSFEV1', 'Mercado Libre API', 'Mercado Pago SDK'] },
              { cat: 'Excel / CSV', stack: ['SheetJS', 'ExcelJS', 'Pandas (migración)'] },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: A.mono, fontSize: 9, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>{s.cat}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {s.stack.map((t, j) => <TechChip key={j} label={t} />)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos pasos */}
        <div style={{ background: A.ink, borderRadius: A.radius, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: A.mono, fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' }}>próximos pasos</div>
          <div style={{ fontFamily: A.serif, fontSize: 28, lineHeight: 1.1, color: A.paper, letterSpacing: -0.3 }}>
            Validar con 3 negocios reales.
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {[
              { n: '1', t: 'Validación con usuarios', d: 'Kiosco, almacén y gastronómica. Prioridad: flujo del POS, wizard de importación y comprensión de KPIs.' },
              { n: '2', t: 'Definir arquitectura del producto', d: 'Stack, arquitectura multi-tenant, prioridad de módulos. Timeframe: 3-4 meses.' },
              { n: '3', t: 'Piloto con 2 PyMEs', d: 'Beta cerrada para medir retención, NPS y cobertura del workflow real antes de lanzar.' },
            ].map((s) => (
              <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: A.accent, color: '#fff', fontFamily: A.serif, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily: A.sans, fontWeight: 600, fontSize: 12, color: A.paper }}>{s.t}</div>
                  <div style={{ fontFamily: A.sans, fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, marginTop: 2 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontFamily: A.mono, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 }}>
              posta · concepto · mayo 2026
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

window.ClosingRecommendation = ClosingRecommendation;
