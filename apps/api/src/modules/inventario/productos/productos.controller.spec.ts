import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductosController } from './productos.controller';
import type { TenantUser } from '@posta/shared-types';

const mockSvc = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};
const mockMovSvc = { registrar: vi.fn(), listar: vi.fn() };

const dueno: TenantUser = { userId: 'u1', tenantId: 'tenant-1', rol: 'dueno' };

beforeEach(() => vi.clearAllMocks());

describe('ProductosController', () => {
  const ctrl = new ProductosController(mockSvc as any, mockMovSvc as any);

  it('GET /inventario/productos devuelve data y meta', async () => {
    mockSvc.findAll.mockResolvedValue({ items: [{ id: 'p1' }], total: 1 });
    const result = await ctrl.findAll(dueno, { pagina: 1, limite: 50, solo_bajo_stock: false });
    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({ pagina: 1, limite: 50, total: 1 });
    expect(mockSvc.findAll).toHaveBeenCalledWith('tenant-1', expect.anything(), 'dueno');
  });

  it('POST /inventario/productos crea un producto', async () => {
    mockSvc.create.mockResolvedValue({ id: 'p-new' });
    const dto = { nombre: 'Test', costo: '100.00', precio: '200.00', stock_inicial: 0, stock_minimo: 0 };
    const result = await ctrl.create(dueno, dto);
    expect(result.data.id).toBe('p-new');
  });

  it('POST /inventario/productos/:id/movimientos registra un movimiento', async () => {
    mockMovSvc.registrar.mockResolvedValue({ id: 'mov-1', tipo: 'entrada' });
    const result = await ctrl.registrarMovimiento(dueno, 'prod-1', { tipo: 'entrada', cantidad: 5 });
    expect(result.data.tipo).toBe('entrada');
  });

  it('PATCH /inventario/productos/:id actualiza producto', async () => {
    mockSvc.update.mockResolvedValue({ id: 'p1', nombre: 'Nuevo' });
    const result = await ctrl.update(dueno, 'p1', { nombre: 'Nuevo' });
    expect(result.data.nombre).toBe('Nuevo');
  });

  it('DELETE /inventario/productos/:id hace soft-delete', async () => {
    mockSvc.remove.mockResolvedValue(undefined);
    const result = await ctrl.remove(dueno, 'p1');
    expect(result).toEqual({ data: null });
  });
});
