// intro.jsx — portada del producto Posta

const IntroOverview = () => {
  const A = {
    ink:        '#1a1612',
    inkSoft:    '#3a312a',
    muted:      '#7a6e62',
    rule:       '#d8cfc0',
    ruleSoft:   '#ece5d6',
    paper:      '#faf6ec',
    paperWarm:  '#f3ecdb',
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
  };

  const ValueProp = ({ icon, title, body }) => (
    <div style={{
      flex: 1,
      background: A.card,
      border: `1px solid ${A.rule}`,
      borderRadius: 2,
      padding: '24px 26px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
        <div style={{ width: 32, height: 32, background: A.accentSoft, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <window.Icon name={icon} size={16} color={A.accentDeep} stroke={1.7} />
        </div>
        <span style={{ fontFamily: A.sans, fontWeight: 600, fontSize: 14, color: A.ink }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontFamily: A.sans, fontSize: 13, color: A.muted, lineHeight: 1.6 }}>{body}</p>
    </div>
  );

  const ScreenChip = ({ label, icon }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px',
      background: A.paperWarm,
      border: `1px solid ${A.rule}`,
      borderRadius: 2,
    }}>
      <window.Icon name={icon} size={13} color={A.muted} stroke={1.6} />
      <span style={{ fontFamily: A.sans, fontSize: 12, color: A.inkSoft, fontWeight: 500 }}>{label}</span>
    </div>
  );

  return (
    <div style={{
      width: 1380, height: 720,
      background: A.paper,
      color: A.ink,
      fontFamily: A.sans,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar delgado */}
      <div style={{ background: A.ink, padding: '10px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: A.serif, fontSize: 20, color: A.paper, lineHeight: 1 }}>Posta</span>
          <span style={{ height: 12, width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontFamily: A.mono, fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            hub de gestión PyME · v0.1 POC · mayo 2026
          </span>
        </div>
        <span style={{ fontFamily: A.mono, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>
          para uso interno · no distribuir
        </span>
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, padding: '52px 56px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Hero */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 56, paddingBottom: 32, borderBottom: `1px solid ${A.rule}` }}>
          <div style={{ flex: '0 0 auto', maxWidth: 680 }}>
            <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
              SaaS multi-tenant · Argentina
            </div>
            <h1 style={{
              margin: 0,
              fontFamily: A.serif,
              fontWeight: 400,
              fontSize: 72,
              lineHeight: 0.96,
              letterSpacing: -1.5,
              color: A.ink,
            }}>
              Toda la gestión de tu PyME, en un solo lugar.
            </h1>
          </div>
          <div style={{ flex: 1, maxWidth: 420 }}>
            <p style={{ margin: 0, fontFamily: A.sans, fontSize: 15, lineHeight: 1.65, color: A.muted }}>
              Posta es el hub de gestión comercial y financiera para dueños de PyMEs argentinas.
              Reemplaza las planillas de Excel, integra AFIP, sincroniza Mercado Libre y Shopify,
              y muestra el estado del negocio a dos clics.
            </p>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase' }}>el norte del producto:</span>
              <span style={{ fontFamily: A.serif, fontStyle: 'italic', fontSize: 15, color: A.ink }}>
                complejidad oculta, UX excepcional.
              </span>
            </div>
          </div>
        </div>

        {/* Value props */}
        <div style={{ display: 'flex', gap: 16 }}>
          <ValueProp
            icon="upload"
            title="Zero-friction onboarding"
            body="Migrá tu Excel en minutos. El asistente lee tus columnas, las mapea automáticamente y te avisa fila por fila si algo no cuadra — sin técnicos, sin perder historial."
          />
          <ValueProp
            icon="report"
            title="AFIP integrado, sin fricción"
            body="Facturación electrónica A, B y C con CAE en tiempo real. El libro IVA se genera solo. El contador accede con su propio perfil y exporta lo que necesita."
          />
          <ValueProp
            icon="pos"
            title="POS + e-commerce sincronizados"
            body="Cada venta en Mercado Libre, Shopify o Tiendanube descuenta stock, emite factura y registra el cobro en tesorería — de forma automática, sin intervención manual."
          />
          <ValueProp
            icon="cash"
            title="Caja y flujo en tiempo real"
            body="Sabés en todo momento cuánto hay en caja, qué se cobró por cada medio de pago y quiénes te deben. Cuentas corrientes de clientes y proveedores en un panel."
          />
        </div>

        {/* Pantallas incluidas en este POC */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            pantallas en este POC →
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ScreenChip label="Dashboard" icon="report" />
            <ScreenChip label="POS desktop" icon="pos" />
            <ScreenChip label="POS móvil" icon="pos" />
            <ScreenChip label="Inventario" icon="box" />
            <ScreenChip label="Caja y Tesorería" icon="cash" />
            <ScreenChip label="Migración Excel" icon="upload" />
            <ScreenChip label="Vista Contador AFIP" icon="file" />
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            ↓ scroll · pinch zoom · click expand
          </span>
        </div>
      </div>
    </div>
  );
};

window.IntroOverview = IntroOverview;
