import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantsController } from './tenants.controller';
import type { TenantUser } from '@posta/shared-types';

const mockTenantsService = {
  getTenantActual: vi.fn(),
};

const fakeUser: TenantUser = { userId: 'u1', tenantId: 'tenant-1', rol: 'dueno' };

beforeEach(() => vi.clearAllMocks());

describe('TenantsController', () => {
  const ctrl = new TenantsController(mockTenantsService as any);

  it('GET /tenants/me devuelve el tenant del usuario autenticado', async () => {
    const tenant = { id: 'tenant-1', nombre: 'Mi Negocio', created_at: new Date() };
    mockTenantsService.getTenantActual.mockResolvedValue(tenant);
    const result = await ctrl.getTenantActual(fakeUser);
    expect(result.data).toEqual(tenant);
    expect(mockTenantsService.getTenantActual).toHaveBeenCalledWith(fakeUser.tenantId);
  });
});
