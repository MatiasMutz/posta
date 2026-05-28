import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportsController } from './imports.controller';
import type { TenantUser } from '@posta/shared-types';

const mockSvc = {
  generarUrlSubida: vi.fn(),
  analizar: vi.fn(),
  crear: vi.fn(),
  estado: vi.fn(),
  reintentar: vi.fn(),
};

const dueno: TenantUser = { userId: 'u1', tenantId: 'tenant-1', rol: 'dueno' };

beforeEach(() => vi.clearAllMocks());

describe('ImportsController', () => {
  const ctrl = new ImportsController(mockSvc as never);

  it('GET /imports/upload-url delega generarUrlSubida', async () => {
    mockSvc.generarUrlSubida.mockResolvedValue({ uploadUrl: 'https://x', storagePath: 't/f.csv' });
    await ctrl.uploadUrl(dueno, { filename: 'datos.csv', tipo: 'inventario' });
    expect(mockSvc.generarUrlSubida).toHaveBeenCalledWith('tenant-1', 'datos.csv');
  });

  it('POST /imports delega crear job', async () => {
    mockSvc.crear.mockResolvedValue({ jobId: 'job-1' });
    const dto = {
      storagePath: 't/x.csv',
      tipo: 'clientes' as const,
      columnMap: [{ headerArchivo: 'Nombre', campo: 'nombre' }],
    };
    const result = await ctrl.crear(dueno, dto);
    expect(result.data.jobId).toBe('job-1');
    expect(mockSvc.crear).toHaveBeenCalledWith('tenant-1', 'u1', dto);
  });
});
