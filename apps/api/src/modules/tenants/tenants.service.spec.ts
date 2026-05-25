import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantsService } from './tenants.service';
import { NotFoundException } from '@nestjs/common';

const fakeTenant = { id: 'tenant-1', nombre: 'Mi Negocio', created_at: new Date() };

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe('TenantsService.getTenantActual', () => {
  it('devuelve el tenant del usuario autenticado', async () => {
    mockDb.limit.mockResolvedValueOnce([fakeTenant]);
    const svc = new TenantsService(mockDb as any);
    const result = await svc.getTenantActual('tenant-1');
    expect(result).toEqual(fakeTenant);
  });

  it('lanza NotFoundException si no existe el tenant', async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const svc = new TenantsService(mockDb as any);
    await expect(svc.getTenantActual('no-existe')).rejects.toThrow(NotFoundException);
  });
});
