// direction-a-tokens.jsx — Dirección A · Editorial cálido / financiero amable.
// Tipografía: Instrument Serif (display, números) + Geist Sans (UI) + JetBrains Mono (datos).
// Paleta: papel envejecido + terracota como acento, espresso para texto. Cero azul.
// Quiebre de navegación: top bar tipográfica, módulos como secciones de un diario.

const A = {
  // Superficie
  ink:        '#1a1612',
  inkSoft:    '#3a312a',
  muted:      '#7a6e62',
  rule:       '#d8cfc0',
  ruleSoft:   '#ece5d6',
  paper:      '#faf6ec',
  paperWarm:  '#f3ecdb',
  paperDeep:  '#ebe2cc',
  card:       '#ffffff',

  // Acento
  accent:     '#c9542e',  // terracota
  accentSoft: '#f4d6c8',
  accentDeep: '#9a3e21',

  // Semánticos (todos calibrados a la paleta cálida; sin azul puro)
  ok:         '#3e7d4a',  // verde musgo
  okSoft:     '#dde8d2',
  warn:       '#b8862a',  // mostaza tostada
  warnSoft:   '#f3e4be',
  err:        '#a83a2a',  // bermellón
  errSoft:    '#f3d4ca',
  info:       '#5a5346',  // gris-marrón (la dirección no necesita azul)
  infoSoft:   '#e7e1d2',

  // Saldos
  pos:        '#3e7d4a',
  neg:        '#a83a2a',

  // Tipografía
  serif:      '"Instrument Serif", "Source Serif Pro", Georgia, serif',
  sans:       '"Geist", -apple-system, system-ui, sans-serif',
  mono:       '"JetBrains Mono", ui-monospace, monospace',

  // Tamaños
  radius:     2,
  shadow:     '0 1px 2px rgba(60,40,20,.08), 0 8px 24px -8px rgba(60,40,20,.12)',
  shadowFlat: '0 1px 0 rgba(60,40,20,.06)',
};
window.A_TOKENS = A;

// ─── ARS protagonista: entero grande en serif, decimales chicos en mono ───
const APrice = ({ value, size = 36, color = A.ink, negative = false, currencySize }) => {
  const { sign, int, dec } = window.ARSparts(value);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', color: negative ? A.neg : color, fontFamily: A.serif, lineHeight: 1 }}>
      <span style={{ fontSize: (currencySize || size * 0.55), color: A.muted, marginRight: 4, fontFamily: A.sans, fontWeight: 500 }}>$</span>
      <span style={{ fontSize: size, letterSpacing: -0.5 }}>{sign}{int}</span>
      <span style={{ fontSize: size * 0.42, color: A.muted, fontFamily: A.mono, marginLeft: 2 }}>,{dec}</span>
    </span>
  );
};
window.APrice = APrice;

// ─── Botones ───
const ABtn = ({ children, kind = 'primary', size = 'md', icon, full, style = {}, onClick }) => {
  const sizes = {
    sm: { h: 32, px: 12, fs: 13 },
    md: { h: 40, px: 16, fs: 14 },
    lg: { h: 52, px: 22, fs: 16 },
  };
  const s = sizes[size];
  const kinds = {
    primary:   { bg: A.accent,    fg: '#fff',    border: 'transparent' },
    secondary: { bg: A.card,      fg: A.ink,     border: A.rule },
    ghost:     { bg: 'transparent', fg: A.ink,   border: 'transparent' },
    ink:       { bg: A.ink,       fg: A.paper,   border: 'transparent' },
  };
  const k = kinds[kind];
  return (
    <button onClick={onClick} style={{
      height: s.h, padding: `0 ${s.px}px`,
      background: k.bg, color: k.fg,
      border: `1px solid ${k.border}`,
      borderRadius: A.radius,
      fontFamily: A.sans, fontWeight: 500, fontSize: s.fs,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      cursor: 'pointer', width: full ? '100%' : 'auto',
      letterSpacing: 0.1,
      ...style,
    }}>
      {icon && <window.Icon name={icon} size={s.fs + 2} stroke={1.7} />}
      {children}
    </button>
  );
};
window.ABtn = ABtn;

