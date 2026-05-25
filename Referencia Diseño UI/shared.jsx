// shared.jsx — utilidades comunes a las 3 direcciones del sistema de diseño.
// Formato de pesos argentinos (es-AR), placeholders monoespaciados, data
// de muestra (productos argentinos creíbles), iconos line-only, y
// constructores chicos para fichas de tokens.

// ────────────────────────────────────────────────────────────────
// Formato de pesos argentinos: $ 3.450,00 — separador miles con punto,
// decimales con coma. toLocaleString('es-AR') hace lo correcto.
// ────────────────────────────────────────────────────────────────
window.ARS = (n, { decimals = 0, sign = true } = {}) => {
  const formatted = Math.abs(n).toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const s = (sign ? '$ ' : '') + formatted;
  return n < 0 ? '-' + s : s;
};

window.ARSparts = (n) => {
  // Devuelve [entero, decimales] como strings, para mostrar los decimales
  // en menor escala visual cuando el monto es protagonista.
  const abs = Math.abs(n);
  const int = Math.floor(abs).toLocaleString('es-AR');
  const dec = (abs % 1).toFixed(2).slice(2);
  return { sign: n < 0 ? '-' : '', int, dec };
};

window.NumAR = (n, decimals = 0) =>
  n.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

// ────────────────────────────────────────────────────────────────
// Placeholder monoespaciado: rayado sutil + label en mono, según el brief.
// Soporta variantes de color para que en cada dirección se sienta integrado.
// ────────────────────────────────────────────────────────────────
window.Placeholder = function Placeholder({
  label,
  width = '100%',
  height = 80,
  stripe = 'rgba(0,0,0,0.04)',
  bg = 'rgba(0,0,0,0.02)',
  fg = 'rgba(0,0,0,0.5)',
  radius = 4,
  border = 'rgba(0,0,0,0.08)',
  font = 'ui-monospace, "JetBrains Mono", "Space Mono", monospace',
  style = {},
}) {
  const stripeSvg = `repeating-linear-gradient(135deg, ${stripe} 0 1px, transparent 1px 8px)`;
  return (
    <div style={{
      width, height,
      background: `${stripeSvg}, ${bg}`,
      border: `1px solid ${border}`,
      borderRadius: radius,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: fg, fontFamily: font, fontSize: 11,
      letterSpacing: 0.2, textTransform: 'lowercase',
      ...style,
    }}>
      [{label}]
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Productos de muestra: nombres argentinos creíbles, precios plausibles
// para 2026 (en miles de pesos, todavía). Stock variado para mostrar
// estados (ok, bajo, agotado).
// ────────────────────────────────────────────────────────────────
window.PRODUCTS = [
  { sku: 'YRB-001', name: 'Yerba Rosamonte Suave',     unit: '1 kg',     price: 3450, cost: 2280, stock: 42, min: 12, cat: 'Almacén' },
  { sku: 'GAS-002', name: 'Coca-Cola Original',         unit: '2.25 L',   price: 2890, cost: 2010, stock: 8,  min: 18, cat: 'Bebidas' },
  { sku: 'PAN-003', name: 'Pan Lactal Bimbo',           unit: '550 g',    price: 2150, cost: 1480, stock: 24, min: 10, cat: 'Panificados' },
  { sku: 'ACT-004', name: 'Aceite Natura Girasol',      unit: '900 ml',   price: 2780, cost: 1910, stock: 0,  min: 8,  cat: 'Almacén' },
  { sku: 'GLT-005', name: 'Galletitas Oreo Originales', unit: '118 g',    price: 890,  cost: 540,  stock: 67, min: 24, cat: 'Almacén' },
  { sku: 'LAC-006', name: 'Queso Cremoso La Serenísima', unit: '290 g',   price: 4200, cost: 2950, stock: 15, min: 6,  cat: 'Lácteos' },
  { sku: 'VIN-007', name: 'Vino Toro Centenario',       unit: '750 ml',   price: 2350, cost: 1620, stock: 31, min: 10, cat: 'Bebidas' },
  { sku: 'FIA-008', name: 'Fideos Matarazzo Spaguetti', unit: '500 g',    price: 1390, cost: 870,  stock: 58, min: 20, cat: 'Almacén' },
  { sku: 'CAF-009', name: 'Café Cabrales La Virginia',  unit: '250 g',    price: 4980, cost: 3450, stock: 4,  min: 12, cat: 'Almacén' },
  { sku: 'DUL-010', name: 'Dulce de Leche La Salamandra', unit: '450 g', price: 3650, cost: 2480, stock: 22, min: 8,  cat: 'Almacén' },
];

window.CART_SAMPLE = [
  { sku: 'YRB-001', name: 'Yerba Rosamonte Suave',     qty: 2, unitPrice: 3450 },
  { sku: 'PAN-003', name: 'Pan Lactal Bimbo',           qty: 1, unitPrice: 2150 },
  { sku: 'GLT-005', name: 'Galletitas Oreo Originales', qty: 3, unitPrice: 890 },
  { sku: 'LAC-006', name: 'Queso Cremoso La Serenísima', qty: 1, unitPrice: 4200 },
];

window.CART_TOTAL = window.CART_SAMPLE.reduce((a, i) => a + i.qty * i.unitPrice, 0);

// Movimientos de caja
window.CASH_MOVEMENTS = [
  { time: '14:32', kind: 'venta',    label: 'Venta #1284 · Efectivo',         amount:  9090 },
  { time: '14:18', kind: 'venta',    label: 'Venta #1283 · Tarjeta crédito',  amount: 12450 },
  { time: '13:55', kind: 'egreso',   label: 'Pago a proveedor · Distri Sur',  amount: -28000 },
  { time: '13:40', kind: 'venta',    label: 'Venta #1282 · Transferencia',    amount:  5640 },
  { time: '12:10', kind: 'ingreso',  label: 'Apertura de caja',                amount: 50000 },
  { time: '11:48', kind: 'venta',    label: 'Venta #1281 · Efectivo',         amount:  3450 },
];

// Cuentas corrientes (clientes)
window.CUSTOMERS_BALANCE = [
  { name: 'Almacén La Esquina',   balance:  -42500, since: '12 días' },
  { name: 'Panadería San Cayetano', balance: 18900, since: 'al día' },
  { name: 'Kiosco Don Mario',      balance: -12300, since: '4 días' },
  { name: 'Carnicería Hnos. Pérez', balance:  0,    since: 'al día' },
];

// Pasos del wizard de importación
window.IMPORT_STEPS = [
  { id: 1, name: 'Subir archivo' },
  { id: 2, name: 'Mapear columnas' },
  { id: 3, name: 'Revisar errores' },
  { id: 4, name: 'Confirmar' },
];

// Columnas detectadas en un Excel típico de pyme
window.IMPORT_COLUMNS = [
  { raw: 'Código',           sample: 'YRB-001',                      mapped: 'SKU',            confidence: 'auto' },
  { raw: 'Descripción',      sample: 'Yerba Rosamonte Suave 1kg',    mapped: 'Nombre',         confidence: 'auto' },
  { raw: 'Precio Vta',       sample: '3450',                         mapped: 'Precio venta',   confidence: 'auto' },
  { raw: 'Costo',            sample: '2280',                         mapped: 'Costo',          confidence: 'auto' },
  { raw: 'Stock actual',     sample: '42',                           mapped: 'Stock',          confidence: 'auto' },
  { raw: 'Categ.',           sample: 'Almacén',                      mapped: 'Categoría',      confidence: 'sugerido' },
  { raw: 'Proveedor habit.', sample: 'Distri Sur',                   mapped: '— ignorar',      confidence: 'ignorar' },
  { raw: 'Última compra',    sample: '12/03/2026',                   mapped: '— sin asignar',  confidence: 'pendiente' },
];

window.IMPORT_ERRORS = [
  { row: 47,  col: 'Precio venta', value: '12.500,oo', issue: 'No se puede leer el monto' },
  { row: 83,  col: 'Stock',         value: '-3',       issue: 'Stock negativo: ¿es ajuste?' },
  { row: 112, col: 'SKU',           value: '(vacío)',  issue: 'Sin código — se generará automático' },
];

// Vista contador — comprobantes AFIP
window.VOUCHERS = [
  { num: '0001-00012847', type: 'Factura B', client: 'Consumidor Final',     date: '23/05', net:  7488, iva: 1573, total:  9061, cae: '74239812450018' },
  { num: '0001-00012846', type: 'Factura A', client: 'Distribuidora del Sur', date: '23/05', net: 24380, iva: 5120, total: 29500, cae: '74239812450017' },
  { num: '0001-00012845', type: 'Nota Cdto B', client: 'Almacén La Esquina',   date: '22/05', net: -1240, iva: -260, total: -1500, cae: '74239812450016' },
  { num: '0001-00012844', type: 'Factura B', client: 'Consumidor Final',     date: '22/05', net:  4661, iva:  979, total:  5640, cae: '74239812450015' },
];

// ────────────────────────────────────────────────────────────────
// Iconos line-only, minimalistas, todos sobre la misma grilla 20×20.
// Cada dirección los pinta con su propio color.
// ────────────────────────────────────────────────────────────────
window.Icon = function Icon({ name, size = 18, stroke = 1.6, color = 'currentColor', style = {} }) {
  const props = { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  const paths = {
    pos:       <><path d="M3 6h14l-1 9H4z"/><path d="M7 6V4a3 3 0 0 1 6 0v2"/></>,
    box:       <><path d="M3 6l7-3 7 3v8l-7 3-7-3z"/><path d="M3 6l7 3 7-3M10 9v9"/></>,
    cash:      <><rect x="2.5" y="5" width="15" height="10" rx="1.5"/><circle cx="10" cy="10" r="2"/><path d="M5 8v4M15 8v4"/></>,
    upload:    <><path d="M10 13V3"/><path d="M6 7l4-4 4 4"/><path d="M3 14v3h14v-3"/></>,
    report:    <><rect x="3.5" y="2.5" width="13" height="15" rx="1"/><path d="M6.5 7h7M6.5 10h7M6.5 13h4"/></>,
    user:      <><circle cx="10" cy="7" r="3"/><path d="M3.5 17c1-3.5 4-5 6.5-5s5.5 1.5 6.5 5"/></>,
    search:    <><circle cx="9" cy="9" r="5"/><path d="M13 13l4 4"/></>,
    plus:      <><path d="M10 4v12M4 10h12"/></>,
    minus:     <><path d="M4 10h12"/></>,
    check:     <><path d="M4 10l4 4 8-9"/></>,
    x:         <><path d="M5 5l10 10M15 5L5 15"/></>,
    chevron:   <><path d="M7 5l5 5-5 5"/></>,
    chevdown:  <><path d="M5 7l5 5 5-5"/></>,
    arrow:     <><path d="M3 10h14M12 5l5 5-5 5"/></>,
    arrowdown: <><path d="M10 3v14M5 12l5 5 5-5"/></>,
    bell:      <><path d="M5 14V9a5 5 0 0 1 10 0v5M3 14h14M8 17a2 2 0 0 0 4 0"/></>,
    settings:  <><circle cx="10" cy="10" r="2.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/></>,
    alert:     <><path d="M10 2.5l8 14H2z"/><path d="M10 8v4M10 15v.5"/></>,
    info:      <><circle cx="10" cy="10" r="7.5"/><path d="M10 9v5M10 6.5v.1"/></>,
    sparkle:   <><path d="M10 3v3M10 14v3M3 10h3M14 10h3M5.5 5.5l1.5 1.5M13 13l1.5 1.5M5.5 14.5L7 13M13 7l1.5-1.5"/></>,
    file:      <><path d="M5 2h7l3 3v13H5z"/><path d="M12 2v3h3"/></>,
    excel:     <><path d="M5 2h7l3 3v13H5z"/><path d="M12 2v3h3"/><path d="M7 9l3 5M10 9l-3 5"/></>,
    trash:     <><path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11"/></>,
    edit:      <><path d="M3 17l1-4 9-9 3 3-9 9-4 1z"/></>,
    menu:      <><path d="M3 6h14M3 10h14M3 14h14"/></>,
    dots:      <><circle cx="5" cy="10" r=".8" fill="currentColor"/><circle cx="10" cy="10" r=".8" fill="currentColor"/><circle cx="15" cy="10" r=".8" fill="currentColor"/></>,
    eye:       <><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z"/><circle cx="10" cy="10" r="2"/></>,
    barcode:   <><path d="M3 5v10M5 5v10M7 5v8M9 5v10M11 5v8M13 5v10M15 5v8M17 5v10"/></>,
    card:      <><rect x="2.5" y="5" width="15" height="10" rx="1.5"/><path d="M2.5 8.5h15"/></>,
    bank:      <><path d="M3 9h14M4 9V8l6-4 6 4v1M5 9v7M9 9v7M11 9v7M15 9v7M3 17h14"/></>,
    moon:      <><path d="M16 11A6 6 0 0 1 9 4a6 6 0 1 0 7 7z"/></>,
  };
  return <svg {...props}>{paths[name] || paths.box}</svg>;
};

// Pill / badge genérico (cada dirección lo re-estiliza, esta es la base)
window.Pill = function Pill({ children, bg, color, border, style = {}, weight = 500 }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4,
      background: bg, color, border: border ? `1px solid ${border}` : 'none',
      fontSize: 11, fontWeight: weight, letterSpacing: 0.1,
      lineHeight: 1.5, whiteSpace: 'nowrap',
      ...style,
    }}>{children}</span>
  );
};

// Hostname-style label (usado en headers para mostrar la marca)
window.Brand = function Brand({ children, color = 'currentColor', style = {} }) {
  return (
    <span style={{
      fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
      fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
      color, fontWeight: 500, ...style,
    }}>{children}</span>
  );
};
