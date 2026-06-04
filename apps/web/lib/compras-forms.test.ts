import { describe, it, expect } from 'vitest';
import { CreateCompraSchema, CreateProveedorSchema } from '@posta/validation';

describe('CreateProveedorSchema', () => {
  it('acepta proveedor mínimo', () => {
    const r = CreateProveedorSchema.safeParse({ nombre: 'Distribuidora SA' });
    expect(r.success).toBe(true);
  });
});

describe('CreateCompraSchema', () => {
  it('exige proveedor en cuenta corriente', () => {
    const r = CreateCompraSchema.safeParse({
      categoria: 'compra',
      metodo_pago: 'cuenta_corriente',
      items: [{ descripcion: 'X', cantidad: 1, precio_unitario: '100.00' }],
    });
    expect(r.success).toBe(false);
  });

  it('gasto no permite producto_id', () => {
    const r = CreateCompraSchema.safeParse({
      categoria: 'gasto',
      metodo_pago: 'efectivo',
      items: [{
        descripcion: 'Servicio',
        cantidad: 1,
        precio_unitario: '500.00',
        producto_id: '00000000-0000-4000-8000-000000000001',
      }],
    });
    expect(r.success).toBe(false);
  });

  it('acepta compra con ítem y proveedor en cta cte', () => {
    const r = CreateCompraSchema.safeParse({
      categoria: 'compra',
      metodo_pago: 'cuenta_corriente',
      proveedor_id: '00000000-0000-4000-8000-000000000001',
      items: [{ descripcion: 'Mercadería', cantidad: 2, precio_unitario: '150.00' }],
    });
    expect(r.success).toBe(true);
  });
});