// ─── Pill / chip semántico ───
const APill = ({ children, tone = 'neutral', icon }) => {
  const tones = {
    neutral: { bg: A.paperDeep, fg: A.inkSoft },
    ok:      { bg: A.okSoft,    fg: A.ok },
    warn:    { bg: A.warnSoft,  fg: A.warn },
    err:     { bg: A.errSoft,   fg: A.err },
    accent:  { bg: A.accentSoft, fg: A.accentDeep },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 2,
      background: t.bg, color: t.fg,
      fontFamily: A.sans, fontSize: 11, fontWeight: 500,
      letterSpacing: 0.1, lineHeight: 1.6,
    }}>
      {icon && <window.Icon name={icon} size={11} stroke={2} />}
      {children}
    </span>
  );
};
window.APill = APill;

// ─── Input ───
const AInput = ({ label, placeholder, value, hint, error, icon, type = 'text', adornment, style = {} }) => (
  <label style={{ display: 'block', ...style }}>
    {label && (
      <div style={{ fontFamily: A.sans, fontSize: 12, color: A.muted, marginBottom: 6, letterSpacing: 0.2 }}>{label}</div>
    )}
    <div style={{
      display: 'flex', alignItems: 'center',
      height: 40, padding: '0 12px',
      background: A.card,
      border: `1px solid ${error ? A.err : A.rule}`,
      borderRadius: A.radius,
      gap: 8,
    }}>
      {icon && <window.Icon name={icon} size={16} color={A.muted} />}
      {adornment && <span style={{ fontFamily: A.serif, color: A.muted, fontSize: 18 }}>{adornment}</span>}
      <input type={type} defaultValue={value} placeholder={placeholder} style={{
        flex: 1, border: 'none', outline: 'none', background: 'transparent',
        fontFamily: A.sans, fontSize: 14, color: A.ink,
      }} />
    </div>
    {(hint || error) && (
      <div style={{ fontFamily: A.sans, fontSize: 11, color: error ? A.err : A.muted, marginTop: 4 }}>
        {error || hint}
      </div>
    )}
  </label>
);
window.AInput = AInput;

// ─── Top bar: el "masthead" de la dirección A — tipografía, dataline, módulos ───
const ATopBar = ({ active = 'POS', user = 'Carolina', sub = 'Almacén Don Julio' }) => {
  const modules = ['Dashboard', 'POS', 'Inventario', 'Caja', 'Clientes', 'Compras', 'Reportes'];
  return (
    <div style={{ background: A.paper, borderBottom: `1px solid ${A.rule}`, padding: '14px 28px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
          <span style={{ fontFamily: A.serif, fontSize: 30, lineHeight: 1, letterSpacing: -0.4, color: A.ink }}>
            Posta
          </span>
          <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', paddingBottom: 4 }}>
            sistema · {sub}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 4 }}>
          <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Sábado, 23 mayo · 14:32
          </span>
          <span style={{ height: 14, width: 1, background: A.rule }} />
          <span style={{ fontFamily: A.sans, fontSize: 13, color: A.ink, fontWeight: 500 }}>
            {user} <span style={{ color: A.muted, fontWeight: 400 }}> · dueña</span>
          </span>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: A.accentSoft, color: A.accentDeep, fontFamily: A.sans, fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user[0]}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 28, borderTop: `1px solid ${A.rule}`, paddingTop: 10 }}>
        {modules.map((m) => (
          <div key={m} style={{
            fontFamily: A.sans, fontSize: 14, fontWeight: m === active ? 600 : 400,
            color: m === active ? A.ink : A.muted,
            paddingBottom: 12, position: 'relative', cursor: 'pointer', letterSpacing: 0.1,
          }}>
            {m}
            {m === active && (
              <span style={{
                position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: A.accent,
              }} />
            )}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{
          fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase',
          paddingBottom: 12,
        }}>
          atajo: ⌘K · buscar todo
        </div>
      </div>
    </div>
  );
};
window.ATopBar = ATopBar;

