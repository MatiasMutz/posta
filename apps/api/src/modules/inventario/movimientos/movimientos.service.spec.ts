import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MovimientosService } from './movimientos.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const fakeProducto = {
  id: 'prod-1',
  tenant_id: 'tenant-1',
  stock_actual: 10,
  activo: true,
};

const mockWithTenant = vi.fn();
const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

function mockCountQuery(total = 1, countSelectCall = 2) {
  let selectCall = 0;
  mockTx.select.mockImplementation(() => {
    selectCall++;
    if (selectCall === countSelectCall) {
      return {
        from: () => ({
          where: () => Promise.resolve([{ total }]),
        }),
      };
    }
    return mockTx;
  });
}

vi.mock('../../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockTx.select.mockReturnThis();
  mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) =>
    cb(mockTx),
  );
});

describe('MovimientosService.registrar', () => {
  it('registra una entrada y actualiza el stock', async () => {
    mockTx.limit.mockResolvedValueOnce([fakeProducto]);
    mockTx.returning
      .mockResolvedValueOnce([{ ...fakeProducto, stock_actual: 15 }]) // update productos
      .mockResolvedValueOnce([{ id: 'mov-1', tipo: 'entrada', cantidad: 5 }]); // insert movimiento

    const svc = new MovimientosService();
    const result = await svc.registrar('tenant-1', 'user-1', 'prod-1', {
      tipo: 'entrada',
      cantidad: 5,
      motivo: 'Compra a proveedor',
    });
    expect(result.tipo).toBe('entrada');
    expect(mockTx.set).toHaveBeenCalledWith(expect.objectContaining({ stock_actual: 15 }));
  });

  it('registra una salida y actualiza el stock', async () => {
    mockTx.limit.mockResolvedValueOnce([fakeProducto]);
    mockTx.returning
      .mockResolvedValueOnce([{ ...fakeProducto, stock_actual: 7 }])
      .mockResolvedValueOnce([{ id: 'mov-2', tipo: 'salida', cantidad: 3 }]);

    const svc = new MovimientosService();
    await svc.registrar('tenant-1', 'user-1', 'prod-1', {
      tipo: 'salida',
      cantidad: 3,
    });
    expect(mockTx.set).toHaveBeenCalledWith(expect.objectContaining({ stock_actual: 7 }));
  });

  it('lanza BadRequestException si la salida deja el stock negativo', async () => {
    mockTx.limit.mockResolvedValueOnce([{ ...fakeProducto, stock_actual: 2 }]);
    const svc = new MovimientosService();
    await expect(
      svc.registrar('tenant-1', 'user-1', 'prod-1', { tipo: 'salida', cantidad: 5 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lanza NotFoundException si el producto no existe', async () => {
    mockTx.limit.mockResolvedValueOnce([]);
    const svc = new MovimientosService();
    await expect(
      svc.registrar('tenant-1', 'user-1', 'no-existe', { tipo: 'entrada', cantidad: 1 }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('MovimientosService.listar', () => {
  it('devuelve los movimientos de un producto con total', async () => {
    const movs = [{ id: 'mov-1', tipo: 'entrada', cantidad: 5 }];
    mockCountQuery(1, 3);
    mockTx.limit.mockResolvedValueOnce([fakeProducto]);
    mockTx.offset.mockResolvedValueOnce(movs);
    const svc = new MovimientosService();
    const result = await svc.listar('tenant-1', 'prod-1', { pagina: 1, limite: 50 });
    expect(result.items).toEqual(movs);
    expect(result.total).toBe(1);
  });
});
