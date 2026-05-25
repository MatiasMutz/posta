import {
  sanitizarTexto,
  sanitizarMonto,
  sanitizarEntero,
  validarMontoPositivo,
  validarRequerido,
  type SanitizeFn,
} from '../sanitizer';

export interface CampoDefinicion {
  campo: string;
  requerido: boolean;
  sanitizar: SanitizeFn;
  validar?: (v: string | null) => string | null;
  defaultValue?: string;
}

export const INVENTARIO_CAMPOS: CampoDefinicion[] = [
  {
    campo: 'nombre',
    requerido: true,
    sanitizar: sanitizarTexto,
    validar: validarRequerido,
  },
  {
    campo: 'sku',
    requerido: false,
    sanitizar: sanitizarTexto,
  },
  {
    campo: 'codigo_barras',
    requerido: false,
    sanitizar: sanitizarTexto,
  },
  {
    campo: 'costo',
    requerido: true,
    sanitizar: sanitizarMonto,
    validar: (v) => validarRequerido(v) ?? validarMontoPositivo(v),
  },
  {
    campo: 'precio',
    requerido: true,
    sanitizar: sanitizarMonto,
    validar: (v) => validarRequerido(v) ?? validarMontoPositivo(v),
  },
  {
    campo: 'stock_inicial',
    requerido: false,
    sanitizar: sanitizarEntero,
    defaultValue: '0',
  },
  {
    campo: 'stock_minimo',
    requerido: false,
    sanitizar: sanitizarEntero,
    defaultValue: '0',
  },
];
