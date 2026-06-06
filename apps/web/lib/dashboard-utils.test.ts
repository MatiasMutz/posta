import { describe, it, expect, vi } from 'vitest';
import {
  saludoDesdeEmail, saludoHorario, formatFechaLarga,
} from './dashboard-utils';

describe('dashboard-utils', () => {
  it('extrae nombre legible del email', () => {
    expect(saludoDesdeEmail('juan.perez@empresa.com')).toBe('Juan');
    expect(saludoDesdeEmail('maria@test.com')).toBe('Maria');
  });

  it('formatea fecha larga en es-AR', () => {
    const texto = formatFechaLarga('2026-06-05T12:00:00.000Z');
    expect(texto.toLowerCase()).toMatch(/junio/);
    expect(texto).toMatch(/5/);
  });

  it('saludoHorario devuelve texto según hora', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-05T10:00:00'));
    expect(saludoHorario()).toBe('Buenos días');
    vi.setSystemTime(new Date('2026-06-05T15:00:00'));
    expect(saludoHorario()).toBe('Buenas tardes');
    vi.setSystemTime(new Date('2026-06-05T21:00:00'));
    expect(saludoHorario()).toBe('Buenas noches');
    vi.useRealTimers();
  });
});
