import { describe, it, expect } from 'vitest';
import { mapearColumnas, camposDisponibles } from '../column-mapper';

describe('mapearColumnas — inventario', () => {
  it('match exacto en español', () => {
    const result = mapearColumnas(['nombre', 'sku', 'precio', 'costo'], 'inventario');
    expect(result[0]).toMatchObject({ campoSugerido: 'nombre', confianza: 1.0 });
    expect(result[1]).toMatchObject({ campoSugerido: 'sku', confianza: 1.0 });
    expect(result[2]).toMatchObject({ campoSugerido: 'precio', confianza: 1.0 });
    expect(result[3]).toMatchObject({ campoSugerido: 'costo', confianza: 1.0 });
  });

  it('normaliza tildes y mayúsculas', () => {
    const result = mapearColumnas(['Descripción', 'PRECIO VENTA'], 'inventario');
    expect(result[0].campoSugerido).toBe('nombre');
    expect(result[1].campoSugerido).toBe('precio');
  });

  it('alias de inglés reconocidos', () => {
    const result = mapearColumnas(['name', 'price', 'cost'], 'inventario');
    expect(result[0].campoSugerido).toBe('nombre');
    expect(result[1].campoSugerido).toBe('precio');
    expect(result[2].campoSugerido).toBe('costo');
  });

  it('similaridad Levenshtein supera umbral 80%', () => {
    // 'nombree' (1 char extra) → similitud ~86% → mapea
    const result = mapearColumnas(['nombree', 'sku'], 'inventario');
    expect(result[0].campoSugerido).toBe('nombre');
  });

  it('headers con similitud baja no se auto-mapean', () => {
    // 'xprcxo' → demasiado diferente de cualquier alias
    const result = mapearColumnas(['xprcxo', 'zzzz'], 'inventario');
    expect(result[0].campoSugerido).toBeNull();
    expect(result[1].campoSugerido).toBeNull();
  });

  it('headers no reconocibles quedan sin mapear (campoSugerido: null)', () => {
    const result = mapearColumnas(['columna_desconocida', 'xyz_123'], 'inventario');
    expect(result[0].campoSugerido).toBeNull();
    expect(result[1].campoSugerido).toBeNull();
  });

  it('no repite el mismo campo para dos headers distintos', () => {
    const result = mapearColumnas(['nombre', 'producto'], 'inventario');
    const campos = result.map(r => r.campoSugerido).filter(Boolean);
    const unicos = new Set(campos);
    expect(unicos.size).toBe(campos.length);
  });
});

describe('mapearColumnas — clientes', () => {
  it('mapea campos de clientes', () => {
    const result = mapearColumnas(['cliente', 'mail', 'cuit', 'domicilio'], 'clientes');
    expect(result[0].campoSugerido).toBe('nombre');
    expect(result[1].campoSugerido).toBe('email');
    expect(result[2].campoSugerido).toBe('cuit');
    expect(result[3].campoSugerido).toBe('direccion');
  });
});

describe('camposDisponibles', () => {
  it('devuelve los campos del perfil inventario', () => {
    const campos = camposDisponibles('inventario');
    expect(campos).toContain('nombre');
    expect(campos).toContain('precio');
    expect(campos).toContain('costo');
    expect(campos).toContain('stock_inicial');
  });
});
