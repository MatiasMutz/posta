import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContadorService } from './contador.service';

const mockWithTenant = vi.fn();
vi.mock('../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
}));

const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockTx.select.mockReturnThis();
  mockTx.from.mockReturnThis();
  mockTx.where.mockReturnThis();
  mockTx.leftJoin.mockReturnThis();
  mockTx.orderBy.mockReturnThis();
  mockTx.limit.mockReturnThis();
  mockTx.offset.mockReturnThis();
});

describe('ContadorService — resumen fiscal', () => {
  it('suma neto e IVA solo de ventas facturadas', async () => {
    const svc = new ContadorService();
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.where
        .mockResolvedValueOnce([
          { tipo: 'factura_b', estado: 'facturado', total: '1210.00' },
          { tipo: 'factura_b', estado: 'pendiente_facturacion', total: '500.00' },
        ])
        .mockResolvedValueOnce([
          { tipo_comprobante: 'factura_a', total: '2420.00' },
        ]);
      return cb(mockTx);
    });

    const res = await svc.getResumen('t1', {});
    expect(res.ventas.neto_gravado).toBe('1000.00');
    expect(res.ventas.iva_debito).toBe('210.00');
    expect(res.ventas.comprobantes).toBe(1);
    expect(res.ventas.pendientes_cae).toBe(1);
    expect(res.compras.neto_gravado).toBe('2000.00');
    expect(res.compras.iva_credito).toBe('420.00');
  });
});

describe('ContadorService — comprobantes paginados', () => {
  it('mapea filas con neto e IVA', async () => {
    const svc = new ContadorService();
    const created = new Date('2026-03-15T14:30:00.000Z');

    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      let selectCall = 0;
      mockTx.select.mockImplementation(() => {
        selectCall += 1;
        return mockTx;
      });
      mockTx.offset.mockResolvedValue([{
        id: 'v1',
        created_at: created,
        tipo: 'factura_b',
        estado: 'facturado',
        numero_comprobante: 42,
        cae: '12345678901234',
        total: '1210.00',
        cliente_nombre: 'Cliente Test',
        cliente_cuit: '20123456789',
      }]);
      mockTx.where.mockImplementation(() => {
        if (selectCall >= 2) {
          return Promise.resolve([{ total: 1 }]);
        }
        return mockTx;
      });
      return cb(mockTx);
    });

    const res = await svc.listarComprobantes('t1', { pagina: 1, limite: 20, estado: 'todos' });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].neto).toBe('1000.00');
    expect(res.data[0].iva).toBe('210.00');
    expect(res.meta?.total).toBe(1);
  });
});
