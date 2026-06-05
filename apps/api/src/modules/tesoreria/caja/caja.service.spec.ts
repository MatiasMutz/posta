import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CajaService } from './caja.service';
import { fromString, subtract, toNumericString } from '@posta/money';

const mockWithTenant = vi.fn();
vi.mock('../../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
}));

const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  offset: vi.fn(),
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
  mockTx.innerJoin.mockReturnThis();
});

describe('CajaService — validaciones', () => {
  it('rechaza apertura con monto cero', async () => {
    const svc = new CajaService();
    await expect(svc.abrir('t1', 'u1', { monto_apertura: '0' }))
      .rejects.toThrow(BadRequestException);
  });

  it('rechaza apertura si ya hay sesión abierta', async () => {
    const svc = new CajaService();
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.limit.mockResolvedValueOnce([{ id: 'sesion-1', estado: 'abierta' }]);
      return cb(mockTx);
    });

    await expect(svc.abrir('t1', 'u1', { monto_apertura: '1000.00' }))
      .rejects.toThrow(/Ya hay una caja abierta/);
  });

  it('rechaza cierre sin sesión abierta', async () => {
    const svc = new CajaService();
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.limit.mockResolvedValueOnce([]);
      return cb(mockTx);
    });

    await expect(svc.cerrar('t1', { monto_cierre: '1000.00' }))
      .rejects.toThrow(NotFoundException);
  });

  it('calcula diferencia de cierre con Money', () => {
    const diff = subtract(fromString('1050.00'), fromString('1000.00'));
    expect(toNumericString(diff)).toBe('50.00');
  });
});

describe('CajaService — movimientos', () => {
  it('rechaza movimiento con monto cero', async () => {
    const svc = new CajaService();
    await expect(svc.registrarMovimiento('t1', 'u1', {
      tipo: 'ingreso', monto: '0', concepto: 'Test',
    })).rejects.toThrow(BadRequestException);
  });

  it('rechaza movimiento sin caja abierta', async () => {
    const svc = new CajaService();
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.limit.mockResolvedValueOnce([]);
      return cb(mockTx);
    });

    await expect(svc.registrarMovimiento('t1', 'u1', {
      tipo: 'ingreso', monto: '100.00', concepto: 'Test',
    })).rejects.toThrow(/No hay una caja abierta/);
  });
});
