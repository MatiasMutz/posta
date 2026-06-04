import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';

const mockWithTenant = vi.fn();
vi.mock('../../../db', () => ({
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

const fakeProveedor = {
  id: 'prov-1',
  tenant_id: 'tenant-1',
  nombre: 'Distribuidora SA',
  email: 'prov@example.com',
  telefono: '1122334455',
  cuit: '30123456789',
  direccion: null,
  saldo_acreedor: '0.00',
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

describe('ProveedoresService.findOne', () => {
  it('devuelve el proveedor si existe', async () => {
    mockTx.limit.mockResolvedValueOnce([fakeProveedor]);
    const svc = new ProveedoresService();
    const result = await svc.findOne('tenant-1', 'prov-1');
    expect(result.nombre).toBe('Distribuidora SA');
  });

  it('lanza NotFoundException si no existe', async () => {
    mockTx.limit.mockResolvedValueOnce([]);
    const svc = new ProveedoresService();
    await expect(svc.findOne('tenant-1', 'no-existe')).rejects.toThrow(NotFoundException);
  });
});
