import { describe, it, expect } from 'vitest';
import { rutaInicioPorRol, redirectPorRol } from './auth';

describe('rutaInicioPorRol', () => {
  it('devuelve la ruta de inicio según rol', () => {
    expect(rutaInicioPorRol('dueno')).toBe('/inventario');
    expect(rutaInicioPorRol('vendedor')).toBe('/ventas');
    expect(rutaInicioPorRol('contador')).toBe('/ventas/historial');
    expect(rutaInicioPorRol(undefined)).toBe('/inventario');
  });
});

describe('redirectPorRol', () => {
  it('bloquea importar y configuración para no-dueño', () => {
    expect(redirectPorRol('/importar', 'vendedor')).toBe('/ventas');
    expect(redirectPorRol('/importar/job-1', 'contador')).toBe('/ventas/historial');
    expect(redirectPorRol('/configuracion/equipo', 'vendedor')).toBe('/ventas');
    expect(redirectPorRol('/importar', 'dueno')).toBeNull();
  });

  it('bloquea clientes al vendedor y escritura al contador', () => {
    expect(redirectPorRol('/clientes', 'vendedor')).toBe('/ventas');
    expect(redirectPorRol('/clientes', 'contador')).toBeNull();
    expect(redirectPorRol('/clientes/nuevo', 'contador')).toBe('/clientes');
    expect(redirectPorRol('/clientes/abc/editar', 'contador')).toBe('/clientes');
  });

  it('bloquea inventario al contador y movimientos al vendedor', () => {
    expect(redirectPorRol('/inventario', 'contador')).toBe('/ventas/historial');
    expect(redirectPorRol('/inventario/nuevo', 'vendedor')).toBe('/inventario');
    expect(redirectPorRol('/inventario/abc/movimientos', 'vendedor')).toBe('/inventario');
    expect(redirectPorRol('/inventario', 'vendedor')).toBeNull();
  });

  it('bloquea POS al contador e historial al vendedor', () => {
    expect(redirectPorRol('/ventas', 'contador')).toBe('/ventas/historial');
    expect(redirectPorRol('/ventas/historial', 'vendedor')).toBe('/ventas');
    expect(redirectPorRol('/ventas/historial', 'contador')).toBeNull();
  });
});
