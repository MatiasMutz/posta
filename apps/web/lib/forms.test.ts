import { describe, it, expect } from 'vitest';
import { CreateClienteSchema, CreateProductoSchema, CreateVentaSchema } from '@posta/validation';

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

  it('CreateVentaSchema rechaza cantidad decimal', () => {
    const result = CreateVentaSchema.safeParse({
      tipo: 'factura_b',
      metodo_pago: 'efectivo',
      items: [{ descripcion: 'X', cantidad: 1.5, precio_unitario: '100.00' }],
    });
    expect(result.success).toBe(false);
  });

  it('CreateVentaSchema exige cliente para Factura A', () => {
    const result = CreateVentaSchema.safeParse({
      tipo: 'factura_a',
      metodo_pago: 'efectivo',
      items: [{ descripcion: 'X', cantidad: 1, precio_unitario: '100.00' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('cliente_id'))).toBe(true);
    }
  });
});
