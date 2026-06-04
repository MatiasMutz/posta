import {
  sanitizarTexto,
  sanitizarCuit,
  sanitizarMonto,
  validarRequerido,
} from '../sanitizer';
import type { CampoDefinicion } from './inventario.profile';

function sanitizarEmail(v: unknown): string | null {
  const s = sanitizarTexto(v);
  if (s === null) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function validarEmail(v: string | null): string | null {
  if (v === null) return null;
  return null;
}

function sanitizarTelefono(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const digits = String(v).trim();
  return digits.length > 0 ? digits : null;
}

export const PROVEEDORES_CAMPOS: CampoDefinicion[] = [
  {
    campo: 'nombre',
    requerido: true,
    sanitizar: sanitizarTexto,
    validar: validarRequerido,
  },
  {
    campo: 'email',
    requerido: false,
    sanitizar: sanitizarEmail,
    validar: validarEmail,
  },
  {
    campo: 'telefono',
    requerido: false,
    sanitizar: sanitizarTelefono,
  },
  {
    campo: 'cuit',
    requerido: false,
    sanitizar: sanitizarCuit,
    validar: (v) => {
      if (v === null) return null;
      if (v.length !== 11) return 'El CUIT debe tener 11 dígitos';
      return null;
    },
  },
  {
    campo: 'direccion',
    requerido: false,
    sanitizar: sanitizarTexto,
  },
  {
    campo: 'saldo_acreedor',
    requerido: false,
    sanitizar: sanitizarMonto,
    validar: (v) => {
      if (v === null) return null;
      if (Number(v) < 0) return 'El saldo no puede ser negativo';
      return null;
    },
  },
];
