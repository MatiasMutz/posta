// direction-a-screens.jsx — Pantallas del producto Posta · Dirección A.

(() => {
  const A = window.A_TOKENS;
  const { ATopBar, ABtn, APill, APrice, AInput, Icon } = window;

  // ─────────────────────────────────────────────────────────────
  // Dashboard principal
  // ─────────────────────────────────────────────────────────────
  window.A_Dashboard = () => {
    // Ventas últimos 7 días (sáb 17 → sáb 23 mayo)
    const weekData = [
      { day: 'Sáb 17', val: 54200 },
      { day: 'Dom 18', val: 41800 },
      { day: 'Lun 19', val: 97800 },
      { day: 'Mar 20', val: 88100 },
      { day: 'Mié 21', val: 112400 },
      { day: 'Jue 22', val: 104600 },
      { day: 'Sáb 23', val: 84620, today: true },
    ];
    const vals = weekData.map((d) => d.val);
    const minV = Math.min(...vals), maxV = Math.max(...vals);
    const chartW = 520, chartH = 72;
    const py = (v) => chartH - ((v - minV) / (maxV - minV)) * (chartH - 8) - 4;
    const px = (i) => (i / (vals.length - 1)) * chartW;
    const linePath = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
    const areaPath = linePath + ` L${chartW},${chartH} L0,${chartH} Z`;

    const topSellers = [
      { name: 'Yerba Rosamonte Suave',        qty: 18, amount: 62100 },
      { name: 'Galletitas Oreo Originales',    qty: 24, amount: 21360 },
      { name: 'Queso Cremoso La Serenísima',   qty: 14, amount: 58800 },
      { name: 'Dulce de Leche La Salamandra',  qty: 12, amount: 43800 },
    ];

    const alerts = [
      { tone: 'warn', icon: 'box',  title: 'Stock bajo',      desc: 'CAF-009 · Café Cabrales · 4 u. (mínimo 12)' },
      { tone: 'err',  icon: 'user', title: 'Deuda vencida',   desc: 'Almacén La Esquina · 12 días · $ 42.500' },
      { tone: 'ok',   icon: 'cash', title: 'Caja abierta',    desc: 'Turno tarde · Caja 1 desde las 12:10' },
    ];

    const KPI = ({ label, value, sub, tone, subTone }) => (
      <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: '18px 20px', flex: 1 }}>
        <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
        <APrice value={value} size={30} currencySize={14} color={tone === 'pos' ? A.ok : tone === 'neg' ? A.err : A.ink} />
        {sub && (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            {subTone === 'ok' && <Icon name="arrow" size={12} color={A.ok} style={{ transform: 'rotate(-45deg)' }} />}
            <span style={{ fontFamily: A.mono, fontSize: 11, color: subTone === 'ok' ? A.ok : subTone === 'warn' ? A.warn : A.muted }}>{sub}</span>
          </div>
        )}
      </div>
    );

    return (
      <div style={{ width: 1280, height: 800, background: A.paper, color: A.ink, fontFamily: A.sans, display: 'flex', flexDirection: 'column' }}>
        <ATopBar active="Dashboard" />
        <div style={{ flex: 1, padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>

          {/* Saludo */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: A.serif, fontSize: 36, fontWeight: 400, letterSpacing: -0.5, color: A.ink }}>
                Buenos días, Carolina.
              </h2>
              <div style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, letterSpacing: 0.5, marginTop: 4, textTransform: 'uppercase' }}>
                Sábado 23 de mayo · Almacén Don Julio · 3 alertas activas
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <ABtn kind="ink" size="sm" icon="pos">Ir al POS</ABtn>
              <ABtn kind="secondary" size="sm" icon="bell">3 alertas</ABtn>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'flex', gap: 14 }}>
            <KPI label="Ventas hoy" value={84620} sub="+12,4% vs ayer" subTone="ok" />
            <KPI label="Facturación mayo" value={1234580} sub="$ 53.677 / día promedio" subTone="neutral" />
            <KPI label="Saldo en caja" value={132840} sub="3 movimientos hoy" />
            <KPI label="Cuentas a cobrar" value={54800} sub="2 deudas vencidas" subTone="warn" tone="neg" />
          </div>

          {/* Cuerpo principal */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, overflow: 'hidden' }}>

            {/* Izquierda: gráfico + top sellers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
              {/* Gráfico de ventas */}
              <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontFamily: A.serif, fontSize: 20, color: A.ink }}>Ventas · últimos 7 días</span>
                  <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase' }}>sáb 17 → sáb 23</span>
                </div>
                <svg width={chartW} height={chartH + 24} viewBox={`0 0 ${chartW} ${chartH + 24}`} style={{ width: '100%', height: 96 }} preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={A.accent} stopOpacity="0.14" />
                      <stop offset="100%" stopColor={A.accent} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#chart-fill)" />
                  <path d={linePath} fill="none" stroke={A.accent} strokeWidth="1.8" strokeLinejoin="round" />
                  {weekData.map((d, i) => (
                    <g key={i}>
                      <circle cx={px(i)} cy={py(d.val)} r={d.today ? 4 : 3} fill={d.today ? A.accent : A.paper} stroke={A.accent} strokeWidth="1.5" />
                      <text x={px(i)} y={chartH + 18} textAnchor="middle" fontFamily={A.mono} fontSize="9" fill={d.today ? A.accent : A.muted} letterSpacing="0.5" fontWeight={d.today ? '600' : '400'}>
                        {d.day}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Top sellers */}
              <div style={{ flex: 1, background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${A.rule}`, background: A.paperWarm, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: A.serif, fontSize: 18, color: A.ink }}>Más vendidos hoy</span>
                  <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase' }}>por monto</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 60px 130px', padding: '10px 18px', borderBottom: `1px solid ${A.rule}` }}>
                  {['#', 'Producto', 'Unid.', 'Monto'].map((h, i) => (
                    <div key={i} style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</div>
                  ))}
                </div>
                {topSellers.map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 60px 130px', padding: '13px 18px', borderBottom: i < topSellers.length - 1 ? `1px solid ${A.ruleSoft}` : 'none', alignItems: 'center' }}>
                    <div style={{ fontFamily: A.serif, fontSize: 18, color: A.muted }}>{i + 1}</div>
                    <div style={{ fontFamily: A.sans, fontSize: 13, color: A.ink, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontFamily: A.serif, fontSize: 18, color: A.inkSoft, textAlign: 'right' }}>{p.qty}</div>
                    <div style={{ textAlign: 'right' }}>
                      <APrice value={p.amount} size={18} currencySize={11} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Derecha: alertas + acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>

              {/* Alertas */}
              <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${A.rule}`, background: A.paperWarm, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: A.serif, fontSize: 18, color: A.ink }}>Alertas</span>
                  <APill tone="warn">3 activas</APill>
                </div>
                {alerts.map((al, i) => (
                  <div key={i} style={{ padding: '14px 18px', borderBottom: i < alerts.length - 1 ? `1px solid ${A.ruleSoft}` : 'none', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 2, flexShrink: 0,
                      background: al.tone === 'ok' ? A.okSoft : al.tone === 'warn' ? A.warnSoft : A.errSoft,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={al.icon} size={14} color={al.tone === 'ok' ? A.ok : al.tone === 'warn' ? A.warn : A.err} />
                    </div>
                    <div>
                      <div style={{ fontFamily: A.sans, fontSize: 13, color: A.ink, fontWeight: 600 }}>{al.title}</div>
                      <div style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, marginTop: 2 }}>{al.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Accesos rápidos */}
              <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: 18 }}>
                <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Accesos rápidos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <ABtn kind="primary" full icon="pos">Abrir punto de venta</ABtn>
                  <ABtn kind="secondary" full icon="upload">Importar datos (Excel)</ABtn>
                  <ABtn kind="ghost" full icon="report">Ver libro IVA</ABtn>
                </div>
              </div>

              {/* Cuentas corrientes mini */}
              <div style={{ flex: 1, background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${A.rule}`, background: A.paperWarm }}>
                  <span style={{ fontFamily: A.serif, fontSize: 18, color: A.ink }}>Cuentas corrientes</span>
                  <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' }}>Clientes con saldo</div>
                </div>
                {window.CUSTOMERS_BALANCE.slice(0, 3).map((c, i) => (
                  <div key={i} style={{ padding: '12px 18px', borderBottom: i < 2 ? `1px solid ${A.ruleSoft}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: A.sans, fontSize: 13, color: A.ink, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 0.5, marginTop: 2 }}>{c.since}</div>
                    </div>
                    <APrice value={Math.abs(c.balance)} size={15} currencySize={10} color={c.balance < 0 ? A.err : c.balance > 0 ? A.ok : A.muted} negative={c.balance < 0} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // POS Desktop
  // ─────────────────────────────────────────────────────────────
  window.A_POS_Desktop = () => {
    const cart = window.CART_SAMPLE;
    const total = window.CART_TOTAL;
    const cats = ['Todos', 'Almacén', 'Bebidas', 'Panificados', 'Lácteos', 'Limpieza'];
    return (
      <div style={{ width: 1280, height: 800, background: A.paper, color: A.ink, fontFamily: A.sans, display: 'flex', flexDirection: 'column' }}>
        <ATopBar active="POS" />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 440px', overflow: 'hidden' }}>
          {/* Izquierda: catálogo */}
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <h2 style={{ margin: 0, fontFamily: A.serif, fontSize: 32, lineHeight: 1, color: A.ink, fontWeight: 400 }}>Venta en curso</h2>
              <span style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>turno tarde · caja 1</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: A.card, border: `1px solid ${A.accent}`, borderRadius: A.radius, padding: '0 14px', height: 44, boxShadow: `0 0 0 3px ${A.accentSoft}` }}>
                <Icon name="search" size={18} color={A.accent} />
                <input placeholder="Buscar o escanear código (F2)" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: A.sans, fontSize: 15, color: A.ink }} />
                <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 6px', border: `1px solid ${A.rule}`, borderRadius: 2 }}>F2</span>
              </div>
              <ABtn kind="secondary" icon="barcode">Escanear</ABtn>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {cats.map((c, i) => (
                <span key={c} style={{
                  padding: '6px 12px', borderRadius: A.radius, fontSize: 12, fontWeight: i === 0 ? 600 : 400,
                  background: i === 0 ? A.ink : 'transparent', color: i === 0 ? A.paper : A.muted, cursor: 'pointer',
                  border: i === 0 ? 'none' : `1px solid ${A.rule}`,
                }}>{c}</span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, overflow: 'auto' }}>
              {window.PRODUCTS.map((p) => (
                <div key={p.sku} style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
                  <window.Placeholder label={p.sku.toLowerCase()} height={64} stripe="rgba(201,84,46,0.08)" bg={A.paperWarm} fg={A.muted} border={A.ruleSoft} radius={A.radius} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: A.ink, lineHeight: 1.25, height: 30, overflow: 'hidden' }}>{p.name}</div>
                    <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, marginTop: 2 }}>{p.unit}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <APrice value={p.price} size={20} currencySize={12} />
                    {p.stock < p.min && p.stock > 0 && <APill tone="warn">{p.stock} u.</APill>}
                    {p.stock === 0 && <APill tone="err">sin stock</APill>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Derecha: carrito */}
          <div style={{ background: A.paperWarm, borderLeft: `1px solid ${A.rule}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 28px 14px', borderBottom: `1px solid ${A.rule}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Venta · #1285</div>
                <h3 style={{ margin: 0, fontFamily: A.serif, fontSize: 24, color: A.ink, fontWeight: 400 }}>{cart.length} productos</h3>
              </div>
              <ABtn kind="ghost" size="sm" icon="trash">Vaciar</ABtn>
            </div>
            <div style={{ flex: 1, padding: '8px 28px', overflow: 'auto' }}>
              {cart.map((it) => (
                <div key={it.sku} style={{ padding: '14px 0', borderBottom: `1px solid ${A.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: A.ink, fontWeight: 500 }}>{it.name}</div>
                    <div style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, marginTop: 2 }}>{window.NumAR(it.unitPrice)} c/u</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button style={{ width: 26, height: 26, border: `1px solid ${A.rule}`, background: A.card, borderRadius: 2, color: A.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={12} /></button>
                    <span style={{ fontFamily: A.serif, fontSize: 22, minWidth: 24, textAlign: 'center', color: A.ink }}>{it.qty}</span>
                    <button style={{ width: 26, height: 26, border: `1px solid ${A.rule}`, background: A.card, borderRadius: 2, color: A.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={12} /></button>
                  </div>
                  <div style={{ width: 90, textAlign: 'right' }}>
                    <APrice value={it.qty * it.unitPrice} size={18} currencySize={11} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '20px 28px', borderTop: `1px solid ${A.rule}`, background: A.paper }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, color: A.muted, marginBottom: 6 }}>
                <span>Subtotal</span><span style={{ fontFamily: A.mono }}>{window.ARS(total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, color: A.muted, marginBottom: 14 }}>
                <span>Descuento</span><span style={{ fontFamily: A.mono }}>— $ 0</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 16, borderBottom: `1px solid ${A.rule}`, marginBottom: 16 }}>
                <span style={{ fontFamily: A.serif, fontSize: 22, color: A.ink }}>Total</span>
                <APrice value={total} size={48} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                {[['Efectivo', 'cash', true], ['Tarjeta', 'card', false], ['Transfer.', 'bank', false]].map(([l, ic, on]) => (
                  <div key={l} style={{ padding: '12px 8px', textAlign: 'center', background: on ? A.ink : A.card, color: on ? A.paper : A.ink, border: `1px solid ${on ? A.ink : A.rule}`, borderRadius: A.radius, cursor: 'pointer' }}>
                    <Icon name={ic} size={18} color={on ? A.accent : A.muted} />
                    <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
              <ABtn kind="primary" size="lg" full icon="check">Cobrar y emitir comprobante</ABtn>
              <div style={{ marginTop: 10, fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                Enter para cobrar · F4 cambia método · F8 anula
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // POS Mobile (375 wide marco; el ancho del artboard es 420 para que entre cómodo en grid)
  // ─────────────────────────────────────────────────────────────
  window.A_POS_Mobile = () => {
    const cart = window.CART_SAMPLE.slice(0, 2);
    const total = cart.reduce((a, i) => a + i.qty * i.unitPrice, 0);
    return (
      <div style={{ width: 420, height: 800, background: A.paperWarm, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 372, height: 752, background: A.paper, color: A.ink, fontFamily: A.sans, borderRadius: 28, overflow: 'hidden', boxShadow: '0 20px 50px rgba(60,40,20,0.25), 0 0 0 8px #1a1612', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* status bar */}
          <div style={{ height: 36, padding: '12px 28px 0', display: 'flex', justifyContent: 'space-between', fontFamily: A.sans, fontSize: 13, fontWeight: 600, color: A.ink }}>
            <span>14:32</span>
            <span>● ● ●</span>
          </div>
          {/* header */}
          <div style={{ padding: '8px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${A.rule}` }}>
            <div>
              <div style={{ fontFamily: A.serif, fontSize: 22, lineHeight: 1, color: A.ink }}>Posta</div>
              <div style={{ fontFamily: A.mono, fontSize: 9, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>caja · venta #1285</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: A.accentSoft, color: A.accentDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: A.sans, fontWeight: 600 }}>C</div>
          </div>

          {/* search */}
          <div style={{ padding: '14px 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: '0 12px', height: 44 }}>
              <Icon name="search" size={18} color={A.muted} />
              <input placeholder="Buscar producto" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }} />
              <Icon name="barcode" size={20} color={A.accent} />
            </div>
          </div>

          {/* carrito */}
          <div style={{ flex: 1, padding: '8px 16px', overflow: 'auto' }}>
            {cart.map((it) => (
              <div key={it.sku} style={{ padding: '12px 0', borderBottom: `1px solid ${A.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: A.ink, fontWeight: 500 }}>{it.name}</div>
                  <div style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, marginTop: 2 }}>{window.NumAR(it.unitPrice)} × {it.qty}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button style={{ width: 30, height: 30, border: `1px solid ${A.rule}`, background: A.card, borderRadius: 2 }}><Icon name="minus" size={12} /></button>
                  <span style={{ fontFamily: A.serif, fontSize: 22, minWidth: 22, textAlign: 'center' }}>{it.qty}</span>
                  <button style={{ width: 30, height: 30, border: `1px solid ${A.rule}`, background: A.card, borderRadius: 2 }}><Icon name="plus" size={12} /></button>
                </div>
              </div>
            ))}
            <div style={{ padding: '16px 0', textAlign: 'center', fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
              + agregar otro producto
            </div>
          </div>

          {/* footer total */}
          <div style={{ background: A.ink, color: A.paper, padding: '18px 20px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <span style={{ fontFamily: A.mono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Total a cobrar</span>
              <APrice value={total} size={36} color={A.paper} currencySize={14} />
            </div>
            <button style={{ width: '100%', height: 56, background: A.accent, color: '#fff', border: 'none', borderRadius: 2, fontFamily: A.sans, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Icon name="check" size={20} color="#fff" /> Cobrar y emitir
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Inventario
  // ─────────────────────────────────────────────────────────────
  window.A_Inventory = () => {
    const all = window.PRODUCTS;
    return (
      <div style={{ width: 1280, height: 800, background: A.paper, color: A.ink, fontFamily: A.sans, display: 'flex', flexDirection: 'column' }}>
        <ATopBar active="Inventario" />
        <div style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: A.serif, fontSize: 40, fontWeight: 400, color: A.ink, letterSpacing: -0.5 }}>Inventario</h2>
              <div style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>147 productos · 3 con stock bajo · 1 agotado</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <ABtn kind="secondary" icon="upload">Importar Excel</ABtn>
              <ABtn kind="ghost" icon="report">Exportar</ABtn>
              <ABtn kind="primary" icon="plus">Nuevo producto</ABtn>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Valor total stock', value: 8420540, tone: 'ink' },
              { label: 'Productos activos', value: 147, fmt: 'num' },
              { label: 'Stock bajo', value: 3, fmt: 'num', tone: 'warn' },
              { label: 'Agotados', value: 1, fmt: 'num', tone: 'err' },
            ].map((k, i) => (
              <div key={i} style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: '16px 18px' }}>
                <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div>
                {k.fmt === 'num' ? (
                  <div style={{ fontFamily: A.serif, fontSize: 38, lineHeight: 1, color: k.tone === 'err' ? A.err : k.tone === 'warn' ? A.warn : A.ink }}>{k.value}</div>
                ) : (
                  <APrice value={k.value} size={28} />
                )}
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: '0 12px', height: 38 }}>
              <Icon name="search" size={16} color={A.muted} />
              <input placeholder="Buscar por nombre, SKU o categoría…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: A.sans, fontSize: 13 }} />
            </div>
            <ABtn kind="secondary" size="sm" icon="chevdown">Categoría · todas</ABtn>
            <ABtn kind="secondary" size="sm" icon="chevdown">Estado · todos</ABtn>
            <ABtn kind="secondary" size="sm" icon="settings">Columnas</ABtn>
          </div>

          {/* Tabla */}
          <div style={{ flex: 1, background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 110px 1fr 110px 110px 120px 120px 140px', padding: '12px 16px', borderBottom: `1px solid ${A.rule}`, background: A.paperWarm, alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, border: `1px solid ${A.rule}`, borderRadius: 2 }} />
              {['SKU', 'Producto', 'Categoría', 'Stock', 'Costo', 'Precio venta', 'Estado'].map((h, i) => (
                <div key={i} style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: i >= 3 && i <= 5 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>
            {all.map((p, idx) => (
              <div key={p.sku} style={{ display: 'grid', gridTemplateColumns: '40px 110px 1fr 110px 110px 120px 120px 140px', padding: '14px 16px', borderBottom: idx < all.length - 1 ? `1px solid ${A.ruleSoft}` : 'none', alignItems: 'center', gap: 8, background: idx === 1 ? A.paperWarm : 'transparent' }}>
                <div style={{ width: 14, height: 14, border: `1px solid ${A.rule}`, borderRadius: 2, background: idx === 1 ? A.accent : 'transparent', position: 'relative' }}>
                  {idx === 1 && <span style={{ position: 'absolute', inset: 0, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
                </div>
                <div style={{ fontFamily: A.mono, fontSize: 12, color: A.muted }}>{p.sku}</div>
                <div>
                  <div style={{ fontSize: 13, color: A.ink, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: A.muted, marginTop: 2 }}>{p.unit}</div>
                </div>
                <div style={{ fontSize: 12, color: A.inkSoft }}>{p.cat}</div>
                <div style={{ fontFamily: A.serif, fontSize: 20, color: A.ink, textAlign: 'right' }}>{p.stock}</div>
                <div style={{ fontFamily: A.mono, fontSize: 13, color: A.muted, textAlign: 'right' }}>{window.NumAR(p.cost)}</div>
                <div style={{ textAlign: 'right' }}>
                  <APrice value={p.price} size={18} currencySize={11} />
                </div>
                <div>{p.stock === 0 ? <APill tone="err" icon="x">Agotado</APill> : p.stock < p.min ? <APill tone="warn" icon="alert">Bajo</APill> : <APill tone="ok" icon="check">OK</APill>}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Caja / Tesorería
  // ─────────────────────────────────────────────────────────────
  window.A_Cash = () => {
    const opening = 50000;
    const ventas = window.CASH_MOVEMENTS.filter(m => m.kind === 'venta').reduce((a, b) => a + b.amount, 0);
    const egresos = window.CASH_MOVEMENTS.filter(m => m.amount < 0).reduce((a, b) => a + b.amount, 0);
    const saldo = opening + ventas + egresos;
    return (
      <div style={{ width: 1280, height: 800, background: A.paper, color: A.ink, fontFamily: A.sans, display: 'flex', flexDirection: 'column' }}>
        <ATopBar active="Caja" />
        <div style={{ flex: 1, padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, overflow: 'hidden' }}>
          {/* Col 1: vista de caja */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: A.serif, fontSize: 40, fontWeight: 400, color: A.ink, letterSpacing: -0.5 }}>Caja del día</h2>
                <div style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>Viernes 23 de mayo · turno tarde · abierta 12:10</div>
              </div>
              <ABtn kind="ink" icon="minus">Cerrar caja</ABtn>
            </div>

            {/* Saldo */}
            <div style={{ background: A.ink, color: A.paper, padding: '28px 32px', borderRadius: A.radius, display: 'flex', alignItems: 'center', gap: 40 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: A.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Saldo actual en caja</div>
                <APrice value={saldo} size={72} color={A.paper} currencySize={22} />
              </div>
              <div style={{ height: 80, width: 1, background: 'rgba(255,255,255,0.15)' }} />
              <div style={{ display: 'grid', gap: 14, fontFamily: A.sans }}>
                <div>
                  <div style={{ fontFamily: A.mono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Apertura</div>
                  <div style={{ fontFamily: A.mono, fontSize: 16, color: A.paper }}>{window.ARS(opening)}</div>
                </div>
                <div>
                  <div style={{ fontFamily: A.mono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Ventas</div>
                  <div style={{ fontFamily: A.mono, fontSize: 16, color: '#9dd3a8' }}>+{window.ARS(ventas)}</div>
                </div>
                <div>
                  <div style={{ fontFamily: A.mono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Egresos</div>
                  <div style={{ fontFamily: A.mono, fontSize: 16, color: '#e9a89c' }}>{window.ARS(egresos)}</div>
                </div>
              </div>
            </div>

            {/* Métodos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Efectivo', val: 41280, ic: 'cash' },
                { label: 'Tarjeta', val: 12450, ic: 'card' },
                { label: 'Transferencia', val: 5640, ic: 'bank' },
              ].map((m) => (
                <div key={m.label} style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>{m.label}</span>
                    <Icon name={m.ic} size={16} color={A.muted} />
                  </div>
                  <APrice value={m.val} size={26} />
                </div>
              ))}
            </div>

            {/* Movimientos */}
            <div style={{ flex: 1, background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${A.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: A.paperWarm }}>
                <span style={{ fontFamily: A.serif, fontSize: 20, color: A.ink }}>Movimientos del día</span>
                <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1, textTransform: 'uppercase' }}>{window.CASH_MOVEMENTS.length} registros</span>
              </div>
              {window.CASH_MOVEMENTS.map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 90px 140px', padding: '14px 20px', borderBottom: i < window.CASH_MOVEMENTS.length - 1 ? `1px solid ${A.ruleSoft}` : 'none', alignItems: 'center' }}>
                  <span style={{ fontFamily: A.mono, fontSize: 12, color: A.muted }}>{m.time}</span>
                  <span style={{ fontSize: 13, color: A.ink }}>{m.label}</span>
                  <APill tone={m.kind === 'venta' ? 'ok' : m.kind === 'egreso' ? 'err' : 'accent'}>{m.kind}</APill>
                  <div style={{ textAlign: 'right' }}>
                    <APrice value={m.amount} size={18} currencySize={11} negative={m.amount < 0} color={m.amount > 0 ? A.pos : A.ink} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 2: acciones + clientes con saldo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden' }}>
            <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: 20 }}>
              <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Acciones rápidas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ABtn kind="primary" full icon="plus">Registrar ingreso</ABtn>
                <ABtn kind="secondary" full icon="minus">Registrar egreso</ABtn>
                <ABtn kind="ghost" full icon="report">Arqueo y resumen</ABtn>
              </div>
            </div>

            <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${A.rule}`, background: A.paperWarm }}>
                <div style={{ fontFamily: A.serif, fontSize: 18, color: A.ink }}>Cuentas corrientes</div>
                <div style={{ fontSize: 11, color: A.muted, marginTop: 2 }}>3 clientes con saldo pendiente</div>
              </div>
              {window.CUSTOMERS_BALANCE.map((c, i) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: i < 3 ? `1px solid ${A.ruleSoft}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, color: A.ink, fontWeight: 500 }}>{c.name}</span>
                    <APrice value={c.balance} size={16} currencySize={10} color={c.balance < 0 ? A.neg : c.balance > 0 ? A.pos : A.muted} />
                  </div>
                  <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 0.5, marginTop: 4, textTransform: 'uppercase' }}>{c.since}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Asistente de importación Excel/CSV
  // ─────────────────────────────────────────────────────────────
  window.A_Import = () => {
    const step = 2;
    return (
      <div style={{ width: 1280, height: 800, background: A.paper, color: A.ink, fontFamily: A.sans, display: 'flex', flexDirection: 'column' }}>
        <ATopBar active="Inventario" />
        <div style={{ flex: 1, padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden' }}>
          <div>
            <div style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              Inventario / Importar
            </div>
            <h2 style={{ margin: 0, fontFamily: A.serif, fontSize: 40, fontWeight: 400, letterSpacing: -0.5 }}>
              Traemos tu inventario desde Excel.
            </h2>
            <div style={{ fontSize: 14, color: A.muted, marginTop: 6, maxWidth: 760 }}>
              No vas a perder nada. Hacemos una copia de seguridad antes de importar y, si algo sale mal, podés revertir en un click.
            </div>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '14px 0', borderTop: `1px solid ${A.rule}`, borderBottom: `1px solid ${A.rule}` }}>
            {window.IMPORT_STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: s.id < step ? A.ok : s.id === step ? A.accent : A.paperDeep,
                    color: s.id <= step ? '#fff' : A.muted,
                    fontFamily: A.serif, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.id < step ? '✓' : s.id}
                  </div>
                  <div>
                    <div style={{ fontFamily: A.mono, fontSize: 9, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>Paso {s.id}</div>
                    <div style={{ fontFamily: A.sans, fontSize: 14, fontWeight: s.id === step ? 600 : 400, color: s.id <= step ? A.ink : A.muted }}>{s.name}</div>
                  </div>
                </div>
                {i < window.IMPORT_STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: A.rule, margin: '0 24px' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 2: Mapeo */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: A.serif, fontSize: 24, color: A.ink }}>Mapeá las columnas de tu archivo</div>
                  <div style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>Detectamos <strong style={{ color: A.ok }}>6 columnas automáticamente</strong>, sugerimos 1 y dejamos 1 sin asignar para que decidas.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: A.paperWarm, padding: '8px 14px', borderRadius: A.radius, border: `1px solid ${A.rule}` }}>
                  <Icon name="excel" size={16} color={A.ok} />
                  <span style={{ fontFamily: A.mono, fontSize: 11 }}>inventario-don-julio.xlsx</span>
                  <span style={{ fontFamily: A.mono, fontSize: 10, color: A.muted }}>· 148 filas</span>
                </div>
              </div>

              <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, overflow: 'hidden', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1.1fr 110px', padding: '10px 16px', borderBottom: `1px solid ${A.rule}`, background: A.paperWarm }}>
                  {['Tu archivo', 'Ejemplo', 'Campo en Posta', ''].map((h, i) => (
                    <div key={i} style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: 'uppercase' }}>{h}</div>
                  ))}
                </div>
                {window.IMPORT_COLUMNS.map((c, i) => {
                  const tone = c.confidence === 'auto' ? A.ok : c.confidence === 'sugerido' ? A.warn : c.confidence === 'ignorar' ? A.muted : A.err;
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1.1fr 110px', padding: '12px 16px', borderBottom: i < window.IMPORT_COLUMNS.length - 1 ? `1px solid ${A.ruleSoft}` : 'none', alignItems: 'center' }}>
                      <div style={{ fontFamily: A.mono, fontSize: 13, color: A.ink }}>{c.raw}</div>
                      <div style={{ fontFamily: A.mono, fontSize: 12, color: A.muted, fontStyle: 'italic' }}>"{c.sample}"</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: A.paperWarm, border: `1px solid ${A.rule}`, padding: '6px 10px', borderRadius: A.radius, color: c.mapped.startsWith('—') ? A.muted : A.ink, fontSize: 13 }}>
                        <span style={{ flex: 1 }}>{c.mapped}</span>
                        <Icon name="chevdown" size={12} color={A.muted} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <APill tone={c.confidence === 'auto' ? 'ok' : c.confidence === 'sugerido' ? 'warn' : c.confidence === 'pendiente' ? 'err' : 'neutral'}>{c.confidence}</APill>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel lateral: vista previa + acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
              <div style={{ background: A.accentSoft, border: `1px solid ${A.accent}`, borderRadius: A.radius, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Icon name="sparkle" size={16} color={A.accentDeep} />
                  <span style={{ fontFamily: A.mono, fontSize: 10, color: A.accentDeep, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Detectamos por vos</span>
                </div>
                <div style={{ fontSize: 13, color: A.accentDeep, lineHeight: 1.5 }}>
                  Tu archivo se ve como un listado de productos de almacén. Asignamos los campos por el nombre y por el contenido — verificá los <strong>3 en naranja</strong> antes de seguir.
                </div>
              </div>

              <div style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: 16 }}>
                <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Vista previa · fila 1</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: A.muted }}>SKU</span><span style={{ fontFamily: A.mono }}>YRB-001</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: A.muted }}>Nombre</span><span style={{ fontFamily: A.sans }}>Yerba Rosamonte</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: A.muted }}>Precio</span><span style={{ fontFamily: A.mono }}>$ 3.450,00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: A.muted }}>Stock</span><span style={{ fontFamily: A.serif, fontSize: 16 }}>42</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ABtn kind="primary" full size="lg" icon="arrow">Revisar 3 errores</ABtn>
                <ABtn kind="ghost" full size="sm">Volver a subir archivo</ABtn>
                <div style={{ fontSize: 11, color: A.muted, textAlign: 'center', marginTop: 4 }}>Hacemos una copia de seguridad antes. Podés revertir en cualquier momento.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Vista contador (AFIP completo)
  // ─────────────────────────────────────────────────────────────
  window.A_Accountant = () => (
    <div style={{ width: 1280, height: 800, background: A.paper, color: A.ink, fontFamily: A.sans, display: 'flex', flexDirection: 'column' }}>
      {/* Barra cambiada — modo contador */}
      <div style={{ background: A.ink, color: A.paper, padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: A.serif, fontSize: 24, lineHeight: 1 }}>Posta</span>
          <span style={{ fontFamily: A.mono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
            modo contador · acceso limitado a comprobantes
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: A.sans, fontSize: 13 }}>Estudio Vázquez & Asoc.</span>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: A.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>V</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: A.serif, fontSize: 40, fontWeight: 400, letterSpacing: -0.5 }}>Libro IVA Ventas</h2>
            <div style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>Mayo 2026 · período abierto · CUIT 30-71283471-9</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ABtn kind="secondary" icon="report">Exportar libro IVA</ABtn>
            <ABtn kind="secondary" icon="file">CITI Ventas</ABtn>
            <ABtn kind="primary" icon="check">Cerrar período</ABtn>
          </div>
        </div>

        {/* KPIs fiscales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {[
            { l: 'Neto gravado', v: 348920 },
            { l: 'IVA débito fiscal', v: 73273 },
            { l: 'Total facturado', v: 422193 },
            { l: 'Comprobantes', v: 184, num: true },
            { l: 'Pendientes CAE', v: 0, num: true, tone: A.ok },
          ].map((k, i) => (
            <div key={i} style={{ background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, padding: '14px 16px' }}>
              <div style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{k.l}</div>
              {k.num ? <div style={{ fontFamily: A.serif, fontSize: 30, color: k.tone || A.ink }}>{k.v}</div> : <APrice value={k.v} size={22} currencySize={12} />}
            </div>
          ))}
        </div>

        {/* Tabla de comprobantes */}
        <div style={{ flex: 1, background: A.card, border: `1px solid ${A.rule}`, borderRadius: A.radius, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${A.rule}`, background: A.paperWarm, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: A.serif, fontSize: 20 }}>Comprobantes emitidos</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: A.mono, fontSize: 11, color: A.muted, letterSpacing: 1 }}>23 mayo · día actual</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 150px 110px 1fr 110px 110px 110px 160px', padding: '12px 20px', borderBottom: `1px solid ${A.rule}`, background: A.paperWarm }}>
            {['Día', 'Comprobante', 'Tipo', 'Cliente / CUIT', 'Neto', 'IVA 21%', 'Total', 'CAE'].map((h, i) => (
              <div key={i} style={{ fontFamily: A.mono, fontSize: 10, color: A.muted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: i >= 4 && i <= 6 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
          {window.VOUCHERS.map((v, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 150px 110px 1fr 110px 110px 110px 160px', padding: '14px 20px', borderBottom: i < window.VOUCHERS.length - 1 ? `1px solid ${A.ruleSoft}` : 'none', alignItems: 'center' }}>
              <span style={{ fontFamily: A.mono, fontSize: 13, color: A.muted }}>{v.date}</span>
              <span style={{ fontFamily: A.mono, fontSize: 12 }}>{v.num}</span>
              <span>{v.type.includes('A') ? <APill tone="ok">{v.type}</APill> : v.type.includes('Cdto') ? <APill tone="err">{v.type}</APill> : <APill tone="neutral">{v.type}</APill>}</span>
              <span style={{ fontSize: 13, color: A.ink }}>{v.client}</span>
              <span style={{ fontFamily: A.mono, fontSize: 13, textAlign: 'right', color: v.net < 0 ? A.neg : A.ink }}>{window.NumAR(v.net)}</span>
              <span style={{ fontFamily: A.mono, fontSize: 13, textAlign: 'right', color: A.muted }}>{window.NumAR(v.iva)}</span>
              <span style={{ fontFamily: A.serif, fontSize: 18, textAlign: 'right', color: v.total < 0 ? A.neg : A.ink }}>{window.NumAR(v.total)}</span>
              <span style={{ fontFamily: A.mono, fontSize: 11, color: A.muted }}>{v.cae}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', background: A.okSoft, border: `1px solid ${A.ok}`, borderRadius: A.radius }}>
          <Icon name="check" size={16} color={A.ok} />
          <span style={{ fontSize: 13, color: A.ok }}>
            <strong>Todos los comprobantes del período tienen CAE vigente.</strong> Última sincronización con AFIP: hace 4 minutos.
          </span>
        </div>
      </div>
    </div>
  );
})();
