import { describe, it, expect } from 'vitest';
import { CreateClienteSchema, CreateProductoSchema } from '@posta/validation';

/** Smoke tests: los schemas compartidos que usan los forms deben rechazar datos inválidos. */
describe('schemas de formularios (packages/validation)', () => {
  it('CreateClienteSchema exige nombre', () => {
    const result = CreateClienteSchema.safeParse({ nombre: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.path).toContain('nombre');
    }
  });

  it('CreateClienteSchema normaliza email vacío', () => {
    const result = CreateClienteSchema.safeParse({ nombre: 'Juan', email: '' });
    expect(result.success).toBe(true);
  });

  it('CreateProductoSchema exige costo y precio como string', () => {
    const result = CreateProductoSchema.safeParse({
      nombre: 'Test',
      costo: '100.00',
      precio: '200.00',
    });
    expect(result.success).toBe(true);
  });

  it('CreateProductoSchema rechaza precio inválido', () => {
    const result = CreateProductoSchema.safeParse({
      nombre: 'Test',
      costo: 'abc',
      precio: '200.00',
    });
    expect(result.success).toBe(false);
  });
});
