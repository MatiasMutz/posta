import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { FacturadorMock } from '../afip/facturador-mock';
import {
  add,
  fromString,
  isNegative,
  multiply,
  subtract,
  toNumericString,
  ZERO,
} from '@posta/money';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockWithTenant = vi.fn();
vi.mock('../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
}));

const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  orderBy: vi.fn().mockReturnThis(),
  offset: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

const mockQueue = { add: vi.fn().mockResolvedValue({}) };

const fakeVenta = {
  id: 'venta-1',
  tenant_id: 't1',
  tipo: 'factura_b',
  estado: 'facturado',
  metodo_pago: 'efectivo',
  subtotal: '900.00',
  descuento: '0.00',
  total: '900.00',
  cae: 'CAE123',
  numero_comprobante: 1,
  intentos_facturacion: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

function crearServicio(facturadorFalla = false) {
  if (facturadorFalla) process.env.AFIP_MOCK_FAIL = 'true';
  else delete process.env.AFIP_MOCK_FAIL;
  return new VentasService(new FacturadorMock(), mockQueue as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.AFIP_MOCK_FAIL;
  mockTx.select.mockReturnThis();
  mockTx.from.mockReturnThis();
  mockTx.where.mockReturnThis();
  mockTx.limit.mockReturnThis();
  mockTx.orderBy.mockReturnThis();
});

// ── FacturadorMock ─────────────────────────────────────────────────────────

describe('FacturadorMock', () => {
  it('emite CAE cuando AFIP_MOCK_FAIL no está activo', async () => {
    const f = new FacturadorMock();
    const r = await f.emitirComprobante({ ventaId: 'v1', tipo: 'factura_b', total: '1000.00', clienteCuit: null, items: [] });
    expect(r.cae).toBeTruthy();
    expect(r.numeroComprobante).toBeGreaterThan(0);
    expect(r.caeVencimiento > new Date()).toBe(true);
  });

  it('falla con AFIP_MOCK_FAIL=true', async () => {
    process.env.AFIP_MOCK_FAIL = 'true';
    const f = new FacturadorMock();
    await expect(f.emitirComprobante({ ventaId: 'v1', tipo: 'factura_b', total: '100', clienteCuit: null, items: [] }))
      .rejects.toThrow();
  });

  it('genera números de comprobante únicos', async () => {
    const f = new FacturadorMock();
    const r1 = await f.emitirComprobante({ ventaId: 'v1', tipo: 'factura_b', total: '100', clienteCuit: null, items: [] });
    const r2 = await f.emitirComprobante({ ventaId: 'v2', tipo: 'factura_b', total: '100', clienteCuit: null, items: [] });
    expect(r1.numeroComprobante).not.toBe(r2.numeroComprobante);
  });

  it('CAE vence en ~5 días', async () => {
    const f = new FacturadorMock();
    const r = await f.emitirComprobante({ ventaId: 'v3', tipo: 'factura_b', total: '500', clienteCuit: null, items: [] });
    const dias = (r.caeVencimiento.getTime() - Date.now()) / 86_400_000;
    expect(dias).toBeGreaterThan(4);
    expect(dias).toBeLessThan(6);
  });
});

// ── Cálculo de totales (lógica pura, sin DB) ───────────────────────────────

describe('VentasService — cálculo de totales con Money', () => {
  it('no tiene float drift en 0.10 * 3', () => {
    // Validar que el paquete money resuelve correctamente
    const items = [{ precio_unitario: '0.10', cantidad: 3 }];
    const subtotal = items.reduce(
      (acc, i) => add(acc, multiply(fromString(i.precio_unitario), i.cantidad)),
      ZERO,
    );
    expect(toNumericString(subtotal)).toBe('0.30');
  });

  it('descuento mayor al subtotal detectado con isNegative', () => {
    const total = subtract(fromString('100.00'), fromString('200.00'));
    expect(isNegative(total)).toBe(true);
  });

  it('cuenta corriente suma saldo correctamente con Money', () => {
    const saldoActual = fromString('500.00');
    const nuevaVenta = fromString('300.00');
    expect(toNumericString(add(saldoActual, nuevaVenta))).toBe('800.00');
  });
});

// ── VentasService.create — validaciones de entrada ─────────────────────────

describe('VentasService.create — validaciones', () => {
  it('lanza BadRequestException cuando descuento > subtotal', async () => {
    const svc = crearServicio();
    // El check de Money ocurre antes de tocar la DB
    await expect(
      svc.create('t1', 'u1', {
        tipo: 'factura_b',
        metodo_pago: 'efectivo',
        descuento: '500.00',
        items: [{ descripcion: 'X', cantidad: 1, precio_unitario: '100.00' }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lanza BadRequestException si stock insuficiente', async () => {
    const svc = crearServicio();
    // withTenant invoca el callback; dentro, limit() devuelve producto con stock 0
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.returning.mockResolvedValueOnce([{ ...fakeVenta, tipo: 'factura_b' }]); // venta
      mockTx.limit.mockResolvedValueOnce([{ id: 'prod-1', nombre: 'Test', stock_actual: 0, activo: true }]); // stock check
      return cb(mockTx);
    });

    await expect(
      svc.create('t1', 'u1', {
        tipo: 'factura_b',
        metodo_pago: 'efectivo',
        descuento: '0',
        items: [{ producto_id: 'prod-1', descripcion: 'X', cantidad: 5, precio_unitario: '100.00' }],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

// ── VentasService.create — flujo AFIP ─────────────────────────────────────

describe('VentasService.create — AFIP', () => {
  it('encola reintento cuando AFIP falla', async () => {
    const svc = crearServicio(true); // AFIP falla

    // withTenant para la transacción principal
    mockWithTenant.mockImplementationOnce((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.returning.mockResolvedValueOnce([fakeVenta]);
      return cb(mockTx);
    });
    // withTenant para update estado (intentos_facturacion) dentro de intentarFacturacion
    mockWithTenant.mockImplementationOnce(() => Promise.resolve());
    // withTenant para findOne (venta)
    mockWithTenant.mockImplementationOnce(() => Promise.resolve([fakeVenta]));
    // withTenant para findOne (items)
    mockWithTenant.mockImplementationOnce(() => Promise.resolve([]));

    await svc.create('t1', 'u1', {
      tipo: 'factura_b',
      metodo_pago: 'efectivo',
      descuento: '0',
      items: [{ descripcion: 'X', cantidad: 1, precio_unitario: '100.00' }],
    });

    expect(mockQueue.add).toHaveBeenCalledWith(
      'reintentar',
      expect.objectContaining({ ventaId: 'venta-1' }),
      expect.anything(),
    );
  });

  it('no encola ni llama AFIP para remitos', async () => {
    const svc = crearServicio();

    // Transacción principal
    mockWithTenant.mockImplementationOnce((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.returning.mockResolvedValueOnce([{ ...fakeVenta, tipo: 'remito', estado: 'remito' }]);
      return cb(mockTx);
    });
    // findOne venta
    mockWithTenant.mockImplementationOnce(() => Promise.resolve([{ ...fakeVenta, tipo: 'remito', estado: 'remito' }]));
    // findOne items
    mockWithTenant.mockImplementationOnce(() => Promise.resolve([]));

    await svc.create('t1', 'u1', {
      tipo: 'remito',
      metodo_pago: 'efectivo',
      descuento: '0',
      items: [{ descripcion: 'X', cantidad: 1, precio_unitario: '50.00' }],
    });

    expect(mockQueue.add).not.toHaveBeenCalled();
  });
});

// ── VentasService.reintentar ───────────────────────────────────────────────

describe('VentasService.reintentar', () => {
  it('lanza NotFoundException si la venta no existe', async () => {
    const svc = crearServicio();
    mockWithTenant.mockResolvedValueOnce([]); // select venta → vacío
    await expect(svc.reintentar('t1', 'no-existe')).rejects.toThrow(NotFoundException);
  });

  it('lanza BadRequestException si ya está facturada', async () => {
    const svc = crearServicio();
    mockWithTenant.mockResolvedValueOnce([{ ...fakeVenta, estado: 'facturado' }]);
    await expect(svc.reintentar('t1', 'venta-1')).rejects.toThrow(BadRequestException);
  });

  it('factura exitosamente desde pendiente_facturacion', async () => {
    const svc = crearServicio();
    mockWithTenant
      .mockResolvedValueOnce([{ ...fakeVenta, estado: 'pendiente_facturacion', intentos_facturacion: 1 }]) // select venta
      .mockResolvedValueOnce([]) // select items
      .mockResolvedValueOnce(undefined); // update venta

    const result = await svc.reintentar('t1', 'venta-1');
    expect(result.facturado).toBe(true);
    expect(result.cae).toBeTruthy();
  });

  it('marca como error_afip cuando AFIP sigue fallando', async () => {
    process.env.AFIP_MOCK_FAIL = 'true';
    const svc = crearServicio(true);
    mockWithTenant
      .mockResolvedValueOnce([{ ...fakeVenta, estado: 'pendiente_facturacion', intentos_facturacion: 2 }])
      .mockResolvedValueOnce([]) // items
      .mockResolvedValueOnce(undefined); // update error_afip

    await expect(svc.reintentar('t1', 'venta-1')).rejects.toThrow(BadRequestException);
    // Verifica que se actualiza a error_afip
    expect(mockWithTenant).toHaveBeenCalledTimes(3);
  });
});

// ── VentasService.findAll ──────────────────────────────────────────────────

describe('VentasService.findAll', () => {
  it('devuelve lista paginada', async () => {
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) => {
      mockTx.offset.mockResolvedValueOnce([fakeVenta]);
      mockTx.select
        .mockReturnValueOnce(mockTx)
        .mockReturnValueOnce({
          from: () => ({ where: () => Promise.resolve([{ total: 1 }]) }),
        });
      return cb(mockTx);
    });

    const svc = crearServicio();
    const result = await svc.findAll('t1', { pagina: 1, limite: 50 });
    expect(result.data).toHaveLength(1);
    expect(result.meta?.pagina).toBe(1);
  });
});
