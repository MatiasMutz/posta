import {
  sanitizarTexto,
  sanitizarCuit,
  validarRequerido,
} from '../sanitizer';
import type { CampoDefinicion } from './inventario.profile';

// Reutiliza CampoDefinicion del perfil de inventario

function sanitizarEmail(v: unknown): string | null {
  const s = sanitizarTexto(v);
  if (s === null) return null;
  // Validación mínima: tiene @ y algún punto después
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function validarEmail(v: string | null): string | null {
  if (v === null) return null; // email es opcional
  return null; // si llegó hasta acá, sanitizarEmail lo validó
}

function sanitizarTelefono(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const digits = String(v).trim();
  return digits.length > 0 ? digits : null;
}

export const CLIENTES_CAMPOS: CampoDefinicion[] = [
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
      if (v === null) return null; // cuit opcional
      if (v.length !== 11) return 'El CUIT debe tener 11 dígitos';
      return null;
    },
  },
  {
    campo: 'direccion',
    requerido: false,
    sanitizar: sanitizarTexto,
  },
];
