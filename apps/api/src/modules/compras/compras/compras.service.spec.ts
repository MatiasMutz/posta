import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ComprasService } from './compras.service';
import { add, fromString, isNegative, subtract, toNumericString } from '@posta/money';

const mockWithTenant = vi.fn();
vi.mock('../../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
}));

const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  orderBy: vi.fn().mockReturnThis(),
  offset: vi.fn(),
  leftJoin: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockTx.select.mockReturnThis();
  mockTx.from.mockReturnThis();
  mockTx.where.mockReturnThis();
  mockTx.limit.mockReturnThis();
  mockTx.orderBy.mockReturnThis();
  mockTx.leftJoin.mockReturnThis();
});

describe('ComprasService — cálculo de totales', () => {
  it('descuento mayor al subtotal detectado con isNegative', () => {
    const total = subtract(fromString('100.00'), fromString('200.00'));
    expect(isNegative(total)).toBe(true);
  });

  it('cuenta corriente suma saldo acreedor con Money', () => {
    expect(toNumericString(add(fromString('500.00'), fromString('300.00')))).toBe('800.00');
  });
});

describe('ComprasService.create — validaciones', () => {
  it('lanza BadRequestException cuando descuento > subtotal', async () => {
    const svc = new ComprasService();
    await expect(
      svc.create('t1', 'u1', {
        categoria: 'gasto',
        tipo_comprobante: 'sin_comprobante',
        metodo_pago: 'efectivo',
        descuento: '500.00',
        items: [{ descripcion: 'Servicio', cantidad: 1, precio_unitario: '100.00' }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lanza BadRequestException si proveedor no existe', async () => {
    const svc = new ComprasService();
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.limit.mockResolvedValueOnce([]);
      return cb(mockTx);
    });

    await expect(
      svc.create('t1', 'u1', {
        proveedor_id: 'prov-x',
        categoria: 'compra',
        tipo_comprobante: 'factura_b',
        metodo_pago: 'efectivo',
        descuento: '0',
        items: [{ descripcion: 'X', cantidad: 1, precio_unitario: '100.00' }],
      }),
    ).rejects.toThrow(/Proveedor no encontrado/);
  });
});

describe('ComprasService.exportarIvaCompras', () => {
  it('genera buffer xlsx', async () => {
    mockWithTenant.mockResolvedValueOnce([
      {
        created_at: new Date('2024-06-01'),
        tipo_comprobante: 'factura_b',
        numero_comprobante: 42,
        categoria: 'compra',
        total: '1210.00',
        proveedor_nombre: 'Proveedor Test',
        proveedor_cuit: '30123456789',
      },
    ]);

    const svc = new ComprasService();
    const buffer = await svc.exportarIvaCompras('t1', {});
    expect(buffer.length).toBeGreaterThan(100);
  });
});
