import type { TipoImport } from '@posta/validation';

export interface Sugerencia {
  headerArchivo: string;
  campoSugerido: string | null;
  confianza: number; // 0.0 – 1.0
}

// Aliases conocidos por campo de cada perfil
const INVENTARIO_ALIASES: Record<string, string[]> = {
  nombre: ['nombre', 'producto', 'descripcion', 'articulo', 'item', 'name', 'description'],
  sku: ['sku', 'codigo', 'code', 'referencia', 'ref', 'codart', 'codarticulo'],
  codigo_barras: ['codigo_barras', 'barcode', 'ean', 'gtin', 'cod_barras', 'codbarras'],
  costo: ['costo', 'costo_unitario', 'precio_costo', 'cost', 'precio_compra'],
  precio: ['precio', 'precio_venta', 'precio_unitario', 'pvp', 'price', 'importe'],
  stock_inicial: ['stock', 'stock_inicial', 'cantidad', 'existencia', 'qty', 'quantity', 'existencias'],
  stock_minimo: ['stock_minimo', 'stock_min', 'minimo', 'min_stock', 'min'],
};

const CLIENTES_ALIASES: Record<string, string[]> = {
  nombre: ['nombre', 'cliente', 'razon_social', 'razon social', 'name', 'apellido_nombre'],
  email: ['email', 'correo', 'mail', 'e-mail', 'correo_electronico'],
  telefono: ['telefono', 'tel', 'phone', 'celular', 'cel', 'whatsapp'],
  cuit: ['cuit', 'cuit/cuil', 'cuil', 'nit', 'ruc', 'documento_fiscal'],
  direccion: ['direccion', 'domicilio', 'address', 'dir', 'domicilio_comercial'],
};

const PROVEEDORES_ALIASES: Record<string, string[]> = {
  nombre: ['nombre', 'proveedor', 'razon_social', 'razon social', 'name'],
  email: ['email', 'correo', 'mail', 'e-mail'],
  telefono: ['telefono', 'tel', 'phone', 'celular', 'cel'],
  cuit: ['cuit', 'cuit/cuil', 'cuil', 'documento_fiscal'],
  direccion: ['direccion', 'domicilio', 'address', 'dir'],
  saldo_acreedor: [
    'saldo', 'saldo_acreedor', 'saldo_inicial', 'deuda', 'adeudado',
    'cuenta_corriente', 'cta_cte', 'saldo_proveedor',
  ],
};

const ALIASES_POR_TIPO: Record<TipoImport, Record<string, string[]>> = {
  inventario: INVENTARIO_ALIASES,
  clientes: CLIENTES_ALIASES,
  proveedores: PROVEEDORES_ALIASES,
};

const CONFIDENCE_THRESHOLD = 0.80;

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9_\s]/g, '')   // keep alphanumeric, underscore, space
    .replace(/\s+/g, '_')
    .trim();
}

// Distancia de Levenshtein iterativa (O(n*m) tiempo, O(n) espacio)
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev = curr;
  }
  return prev[b.length];
}

function similitud(a: string, b: string): number {
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length, 1);
}

export function mapearColumnas(headers: string[], tipo: TipoImport): Sugerencia[] {
  const aliases = ALIASES_POR_TIPO[tipo];
  const camposUsados = new Set<string>();

  return headers.map((header) => {
    const norm = normalizar(header);

    // 1. Match exacto
    for (const [campo, aliasList] of Object.entries(aliases)) {
      if (aliasList.includes(norm) && !camposUsados.has(campo)) {
        camposUsados.add(campo);
        return { headerArchivo: header, campoSugerido: campo, confianza: 1.0 };
      }
    }

    // 2. Similaridad por Levenshtein
    let mejor = { campo: null as string | null, confianza: 0 };
    for (const [campo, aliasList] of Object.entries(aliases)) {
      if (camposUsados.has(campo)) continue;
      for (const alias of aliasList) {
        const conf = similitud(norm, alias);
        if (conf > mejor.confianza) {
          mejor = { campo, confianza: conf };
        }
      }
    }

    if (mejor.confianza >= CONFIDENCE_THRESHOLD && mejor.campo) {
      camposUsados.add(mejor.campo);
      return { headerArchivo: header, campoSugerido: mejor.campo, confianza: mejor.confianza };
    }

    return { headerArchivo: header, campoSugerido: null, confianza: mejor.confianza };
  });
}

export function camposDisponibles(tipo: TipoImport): string[] {
  return Object.keys(ALIASES_POR_TIPO[tipo]);
}
