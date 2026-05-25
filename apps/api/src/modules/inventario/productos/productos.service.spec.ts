import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductosService } from './productos.service';
import { NotFoundException } from '@nestjs/common';

const fakeProducto = {
  id: 'prod-1',
  tenant_id: 'tenant-1',
  nombre: 'Coca Cola 500ml',
  sku: 'CC500',
  codigo_barras: null,
  costo: '500.00',
  precio: '900.00',
  stock_actual: 10,
  stock_minimo: 5,
  activo: true,
  created_at: new Date(),
  updated_at: new Date(),
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

describe('ProductosService.findAll', () => {
  it('devuelve lista de productos para el tenant', async () => {
    mockCountQuery(1);
    mockTx.offset.mockResolvedValueOnce([fakeProducto]);
    const svc = new ProductosService();
    const result = await svc.findAll('tenant-1', { pagina: 1, limite: 50, solo_bajo_stock: false });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].nombre).toBe('Coca Cola 500ml');
    expect(result.total).toBe(1);
  });

  it('oculta costo para vendedor', async () => {
    mockCountQuery(1);
    mockTx.offset.mockResolvedValueOnce([fakeProducto]);
    const svc = new ProductosService();
    const result = await svc.findAll('tenant-1', { pagina: 1, limite: 50, solo_bajo_stock: false }, 'vendedor');
    expect(result.items[0]).not.toHaveProperty('costo');
    expect(result.items[0]).toHaveProperty('precio');
  });

  it('incluye costo para dueño', async () => {
    mockCountQuery(1);
    mockTx.offset.mockResolvedValueOnce([fakeProducto]);
    const svc = new ProductosService();
    const result = await svc.findAll('tenant-1', { pagina: 1, limite: 50, solo_bajo_stock: false }, 'dueno');
    expect(result.items[0]).toHaveProperty('costo');
  });
});

describe('ProductosService.findOne', () => {
  it('devuelve el producto si existe', async () => {
    mockTx.limit.mockResolvedValueOnce([fakeProducto]);
    const svc = new ProductosService();
    const result = await svc.findOne('tenant-1', 'prod-1');
    expect(result.id).toBe('prod-1');
  });

  it('lanza NotFoundException si no existe', async () => {
    mockTx.limit.mockResolvedValueOnce([]);
    const svc = new ProductosService();
    await expect(svc.findOne('tenant-1', 'no-existe')).rejects.toThrow(NotFoundException);
  });
});

describe('ProductosService.create', () => {
  it('crea un producto y registra movimiento inicial si stock > 0', async () => {
    mockTx.returning
      .mockResolvedValueOnce([{ ...fakeProducto, stock_actual: 10 }]) // insert producto
      .mockResolvedValueOnce([{ id: 'mov-1' }]); // insert movimiento

    const svc = new ProductosService();
    const result = await svc.create('tenant-1', 'user-1', {
      nombre: 'Coca Cola 500ml',
      sku: 'CC500',
      costo: '500.00',
      precio: '900.00',
      stock_inicial: 10,
      stock_minimo: 5,
    });
    expect(result.stock_actual).toBe(10);
    // Dos inserts: producto + movimiento de entrada inicial
    expect(mockTx.returning).toHaveBeenCalledTimes(2);
  });

  it('crea producto sin movimiento si stock_inicial es 0', async () => {
    mockTx.returning.mockResolvedValueOnce([{ ...fakeProducto, stock_actual: 0 }]);
    const svc = new ProductosService();
    await svc.create('tenant-1', 'user-1', {
      nombre: 'Test',
      costo: '100.00',
      precio: '200.00',
      stock_inicial: 0,
      stock_minimo: 0,
    });
    expect(mockTx.returning).toHaveBeenCalledTimes(1);
  });
});

describe('ProductosService.update', () => {
  it('actualiza un producto existente', async () => {
    mockTx.limit.mockResolvedValueOnce([fakeProducto]);
    mockTx.returning.mockResolvedValueOnce([{ ...fakeProducto, nombre: 'Coca Cola 1L' }]);
    const svc = new ProductosService();
    const result = await svc.update('tenant-1', 'prod-1', { nombre: 'Coca Cola 1L' });
    expect(result.nombre).toBe('Coca Cola 1L');
  });

  it('lanza NotFoundException si el producto no existe', async () => {
    mockTx.limit.mockResolvedValueOnce([]);
    const svc = new ProductosService();
    await expect(svc.update('tenant-1', 'no-existe', { nombre: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('ProductosService.remove', () => {
  it('hace soft-delete (activo = false)', async () => {
    mockTx.limit.mockResolvedValueOnce([fakeProducto]);
    mockTx.returning.mockResolvedValueOnce([{ ...fakeProducto, activo: false }]);
    const svc = new ProductosService();
    await svc.remove('tenant-1', 'prod-1');
    expect(mockTx.set).toHaveBeenCalledWith(expect.objectContaining({ activo: false }));
  });
});
