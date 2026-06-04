import { describe, it, expect, vi } from 'vitest';
import { ComprasController } from './compras.controller';

const mockService = {
  create: vi.fn(),
  findAll: vi.fn(),
  findOne: vi.fn(),
  exportarIvaCompras: vi.fn().mockResolvedValue(Buffer.from('xlsx')),
};

describe('ComprasController', () => {
  it('findAll delega al servicio', async () => {
    const ctrl = new ComprasController(mockService as never);
    const user = { userId: 'u1', tenantId: 't1', rol: 'contador' as const };
    mockService.findAll.mockResolvedValue({ data: [] });
    await ctrl.findAll(user, { pagina: 1, limite: 50 });
    expect(mockService.findAll).toHaveBeenCalledWith('t1', { pagina: 1, limite: 50 });
  });
});
