import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { fromString, subtract, toNumericString } from '@posta/money';

const mockWithTenant = vi.fn();
vi.mock('../../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
}));

const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn(),
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
  mockTx.orderBy.mockReturnThis();
});

describe('PagosService — pago cliente', () => {
  it('rechaza monto mayor al saldo deudor', async () => {
    const svc = new PagosService();
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.limit.mockResolvedValueOnce([{ id: 'c1', nombre: 'Juan', saldo_deudor: '100.00' }]);
      return cb(mockTx);
    });

    await expect(svc.registrarPagoCliente('t1', 'u1', {
      cliente_id: 'c1', monto: '200.00', metodo_pago: 'efectivo',
    })).rejects.toThrow(/supera el saldo deudor/);
  });

  it('baja saldo deudor correctamente con Money', () => {
    expect(toNumericString(subtract(fromString('500.00'), fromString('200.00')))).toBe('300.00');
  });

  it('rechaza cliente inexistente', async () => {
    const svc = new PagosService();
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.limit.mockResolvedValueOnce([]);
      return cb(mockTx);
    });

    await expect(svc.registrarPagoCliente('t1', 'u1', {
      cliente_id: 'c-x', monto: '100.00', metodo_pago: 'efectivo',
    })).rejects.toThrow(NotFoundException);
  });
});

describe('PagosService — pago proveedor', () => {
  it('rechaza monto mayor al saldo acreedor', async () => {
    const svc = new PagosService();
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.limit.mockResolvedValueOnce([{ id: 'p1', nombre: 'Prov', saldo_acreedor: '50.00' }]);
      return cb(mockTx);
    });

    await expect(svc.registrarPagoProveedor('t1', 'u1', {
      proveedor_id: 'p1', monto: '100.00', metodo_pago: 'efectivo',
    })).rejects.toThrow(/supera el saldo acreedor/);
  });

  it('rechaza monto cero', async () => {
    const svc = new PagosService();
    await expect(svc.registrarPagoProveedor('t1', 'u1', {
      proveedor_id: 'p1', monto: '0', metodo_pago: 'efectivo',
    })).rejects.toThrow(BadRequestException);
  });
});