// ─── Artboard: Identidad ───
window.A_Identity = () => (
  <div style={{ width: 1080, height: 760, background: A.paper, color: A.ink, fontFamily: A.sans, padding: '48px 56px', display: 'flex', flexDirection: 'column', gap: 28 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, paddingBottom: 16, borderBottom: `1px solid ${A.rule}` }}>
      <span style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, letterSpacing: 2, textTransform: 'uppercase' }}>A · editorial cálido</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, letterSpacing: 1, textTransform: 'uppercase' }}>tokens / fundamentos</span>
    </div>

    <h1 style={{ margin: 0, fontFamily: A.serif, fontWeight: 400, fontSize: 56, lineHeight: 0.98, letterSpacing: -1, color: A.ink, maxWidth: 760 }}>
      La pyme se lee como un diario: jerarquía clara, voz tipográfica, datos respetados.
    </h1>

    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 28, marginTop: 8 }}>
      {/* Paleta */}
      <div>
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Paleta</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            ['ink',     A.ink,     '#fff'],
            ['acento',  A.accent,  '#fff'],
            ['papel',   A.paper,   A.ink],
            ['papel+',  A.paperDeep, A.ink],
            ['ok',      A.ok,      '#fff'],
            ['warn',    A.warn,    '#fff'],
            ['err',     A.err,     '#fff'],
            ['regla',   A.rule,    A.ink],
          ].map(([n, c, fg]) => (
            <div key={n} style={{ background: c, color: fg, padding: '10px 8px', borderRadius: A.radius, border: c === A.paper || c === A.rule ? `1px solid ${A.rule}` : 'none', height: 64, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: A.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.85 }}>{n}</span>
              <span style={{ fontFamily: A.mono, fontSize: 9, opacity: 0.7 }}>{c}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: A.muted, lineHeight: 1.5 }}>
          <strong style={{ color: A.ink }}>Sin azul.</strong> El acento terracota carga la identidad; los semánticos viven en tonos terrosos. Saldos: <span style={{ color: A.pos }}>verde musgo (+)</span> · <span style={{ color: A.neg }}>bermellón (−)</span>.
        </div>
      </div>

      {/* Tipografía */}
      <div>
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Tipografía</div>
        <div style={{ background: A.card, padding: 16, borderRadius: A.radius, border: `1px solid ${A.rule}` }}>
          <div style={{ fontFamily: A.serif, fontSize: 36, lineHeight: 1, letterSpacing: -0.5 }}>
            Aa <span style={{ color: A.muted, fontStyle: 'italic' }}>1234</span>
          </div>
          <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, marginTop: 4 }}>Instrument Serif — display, montos protagonistas</div>
          <div style={{ height: 1, background: A.ruleSoft, margin: '14px 0' }} />
          <div style={{ fontFamily: A.sans, fontSize: 22, fontWeight: 500 }}>Aa 1234</div>
          <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, marginTop: 4 }}>Geist Sans — UI, etiquetas, párrafos</div>
          <div style={{ height: 1, background: A.ruleSoft, margin: '14px 0' }} />
          <div style={{ fontFamily: A.mono, fontSize: 14 }}>Aa 1234,56</div>
          <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, marginTop: 4 }}>JetBrains Mono — códigos, decimales, dataline</div>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: A.muted, lineHeight: 1.5 }}>
          El serif aparece <em>sólo</em> en titulares y en el entero de los montos. La UI sigue siendo Geist para no fatigar.
        </div>
      </div>

      {/* Quiebre + escala */}
      <div>
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Quiebre de navegación</div>
        <div style={{ background: A.card, padding: 16, borderRadius: A.radius, border: `1px solid ${A.rule}` }}>
          <div style={{ fontFamily: A.serif, fontSize: 22, color: A.ink, lineHeight: 1.1, marginBottom: 8 }}>
            Masthead tipográfico
          </div>
          <div style={{ fontSize: 12, color: A.inkSoft, lineHeight: 1.5 }}>
            Top bar fija que se lee como cabecera de diario: marca + dataline a la izquierda, fecha + usuario a la derecha, módulos como secciones del periódico. Sin íconos en la nav — sólo palabras. ⌘K como búsqueda universal.
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Densidad de tablas</div>
          <div style={{ background: A.card, padding: 12, borderRadius: A.radius, border: `1px solid ${A.rule}`, fontSize: 12, color: A.inkSoft, lineHeight: 1.5 }}>
            <strong style={{ color: A.ink }}>Cómoda.</strong> Filas de 48px, mucho aire vertical, reglas finas. Prioriza primera lectura.
          </div>
        </div>
      </div>
    </div>

    {/* Showcase numérico */}
    <div style={{ marginTop: 'auto', padding: '24px 28px', background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, display: 'flex', alignItems: 'center', gap: 40 }}>
      <div>
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Ventas hoy</div>
        <APrice value={84620} size={48} />
      </div>
      <div style={{ height: 56, width: 1, background: A.rule }} />
      <div>
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Saldo en caja</div>
        <APrice value={132840} size={32} color={A.pos} />
      </div>
      <div style={{ height: 56, width: 1, background: A.rule }} />
      <div>
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Por cobrar</div>
        <APrice value={-54800} size={32} negative />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontFamily: A.serif, fontStyle: 'italic', fontSize: 18, color: A.muted, maxWidth: 220, textAlign: 'right', lineHeight: 1.3 }}>
        “Los números son la noticia. La interfaz, su tipografía.”
      </div>
    </div>
  </div>
);

