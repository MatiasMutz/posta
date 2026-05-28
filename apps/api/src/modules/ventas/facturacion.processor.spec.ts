import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FacturacionProcessor } from './facturacion.processor';

const mockReintentarAutomatico = vi.fn();
const mockWithTenant = vi.fn();

vi.mock('../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
}));

describe('FacturacionProcessor', () => {
  let processor: FacturacionProcessor;

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new FacturacionProcessor({
      reintentarAutomatico: mockReintentarAutomatico,
    } as never);
    mockWithTenant.mockResolvedValue(undefined);
  });

  it('llama reintentarAutomatico en éxito', async () => {
    mockReintentarAutomatico.mockResolvedValue({ facturado: true, cae: 'CAE1' });

    await processor.process({
      data: { tenantId: 't1', ventaId: 'v1' },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as never);

    expect(mockReintentarAutomatico).toHaveBeenCalledWith('t1', 'v1');
    expect(mockWithTenant).not.toHaveBeenCalled();
  });

  it('no marca error_afip en intentos intermedios', async () => {
    mockReintentarAutomatico.mockRejectedValue(new Error('AFIP caído'));

    await expect(
      processor.process({
        data: { tenantId: 't1', ventaId: 'v1' },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as never),
    ).rejects.toThrow('AFIP caído');

    expect(mockWithTenant).not.toHaveBeenCalled();
  });

  it('marca error_afip en el último intento fallido', async () => {
    mockReintentarAutomatico.mockRejectedValue(new Error('AFIP caído'));

    await expect(
      processor.process({
        data: { tenantId: 't1', ventaId: 'v1' },
        attemptsMade: 2,
        opts: { attempts: 3 },
      } as never),
    ).rejects.toThrow('AFIP caído');

    expect(mockWithTenant).toHaveBeenCalledWith('t1', expect.any(Function));
  });
});
