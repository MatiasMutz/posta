import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientesController } from './clientes.controller';
import type { TenantUser } from '@posta/shared-types';

const mockSvc = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const dueno: TenantUser = { userId: 'u1', tenantId: 'tenant-1', rol: 'dueno' };

beforeEach(() => vi.clearAllMocks());

describe('ClientesController', () => {
  const ctrl = new ClientesController(mockSvc as never);

  it('GET /clientes delega findAll', async () => {
    mockSvc.findAll.mockResolvedValue({ data: [], meta: { pagina: 1, limite: 50, total: 0 } });
    await ctrl.findAll(dueno, { pagina: 1, limite: 50 });
    expect(mockSvc.findAll).toHaveBeenCalledWith('tenant-1', { pagina: 1, limite: 50 });
  });

  it('POST /clientes delega create con userId y envuelve en data', async () => {
    mockSvc.create.mockResolvedValue({ id: 'c1' });
    const dto = { nombre: 'Cliente Test' };
    const result = await ctrl.create(dueno, dto);
    expect(result.data.id).toBe('c1');
    expect(mockSvc.create).toHaveBeenCalledWith('tenant-1', 'u1', dto);
  });
});
