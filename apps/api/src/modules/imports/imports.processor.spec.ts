import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportsProcessor } from './imports.processor';

const mockService = {
  descargarArchivo: vi.fn(),
  parsearArchivo: vi.fn(),
  aplicarMapeo: vi.fn(),
  procesarFilas: vi.fn(),
  guardarFilas: vi.fn(),
};

const mockWithTenant = vi.fn();

vi.mock('../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
}));

describe('ImportsProcessor', () => {
  let processor: ImportsProcessor;

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new ImportsProcessor(mockService as never);
    mockWithTenant.mockImplementation(async (_tenantId: string, cb: (tx: unknown) => unknown) => {
      const tx = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      return cb(tx);
    });
    mockService.descargarArchivo.mockResolvedValue(Buffer.from('a,b\n1,2'));
    mockService.parsearArchivo.mockReturnValue([{ a: '1', b: '2' }]);
    mockService.aplicarMapeo.mockReturnValue([{ nombre: 'Test' }]);
    mockService.procesarFilas.mockReturnValue({
      validas: [{ nombre: 'Test' }],
      invalidas: [],
    });
    mockService.guardarFilas.mockResolvedValue({ creados: 1, actualizados: 0 });
  });

  it('procesa job de clientes y marca completado', async () => {
    const job = {
      data: {
        tenantId: 't1',
        userId: 'u1',
        jobId: 'job-1',
        storagePath: 't1/file.csv',
        tipo: 'clientes' as const,
        columnMap: { nombre: 'nombre' },
      },
      updateProgress: vi.fn(),
    };

    await processor.process(job as never);

    expect(mockService.descargarArchivo).toHaveBeenCalledWith('t1', 't1/file.csv');
    expect(mockService.guardarFilas).toHaveBeenCalledWith('t1', 'u1', 'clientes', [{ nombre: 'Test' }]);
    expect(mockWithTenant).toHaveBeenCalled();
    expect(job.updateProgress).toHaveBeenCalledWith(100);
  });

  it('marca error en el job si falla el parseo', async () => {
    mockService.parsearArchivo.mockImplementation(() => {
      throw new Error('Archivo corrupto');
    });

    const job = {
      data: {
        tenantId: 't1',
        userId: 'u1',
        jobId: 'job-2',
        storagePath: 't1/bad.csv',
        tipo: 'inventario' as const,
        columnMap: {},
      },
      updateProgress: vi.fn(),
    };

    await expect(processor.process(job as never)).rejects.toThrow('Archivo corrupto');
    expect(mockWithTenant).toHaveBeenCalled();
  });
});
