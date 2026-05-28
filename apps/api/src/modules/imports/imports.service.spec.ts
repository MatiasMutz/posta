import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { ImportsService } from './imports.service';

const mockSupabase = {
  storage: {
    listBuckets: vi.fn().mockResolvedValue({ data: [{ id: 'imports' }], error: null }),
    from: vi.fn().mockReturnValue({
      download: vi.fn().mockResolvedValue({
        data: new Blob(['a,b\n1,2']),
        error: null,
      }),
      createSignedUploadUrl: vi.fn(),
    }),
  },
};

const mockQueue = { add: vi.fn().mockResolvedValue(undefined) };

vi.mock('../../db', () => ({
  withTenant: vi.fn(async (_tenantId: string, cb: (tx: unknown) => unknown) =>
    cb({
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'job-1' }]),
    }),
  ),
}));

describe('ImportsService — storagePath', () => {
  let service: ImportsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ImportsService(mockSupabase as never, mockQueue as never);
  });

  it('analizar rechaza storagePath de otro tenant', async () => {
    await expect(
      service.analizar('tenant-a', {
        storagePath: 'tenant-b/archivo.csv',
        tipo: 'inventario',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('crear rechaza storagePath de otro tenant', async () => {
    await expect(
      service.crear('tenant-a', 'user-1', {
        storagePath: 'tenant-b/archivo.csv',
        tipo: 'clientes',
        columnMap: [{ headerArchivo: 'Nombre', campo: 'nombre' }],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('descargarArchivo rechaza storagePath de otro tenant', async () => {
    await expect(
      service.descargarArchivo('tenant-a', 'tenant-b/archivo.csv'),
    ).rejects.toThrow(ForbiddenException);
  });
});
