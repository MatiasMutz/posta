import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VentasController } from './ventas.controller';
import type { TenantUser } from '@posta/shared-types';

const mockSvc = {
  create: vi.fn(),
  findAll: vi.fn(),
  findOne: vi.fn(),
  exportarIvaVentas: vi.fn(),
  reintentarManual: vi.fn(),
};

const dueno: TenantUser = { userId: 'u1', tenantId: 'tenant-1', rol: 'dueno' };

beforeEach(() => vi.clearAllMocks());

describe('VentasController', () => {
  const ctrl = new VentasController(mockSvc as never);

  it('POST /ventas delega create con tenant y user', async () => {
    mockSvc.create.mockResolvedValue({ id: 'v1' });
    const dto = {
      items: [{ producto_id: 'p1', cantidad: 1, precio_unitario: '100.00', descripcion: 'Item' }],
      tipo: 'factura_b' as const,
      metodo_pago: 'efectivo' as const,
      descuento: '0.00',
    };
    const result = await ctrl.create(dueno, dto);
    expect(result.data.id).toBe('v1');
    expect(mockSvc.create).toHaveBeenCalledWith('tenant-1', 'u1', dto);
  });

  it('GET /ventas delega findAll', async () => {
    mockSvc.findAll.mockResolvedValue({ data: [], meta: { pagina: 1, limite: 50, total: 0 } });
    await ctrl.findAll(dueno, { pagina: 1, limite: 50 });
    expect(mockSvc.findAll).toHaveBeenCalledWith('tenant-1', { pagina: 1, limite: 50 });
  });

  it('GET /ventas/:id delega findOne y envuelve en data', async () => {
    mockSvc.findOne.mockResolvedValue({ id: 'v1' });
    const result = await ctrl.findOne(dueno, 'v1');
    expect(result.data.id).toBe('v1');
    expect(mockSvc.findOne).toHaveBeenCalledWith('tenant-1', 'v1');
  });
});
