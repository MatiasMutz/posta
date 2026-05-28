import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantsService } from './tenants.service';
import { NotFoundException } from '@nestjs/common';

const fakeTenant = { id: 'tenant-1', nombre: 'Mi Negocio', created_at: new Date() };

const mockWithTenant = vi.fn();

vi.mock('../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
}));

beforeEach(() => vi.clearAllMocks());

describe('TenantsService.getTenantActual', () => {
  it('devuelve el tenant del usuario autenticado', async () => {
    mockWithTenant.mockImplementationOnce((_id: string, cb: (tx: unknown) => unknown) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([fakeTenant]),
      };
      return cb(mockTx);
    });
    const svc = new TenantsService();
    const result = await svc.getTenantActual('tenant-1');
    expect(result).toEqual(fakeTenant);
  });

  it('lanza NotFoundException si no existe el tenant', async () => {
    mockWithTenant.mockImplementationOnce((_id: string, cb: (tx: unknown) => unknown) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      };
      return cb(mockTx);
    });
    const svc = new TenantsService();
    await expect(svc.getTenantActual('no-existe')).rejects.toThrow(NotFoundException);
  });
});
