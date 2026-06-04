import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ImportsService } from './imports.service';

const mockJob = {
  id: 'job-1',
  tenant_id: 't1',
  tipo: 'inventario' as const,
  estado: 'completado',
  filas_ok: 2,
  filas_error: 1,
  errores: [],
};

const mockUpdate = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockResolvedValue(undefined);

const mockWithTenant = vi.fn(async (_tenantId: string, cb: (tx: unknown) => unknown) =>
  cb({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([mockJob]),
    update: mockUpdate,
    set: mockSet,
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'job-1' }]),
  }),
);

vi.mock('../../db', () => ({
  withTenant: (tenantId: string, cb: (tx: unknown) => unknown) => mockWithTenant(tenantId, cb),
}));

const mockSupabase = {
  storage: {
    listBuckets: vi.fn().mockResolvedValue({ data: [{ id: 'imports' }], error: null }),
    from: vi.fn(),
  },
};

const mockQueue = { add: vi.fn().mockResolvedValue(undefined) };

describe('ImportsService.reintentar', () => {
  let service: ImportsService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnThis();
    mockSet.mockReturnThis();
    mockWhere.mockResolvedValue(undefined);
    mockWithTenant.mockImplementation(async (_tenantId: string, cb: (tx: unknown) => unknown) =>
      cb({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockJob]),
        update: mockUpdate,
        set: mockSet,
      }),
    );
    service = new ImportsService(mockSupabase as never, mockQueue as never);
    vi.spyOn(service, 'guardarFilas').mockResolvedValue({ creados: 1, actualizados: 0 });
  });

  it('asocia errores residuales al numero de fila original (no al indice del batch)', async () => {
    const correcciones = [
      { numero: 3, datos: { nombre: 'OK', sku: 'A1', costo: '10', precio: '20', stock: '1' } },
      { numero: 7, datos: { nombre: 'Mal', sku: 'B2', costo: 'abc', precio: '20', stock: '1' } },
    ];

    const result = await service.reintentar('t1', 'u1', 'job-1', correcciones);

    expect(result.importados).toBe(1);
    expect(result.erroresResidual).toBe(1);

    const updatePayload = mockSet.mock.calls[0]?.[0] as { errores: Array<{ numero: number }> };
    expect(updatePayload.errores).toHaveLength(1);
    expect(updatePayload.errores[0]?.numero).toBe(7);
  });

  it('importa varias filas corregidas y deja solo las invalidas en errores', async () => {
    const correcciones = [
      { numero: 2, datos: { nombre: 'A', sku: 'S1', costo: '10', precio: '20', stock: '1' } },
      { numero: 4, datos: { nombre: 'B', sku: 'S2', costo: '10', precio: '20', stock: '1' } },
      { numero: 6, datos: { nombre: 'C', sku: 'S3', costo: 'xyz', precio: '20', stock: '1' } },
    ];

    const result = await service.reintentar('t1', 'u1', 'job-1', correcciones);

    expect(result.importados).toBe(2);
    expect(result.erroresResidual).toBe(1);

    const updatePayload = mockSet.mock.calls[0]?.[0] as { errores: Array<{ numero: number }> };
    expect(updatePayload.errores[0]?.numero).toBe(6);
    expect(service.guardarFilas).toHaveBeenCalledWith('t1', 'u1', 'inventario', expect.any(Array));
  });

  it('marca job como completado cuando no quedan errores', async () => {
    const correcciones = [
      { numero: 5, datos: { nombre: 'Fix', sku: 'FIX1', costo: '10', precio: '20', stock: '1' } },
    ];

    await service.reintentar('t1', 'u1', 'job-1', correcciones);

    const updatePayload = mockSet.mock.calls[0]?.[0] as { estado: string; errores: unknown };
    expect(updatePayload.estado).toBe('completado');
    expect(updatePayload.errores).toBeNull();
  });

  it('lanza NotFoundException si el job no existe', async () => {
    mockWithTenant.mockImplementationOnce(async (_tenantId: string, cb: (tx: unknown) => unknown) =>
      cb({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }),
    );

    await expect(
      service.reintentar('t1', 'u1', 'missing', [{ numero: 1, datos: { nombre: 'X' } }]),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza reintento en job aún en proceso', async () => {
    mockWithTenant.mockImplementationOnce(async (_tenantId: string, cb: (tx: unknown) => unknown) =>
      cb({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ ...mockJob, estado: 'procesando' }]),
      }),
    );

    await expect(
      service.reintentar('t1', 'u1', 'job-1', [{ numero: 1, datos: { nombre: 'X' } }]),
    ).rejects.toThrow(BadRequestException);
  });
});
