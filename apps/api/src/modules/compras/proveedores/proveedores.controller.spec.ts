import { describe, it, expect, vi } from 'vitest';
import { ProveedoresController } from './proveedores.controller';

const mockService = {
  findAll: vi.fn().mockResolvedValue({ data: [], meta: { pagina: 1, limite: 50, total: 0 } }),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

describe('ProveedoresController', () => {
  it('findAll delega al servicio', async () => {
    const ctrl = new ProveedoresController(mockService as never);
    const user = { userId: 'u1', tenantId: 't1', rol: 'dueno' as const };
    await ctrl.findAll(user, { pagina: 1, limite: 50 });
    expect(mockService.findAll).toHaveBeenCalledWith('t1', { pagina: 1, limite: 50 });
  });
});
