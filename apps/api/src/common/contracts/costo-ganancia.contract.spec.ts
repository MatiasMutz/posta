import 'reflect-metadata';

/**
 * Contrato de negocio: vendedor nunca recibe costo ni ganancia en respuestas de API.
 *
 * Verifica la cadena JWT → membership → controller → JSON (misma forma que HTTP).
 * Complementa productos.service.spec.ts (solo findAll unitario).
 *
 * Corre con: pnpm --filter api test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { ProductosController } from '../../modules/inventario/productos/productos.controller';
import { ProductosService } from '../../modules/inventario/productos/productos.service';
import { VentasController } from '../../modules/ventas/ventas.controller';
import { verifySupabaseJwt } from '../../modules/auth/guards/jwt-verifier';
import type { TenantUser } from '@posta/shared-types';
import { assertSinCostoNiGanancia } from './assert-sin-costo-ganancia';
import { configurarEnvJwtTest, crearTokenTest } from './jwt-test-token';

const TEST_JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long';
const TEST_SUPABASE_URL = 'https://example.supabase.co';

const fakeProducto = {
  id: 'prod-1',
  tenant_id: 'tenant-1',
  nombre: 'Coca Cola 500ml',
  sku: 'CC500',
  codigo_barras: null,
  costo: '500.00',
  precio: '900.00',
  stock_actual: 10,
  stock_minimo: 5,
  activo: true,
  created_by: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const fakeVenta = {
  id: 'venta-1',
  tenant_id: 'tenant-1',
  cliente_id: null,
  tipo: 'ticket',
  estado: 'facturado',
  metodo_pago: 'efectivo',
  subtotal: '900.00',
  descuento: '0.00',
  total: '900.00',
  observaciones: null,
  cae: '123',
  cae_vencimiento: '2026-12-31',
  numero_comprobante: 1,
  intentos_facturacion: 1,
  created_by: 'user-v',
  created_at: new Date(),
  updated_at: new Date(),
  items: [
    {
      id: 'item-1',
      tenant_id: 'tenant-1',
      venta_id: 'venta-1',
      producto_id: 'prod-1',
      descripcion: 'Coca Cola 500ml',
      cantidad: '1',
      precio_unitario: '900.00',
      subtotal: '900.00',
    },
  ],
};

const mockWithTenant = vi.fn();
const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn(),
};

const mockVentasSvc = {
  findOne: vi.fn(),
  create: vi.fn(),
};

const mockMembership = {
  resolverMembership: vi.fn().mockResolvedValue({
    userId: 'user-v',
    tenantId: 'tenant-1',
    rol: 'vendedor',
  }),
};

vi.mock('../../db', () => ({
  withTenant: (...args: unknown[]) => mockWithTenant(...args),
  db: {},
}));

function mockCountQuery(total = 1) {
  let selectCall = 0;
  mockTx.select.mockImplementation(() => {
    selectCall++;
    if (selectCall === 2) {
      return {
        from: () => ({
          where: () => Promise.resolve([{ total }]),
        }),
      };
    }
    return mockTx;
  });
}

/** Replica JwtGuard: Bearer → payload → TenantUser. */
async function usuarioDesdeJwt(token: string): Promise<TenantUser & { email?: string }> {
  const payload = await verifySupabaseJwt(token, {
    jwtSecret: TEST_JWT_SECRET,
    supabaseUrl: TEST_SUPABASE_URL,
  });
  const tenantIdJwt = payload.app_metadata?.tenant_id as string | undefined;
  const user = await mockMembership.resolverMembership(payload.sub, tenantIdJwt);
  return { ...user, email: payload.email };
}

/** Simula serialización HTTP (JSON round-trip). */
function comoRespuestaHttp<T>(body: T): T {
  return JSON.parse(JSON.stringify(body)) as T;
}

configurarEnvJwtTest();

describe('Contrato costo/ganancia — JWT vendedor', () => {
  const productosCtrl = new ProductosController(
    new ProductosService(),
    { registrar: vi.fn(), listar: vi.fn() } as never,
  );
  const ventasCtrl = new VentasController(mockVentasSvc as never);
  let token: string;
  let vendedor: TenantUser;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockTx.select.mockReturnThis();
    mockWithTenant.mockImplementation((_id: string, cb: (tx: typeof mockTx) => unknown) =>
      cb(mockTx),
    );
    mockMembership.resolverMembership.mockResolvedValue({
      userId: 'user-v',
      tenantId: 'tenant-1',
      rol: 'vendedor',
    });
    mockVentasSvc.findOne.mockResolvedValue(fakeVenta);
    mockVentasSvc.create.mockResolvedValue(fakeVenta);

    token = crearTokenTest({ userId: 'user-v', tenantId: 'tenant-1', rol: 'vendedor' });
    vendedor = await usuarioDesdeJwt(token);
    expect(vendedor.rol).toBe('vendedor');
  });

  it('rechaza request sin Bearer (guardia de contrato)', async () => {
    await expect(usuarioDesdeJwt('')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('GET /inventario/productos no expone costo ni ganancia', async () => {
    mockCountQuery(1);
    mockTx.offset.mockResolvedValueOnce([fakeProducto]);

    const body = comoRespuestaHttp(
      await productosCtrl.findAll(vendedor, { pagina: 1, limite: 50, solo_bajo_stock: false }),
    );

    assertSinCostoNiGanancia(body);
    expect(mockMembership.resolverMembership).toHaveBeenCalledWith('user-v', 'tenant-1');
    expect(body.data[0]).toHaveProperty('precio');
    expect(body.data[0]).not.toHaveProperty('costo');
  });

  it('GET /inventario/productos/:id no expone costo ni ganancia', async () => {
    mockTx.limit.mockResolvedValueOnce([fakeProducto]);

    const body = comoRespuestaHttp(await productosCtrl.findOne(vendedor, 'prod-1'));

    assertSinCostoNiGanancia(body);
    expect(body.data).not.toHaveProperty('costo');
  });

  it('GET /ventas/:id no expone costo ni ganancia', async () => {
    const body = comoRespuestaHttp(await ventasCtrl.findOne(vendedor, 'venta-1'));

    assertSinCostoNiGanancia(body);
  });

  it('POST /ventas no expone costo ni ganancia en la respuesta', async () => {
    const dto = {
      tipo: 'ticket' as const,
      metodo_pago: 'efectivo' as const,
      items: [
        {
          producto_id: '00000000-0000-0000-0000-000000000001',
          descripcion: 'Coca Cola 500ml',
          cantidad: 1,
          precio_unitario: '900.00',
        },
      ],
      descuento: '0.00',
    };

    const body = comoRespuestaHttp(await ventasCtrl.create(vendedor, dto));

    assertSinCostoNiGanancia(body);
    expect(mockVentasSvc.create).toHaveBeenCalledWith('tenant-1', 'user-v', dto);
  });

  it('falla si la respuesta incluyera costo (red de seguridad del assert)', () => {
    expect(() =>
      assertSinCostoNiGanancia({ data: [{ id: 'p1', costo: '100.00' }] }),
    ).toThrow();
  });
});