// ─── Artboard: Componentes ───
window.A_Components = () => (
  <div style={{ width: 1080, height: 900, background: A.paper, color: A.ink, fontFamily: A.sans, padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, paddingBottom: 14, borderBottom: `1px solid ${A.rule}` }}>
      <span style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, letterSpacing: 2, textTransform: 'uppercase' }}>A · componentes</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, letterSpacing: 1 }}>botones · inputs · chips · tabla · estados</span>
    </div>

    {/* Botones */}
    <div>
      <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Botones</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <ABtn kind="primary" size="lg" icon="check">Cobrar y emitir</ABtn>
        <ABtn kind="ink" icon="plus">Nuevo producto</ABtn>
        <ABtn kind="secondary" icon="upload">Importar Excel</ABtn>
        <ABtn kind="ghost" icon="settings">Ajustes</ABtn>
        <ABtn kind="primary" size="sm">Aplicar</ABtn>
        <span style={{ marginLeft: 12, fontFamily: A.mono, fontSize: 11, color: A.muted }}>· estados: hover oscurece +6%, focus añade halo terracota 2px, disabled 40% opacidad</span>
      </div>
    </div>

    {/* Inputs */}
    <div>
      <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Inputs</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <AInput label="Buscar producto" placeholder="Yerba, gaseosa…" icon="search" />
        <AInput label="Precio venta" value="3.450,00" adornment="$" hint="Sin IVA, se calcula en el comprobante" />
        <AInput label="SKU" value="YRB-001" icon="barcode" />
        <AInput label="Stock mínimo" value="-3" error="No puede ser negativo" icon="box" />
      </div>
    </div>

    {/* Chips / estados */}
    <div>
      <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Chips y estados semánticos</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <APill tone="ok" icon="check">Stock OK</APill>
        <APill tone="warn" icon="alert">Stock bajo · 8 unidades</APill>
        <APill tone="err" icon="x">Agotado</APill>
        <APill tone="accent">Promo del día</APill>
        <APill tone="neutral">Almacén</APill>
        <APill tone="ok">Saldo a favor</APill>
        <APill tone="err">Deuda 12 días</APill>
        <APill tone="warn">Pendiente AFIP</APill>
      </div>
    </div>

    {/* Card + tabla densa */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, flex: 1 }}>
      <div>
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Tarjeta de métrica</div>
        <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: '20px 22px' }}>
          <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Ventas, últimos 7 días</div>
          <APrice value={428340} size={44} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
            <span style={{ fontFamily: A.serif, fontSize: 18, color: A.pos }}>+18,4%</span>
            <span style={{ fontSize: 12, color: A.muted }}>vs semana anterior</span>
          </div>
          <svg viewBox="0 0 240 60" style={{ width: '100%', height: 50, marginTop: 14 }} preserveAspectRatio="none">
            <path d="M0 42 L30 36 L60 40 L90 28 L120 30 L150 20 L180 24 L210 14 L240 10" fill="none" stroke={A.accent} strokeWidth="1.5" />
            <circle cx="240" cy="10" r="3" fill={A.accent} />
          </svg>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Toast / Notificación</div>
          <div style={{ background: A.ink, color: A.paper, padding: '12px 16px', borderRadius: A.radius, display: 'flex', alignItems: 'center', gap: 12 }}>
            <window.Icon name="check" size={18} color={A.accent} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Venta #1284 emitida</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Comprobante enviado por WhatsApp</div>
            </div>
            <span style={{ fontFamily: A.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>deshacer</span>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Tabla de datos (densidad cómoda)</div>
        <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 90px 90px 110px', padding: '10px 16px', borderBottom: `1px solid ${A.rule}`, background: A.paperWarm }}>
            {['SKU', 'Producto', 'Stock', 'PVP', 'Estado'].map((h, i) => (
              <div key={i} style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: i >= 2 && i < 4 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
          {window.PRODUCTS.slice(0, 5).map((p, i) => (
            <div key={p.sku} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 90px 90px 110px', alignItems: 'center', padding: '14px 16px', borderBottom: i < 4 ? `1px solid ${A.ruleSoft}` : 'none' }}>
              <div style={{ fontFamily: A.mono, fontSize: 12, color: A.muted }}>{p.sku}</div>
              <div style={{ fontFamily: A.sans, fontSize: 13, color: A.ink }}>{p.name} <span style={{ color: A.muted }}>· {p.unit}</span></div>
              <div style={{ fontFamily: A.serif, fontSize: 18, color: A.ink, textAlign: 'right' }}>{p.stock}</div>
              <div style={{ fontFamily: A.serif, fontSize: 16, color: A.ink, textAlign: 'right' }}>{window.NumAR(p.price)}</div>
              <div>{p.stock === 0 ? <APill tone="err">Agotado</APill> : p.stock < p.min ? <APill tone="warn">Stock bajo</APill> : <APill tone="ok">OK</APill>}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Estados vacíos / carga / error */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      <div style={{ background: A.card, border: `1px dashed ${A.rule}`, borderRadius: A.radius, padding: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: A.serif, fontSize: 22, color: A.ink, marginBottom: 4 }}>Sin ventas aún</div>
        <div style={{ fontSize: 12, color: A.muted, marginBottom: 12 }}>Abrí caja para empezar el día.</div>
        <ABtn kind="ink" size="sm">Abrir caja</ABtn>
      </div>
      <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: 20 }}>
        <div style={{ height: 12, width: '60%', background: A.paperDeep, borderRadius: 2, marginBottom: 10 }} />
        <div style={{ height: 28, width: '80%', background: A.paperDeep, borderRadius: 2, marginBottom: 10 }} />
        <div style={{ height: 12, width: '40%', background: A.paperDeep, borderRadius: 2 }} />
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 14 }}>cargando…</div>
      </div>
      <div style={{ background: A.errSoft, border: `1px solid ${A.err}`, borderRadius: A.radius, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <window.Icon name="alert" size={20} color={A.err} />
        <div>
          <div style={{ fontFamily: A.serif, fontSize: 18, color: A.err, lineHeight: 1.1 }}>No se pudo conectar con AFIP</div>
          <div style={{ fontSize: 12, color: A.inkSoft, marginTop: 4 }}>Los comprobantes se guardan localmente y se sincronizan apenas vuelva la conexión. Podés seguir vendiendo.</div>
        </div>
      </div>
    </div>
  </div>
);
