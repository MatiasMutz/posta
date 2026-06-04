import { describe, it, expect } from 'vitest';
import { buildVentaPayload, validarVentaPos, mensajeErrorVenta } from './ventas-pos';

const itemBase = {
  productoId: '11111111-1111-1111-1111-111111111111',
  descripcion: 'Producto test',
  cantidad: 2,
  precioUnitario: '150.00',
};

describe('buildVentaPayload', () => {
  it('serializa snake_case para la API', () => {
    const payload = buildVentaPayload({
      tipo: 'factura_b',
      metodoPago: 'efectivo',
      clienteId: '',
      items: [itemBase],
    }) as Record<string, unknown>;

    expect(payload.metodo_pago).toBe('efectivo');
    expect(payload.items).toEqual([
      expect.objectContaining({
        producto_id: itemBase.productoId,
        precio_unitario: '150.00',
      }),
    ]);
    expect(payload).not.toHaveProperty('cliente_id');
  });

  it('incluye cliente_id cuando hay cliente', () => {
    const payload = buildVentaPayload({
      tipo: 'factura_b',
      metodoPago: 'cuenta_corriente',
      clienteId: '22222222-2222-2222-2222-222222222222',
      items: [itemBase],
    }) as Record<string, unknown>;

    expect(payload.cliente_id).toBe('22222222-2222-2222-2222-222222222222');
  });
});

describe('validarVentaPos', () => {
  it('acepta venta en efectivo válida', () => {
    const result = validarVentaPos({
      tipo: 'factura_b',
      metodoPago: 'efectivo',
      clienteId: '',
      items: [itemBase],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.metodo_pago).toBe('efectivo');
      expect(result.data.items).toHaveLength(1);
    }
  });

  it('rechaza carrito vacío', () => {
    const result = validarVentaPos({
      tipo: 'factura_b',
      metodoPago: 'efectivo',
      clienteId: '',
      items: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errores[0]?.campo).toBe('items');
    }
  });

  it('rechaza cuenta corriente sin cliente (refine de CreateVentaSchema)', () => {
    const result = validarVentaPos({
      tipo: 'factura_b',
      metodoPago: 'cuenta_corriente',
      clienteId: '',
      items: [itemBase],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(mensajeErrorVenta(result)).toContain('cliente');
      expect(result.errores.some((e) => e.campo === 'cliente_id')).toBe(true);
    }
  });

  it('acepta factura C y ticket sin cliente', () => {
    for (const tipo of ['factura_c', 'ticket'] as const) {
      const result = validarVentaPos({
        tipo,
        metodoPago: 'efectivo',
        clienteId: '',
        items: [itemBase],
      });
      expect(result.ok).toBe(true);
    }
  });

  it('acepta remito sin cliente', () => {
    const result = validarVentaPos({
      tipo: 'remito',
      metodoPago: 'efectivo',
      clienteId: '',
      items: [itemBase],
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza Factura A sin cliente', () => {
    const result = validarVentaPos({
      tipo: 'factura_a',
      metodoPago: 'efectivo',
      clienteId: '',
      items: [itemBase],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errores.some((e) => e.campo === 'cliente_id')).toBe(true);
    }
  });

  it('rechaza cantidad decimal', () => {
    const result = validarVentaPos({
      tipo: 'factura_b',
      metodoPago: 'efectivo',
      clienteId: '',
      items: [{ ...itemBase, cantidad: 1.5 }],
    });
    expect(result.ok).toBe(false);
  });
});
