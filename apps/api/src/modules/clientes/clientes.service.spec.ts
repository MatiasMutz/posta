import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ClientesService } from './clientes.service';

const mockWithTenant = vi.fn();
vi.mock('../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
}));

const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  offset: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

const fakeCliente = {
  id: 'cliente-1',
  tenant_id: 'tenant-1',
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  telefono: '1122334455',
  cuit: '20123456789',
  direccion: 'Calle 123',
  saldo_deudor: '0.00',
  activo: true,
  created_at: new Date(),
  updated_at: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => cb(mockTx));
  mockTx.select.mockReturnThis();
  mockTx.from.mockReturnThis();
  mockTx.where.mockReturnThis();
  mockTx.limit.mockReturnThis();
  mockTx.orderBy.mockReturnThis();
});

describe('ClientesService.findAll', () => {
  it('devuelve lista paginada de clientes activos', async () => {
    let selectCall = 0;
    mockTx.select.mockImplementation(() => {
      selectCall++;
      if (selectCall === 2) {
        return { from: () => ({ where: () => Promise.resolve([{ total: 1 }]) }) };
      }
      return mockTx;
    });
    mockTx.offset.mockResolvedValueOnce([fakeCliente]);

    const svc = new ClientesService();
    const result = await svc.findAll('tenant-1', { pagina: 1, limite: 50 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].nombre).toBe('Juan Pérez');
    expect(result.meta?.total).toBe(1);
  });
});

describe('ClientesService.findOne', () => {
  it('devuelve el cliente si existe y está activo', async () => {
    mockTx.limit.mockResolvedValueOnce([fakeCliente]);
    const svc = new ClientesService();
    const result = await svc.findOne('tenant-1', 'cliente-1');
    expect(result.id).toBe('cliente-1');
  });

  it('lanza NotFoundException si no existe', async () => {
    mockTx.limit.mockResolvedValueOnce([]);
    const svc = new ClientesService();
    await expect(svc.findOne('tenant-1', 'no-existe')).rejects.toThrow(NotFoundException);
  });

  it('lanza NotFoundException si está inactivo', async () => {
    mockTx.limit.mockResolvedValueOnce([{ ...fakeCliente, activo: false }]);
    const svc = new ClientesService();
    await expect(svc.findOne('tenant-1', 'cliente-1')).rejects.toThrow(NotFoundException);
  });
});

describe('ClientesService.create', () => {
  it('crea un cliente nuevo', async () => {
    mockTx.returning.mockResolvedValueOnce([fakeCliente]);
    const svc = new ClientesService();
    const result = await svc.create('tenant-1', 'user-1', {
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      cuit: '20123456789',
    });
    expect(result.nombre).toBe('Juan Pérez');
    expect(mockTx.values).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Juan Pérez', tenant_id: 'tenant-1', created_by: 'user-1' }),
    );
  });
});

describe('ClientesService.update', () => {
  it('actualiza campos del cliente', async () => {
    mockTx.limit.mockResolvedValueOnce([fakeCliente]);
    mockTx.returning.mockResolvedValueOnce([{ ...fakeCliente, nombre: 'Juan García' }]);
    const svc = new ClientesService();
    const result = await svc.update('tenant-1', 'cliente-1', { nombre: 'Juan García' });
    expect(result.nombre).toBe('Juan García');
  });

  it('lanza NotFoundException si el cliente no existe', async () => {
    mockTx.limit.mockResolvedValueOnce([]);
    const svc = new ClientesService();
    await expect(svc.update('tenant-1', 'no-existe', { nombre: 'X' })).rejects.toThrow(NotFoundException);
  });
});
