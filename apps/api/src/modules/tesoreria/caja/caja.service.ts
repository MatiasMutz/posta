import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, gte, lte, ne, sql, sum } from 'drizzle-orm';
import { withTenant } from '../../../db';
import {
  sesionesCaja, movimientosCaja, ventas, compras, itemsCompra,
  pagosCliente, pagosProveedor,
} from '../../../db/schema';
import {
  fromString, add, subtract, multiplyRatio, toNumericString, ZERO,
} from '@posta/money';
import { respuestaPaginada } from '../../../common/pagination';
import type {
  AperturaCajaDto, CierreCajaDto, MovimientoCajaDto, FlujoCajaQuery, ListMovimientosCajaQuery,
} from '@posta/validation';

export interface TotalesSesion {
  ventas: string;
  compras: string;
  ingresos: string;
  egresos: string;
  pagos_cliente: string;
  pagos_proveedor: string;
  por_metodo: Record<string, string>;
}

type Tx = Parameters<Parameters<typeof withTenant>[1]>[0];

@Injectable()
export class CajaService {
  async getEstado(tenantId: string) {
    return withTenant(tenantId, async (tx) => {
      const [sesion] = await tx.select()
        .from(sesionesCaja)
        .where(and(eq(sesionesCaja.tenant_id, tenantId), eq(sesionesCaja.estado, 'abierta')))
        .limit(1);

      if (!sesion) {
        return { sesion: null, saldo_actual: '0', totales: null, movimientos: [] };
      }

      const totales = await this.calcularTotalesSesion(tx, tenantId, sesion);
      const saldoActual = this.calcularSaldoActual(sesion.monto_apertura, totales);

      const movimientos = await tx.select()
        .from(movimientosCaja)
        .where(eq(movimientosCaja.sesion_caja_id, sesion.id))
        .orderBy(desc(movimientosCaja.created_at))
        .limit(50);

      const movimientosVentas = await this.obtenerMovimientosVentas(tx, tenantId, sesion.abierta_at);
      const movimientosCompras = await this.obtenerMovimientosCompras(tx, tenantId, sesion.abierta_at);

      const todosMovimientos = [
        ...movimientosVentas,
        ...movimientosCompras,
        ...movimientos.map((m) => ({
          id: m.id,
          tipo: m.tipo,
          metodo_pago: m.metodo_pago,
          monto: m.monto,
          concepto: m.concepto,
          created_at: m.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return {
        sesion,
        saldo_actual: saldoActual,
        totales,
        movimientos: todosMovimientos,
      };
    });
  }

  async abrir(tenantId: string, userId: string, dto: AperturaCajaDto) {
    const monto = fromString(dto.monto_apertura);
    if (monto <= 0n) {
      throw new BadRequestException('El monto de apertura debe ser mayor a cero.');
    }

    return withTenant(tenantId, async (tx) => {
      const [existente] = await tx.select()
        .from(sesionesCaja)
        .where(and(eq(sesionesCaja.tenant_id, tenantId), eq(sesionesCaja.estado, 'abierta')))
        .limit(1);

      if (existente) {
        throw new BadRequestException('Ya hay una caja abierta. Cerrala antes de abrir una nueva.');
      }

      const [sesion] = await tx.insert(sesionesCaja).values({
        tenant_id: tenantId,
        estado: 'abierta',
        monto_apertura: dto.monto_apertura,
        created_by: userId,
      }).returning();

      return sesion;
    });
  }

  async cerrar(tenantId: string, dto: CierreCajaDto) {
    return withTenant(tenantId, async (tx) => {
      const [sesion] = await tx.select()
        .from(sesionesCaja)
        .where(and(eq(sesionesCaja.tenant_id, tenantId), eq(sesionesCaja.estado, 'abierta')))
        .limit(1);

      if (!sesion) {
        throw new NotFoundException('No hay una caja abierta para cerrar.');
      }

      const totales = await this.calcularTotalesSesion(tx, tenantId, sesion);
      const montoEsperado = this.calcularSaldoActual(sesion.monto_apertura, totales);
      const diferencia = toNumericString(subtract(fromString(dto.monto_cierre), fromString(montoEsperado)));

      const [cerrada] = await tx.update(sesionesCaja)
        .set({
          estado: 'cerrada',
          monto_cierre: dto.monto_cierre,
          monto_esperado: montoEsperado,
          diferencia,
          observaciones: dto.observaciones ?? null,
          cerrada_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(sesionesCaja.id, sesion.id))
        .returning();

      return cerrada;
    });
  }

  async registrarMovimiento(tenantId: string, userId: string, dto: MovimientoCajaDto) {
    const montoMoney = fromString(dto.monto);
    if (montoMoney <= 0n) {
      throw new BadRequestException('El monto debe ser mayor a cero.');
    }

    const montoSigned = dto.tipo === 'egreso'
      ? toNumericString(subtract(ZERO, montoMoney))
      : dto.monto;

    return withTenant(tenantId, async (tx) => {
      const sesion = await this.requireSesionAbierta(tx, tenantId);

      const [mov] = await tx.insert(movimientosCaja).values({
        tenant_id: tenantId,
        sesion_caja_id: sesion.id,
        tipo: dto.tipo,
        monto: montoSigned,
        concepto: dto.concepto,
        created_by: userId,
      }).returning();

      return mov;
    });
  }

  async listarMovimientos(tenantId: string, query: ListMovimientosCajaQuery) {
    return withTenant(tenantId, async (tx) => {
      const [sesion] = await tx.select()
        .from(sesionesCaja)
        .where(and(eq(sesionesCaja.tenant_id, tenantId), eq(sesionesCaja.estado, 'abierta')))
        .limit(1);

      if (!sesion) {
        return respuestaPaginada([], query.pagina, query.limite, 0);
      }

      const offset = (query.pagina - 1) * query.limite;
      const where = eq(movimientosCaja.sesion_caja_id, sesion.id);

      const [items, [{ total }]] = await Promise.all([
        tx.select()
          .from(movimientosCaja)
          .where(where)
          .orderBy(desc(movimientosCaja.created_at))
          .limit(query.limite)
          .offset(offset),
        tx.select({ total: count() }).from(movimientosCaja).where(where),
      ]);

      return respuestaPaginada(items, query.pagina, query.limite, total);
    });
  }

  async flujoCaja(tenantId: string, query: FlujoCajaQuery) {
    const ahora = new Date();
    const desde = query.desde
      ? new Date(`${query.desde}T00:00:00.000Z`)
      : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const hasta = query.hasta
      ? new Date(`${query.hasta}T23:59:59.999Z`)
      : ahora;

    return withTenant(tenantId, async (tx) => {
      const ventasPeriodo = await tx.select({
        total: ventas.total,
        metodo_pago: ventas.metodo_pago,
        tipo: ventas.tipo,
        estado: ventas.estado,
      })
        .from(ventas)
        .where(and(gte(ventas.created_at, desde), lte(ventas.created_at, hasta)));

      const comprasPeriodo = await tx.select({
        total: compras.total,
        metodo_pago: compras.metodo_pago,
      })
        .from(compras)
        .where(and(gte(compras.created_at, desde), lte(compras.created_at, hasta)));

      const [costoRow] = await tx.select({
        total: sum(itemsCompra.subtotal),
      })
        .from(itemsCompra)
        .innerJoin(compras, eq(itemsCompra.compra_id, compras.id))
        .where(and(
          gte(compras.created_at, desde),
          lte(compras.created_at, hasta),
          sql`${itemsCompra.producto_id} IS NOT NULL`,
        ));

      let facturacionBruta = ZERO;
      let cobrosRecibidos = ZERO;
      let ivaEstimado = ZERO;

      for (const v of ventasPeriodo) {
        facturacionBruta = add(facturacionBruta, fromString(v.total));
        if (v.metodo_pago !== 'cuenta_corriente') {
          cobrosRecibidos = add(cobrosRecibidos, fromString(v.total));
        }
        if (['factura_a', 'factura_b', 'ticket'].includes(v.tipo) && v.estado === 'facturado') {
          ivaEstimado = add(ivaEstimado, multiplyRatio(fromString(v.total), 21n, 121n));
        }
      }

      let pagosRealizados = ZERO;
      for (const c of comprasPeriodo) {
        if (c.metodo_pago !== 'cuenta_corriente') {
          pagosRealizados = add(pagosRealizados, fromString(c.total));
        }
      }

      const pagosCli = await tx.select({ monto: pagosCliente.monto })
        .from(pagosCliente)
        .where(and(gte(pagosCliente.created_at, desde), lte(pagosCliente.created_at, hasta)));

      const pagosProv = await tx.select({ monto: pagosProveedor.monto })
        .from(pagosProveedor)
        .where(and(gte(pagosProveedor.created_at, desde), lte(pagosProveedor.created_at, hasta)));

      for (const p of pagosCli) {
        cobrosRecibidos = add(cobrosRecibidos, fromString(p.monto));
      }
      for (const p of pagosProv) {
        pagosRealizados = add(pagosRealizados, fromString(p.monto));
      }

      const costoMercaderia = fromString(costoRow?.total ?? '0');
      const dineroNeto = subtract(cobrosRecibidos, add(pagosRealizados, costoMercaderia));

      return {
        periodo: { desde: desde.toISOString(), hasta: hasta.toISOString() },
        facturacion_bruta: toNumericString(facturacionBruta),
        cobros_recibidos: toNumericString(cobrosRecibidos),
        pagos_realizados: toNumericString(pagosRealizados),
        costo_mercaderia: toNumericString(costoMercaderia),
        iva_estimado: toNumericString(ivaEstimado),
        dinero_neto: toNumericString(dineroNeto),
      };
    });
  }

  private calcularSaldoActual(montoApertura: string, totales: TotalesSesion): string {
    let saldo = fromString(montoApertura);
    saldo = add(saldo, fromString(totales.ventas));
    saldo = add(saldo, fromString(totales.ingresos));
    saldo = add(saldo, fromString(totales.pagos_cliente));
    saldo = subtract(saldo, fromString(totales.compras));
    saldo = subtract(saldo, fromString(totales.egresos));
    saldo = subtract(saldo, fromString(totales.pagos_proveedor));
    return toNumericString(saldo);
  }

  private async calcularTotalesSesion(
    tx: Tx,
    tenantId: string,
    sesion: { id: string; abierta_at: Date },
  ): Promise<TotalesSesion> {
    const desde = sesion.abierta_at;

    const ventasRows = await tx.select({ total: ventas.total, metodo_pago: ventas.metodo_pago })
      .from(ventas)
      .where(and(
        eq(ventas.tenant_id, tenantId),
        gte(ventas.created_at, desde),
        ne(ventas.metodo_pago, 'cuenta_corriente'),
      ));

    const comprasRows = await tx.select({ total: compras.total })
      .from(compras)
      .where(and(
        eq(compras.tenant_id, tenantId),
        gte(compras.created_at, desde),
        ne(compras.metodo_pago, 'cuenta_corriente'),
      ));

    const movRows = await tx.select({
      tipo: movimientosCaja.tipo,
      monto: movimientosCaja.monto,
      metodo_pago: movimientosCaja.metodo_pago,
    })
      .from(movimientosCaja)
      .where(eq(movimientosCaja.sesion_caja_id, sesion.id));

    let totalVentas = ZERO;
    const porMetodo: Record<string, ReturnType<typeof fromString>> = {};

    for (const v of ventasRows) {
      const m = fromString(v.total);
      totalVentas = add(totalVentas, m);
      porMetodo[v.metodo_pago] = add(porMetodo[v.metodo_pago] ?? ZERO, m);
    }

    let totalCompras = ZERO;
    for (const c of comprasRows) {
      totalCompras = add(totalCompras, fromString(c.total));
    }

    let ingresos = ZERO;
    let egresos = ZERO;
    let pagosClienteTotal = ZERO;
    let pagosProveedorTotal = ZERO;

    for (const m of movRows) {
      const amt = fromString(m.monto);
      if (m.tipo === 'ingreso') {
        ingresos = add(ingresos, amt);
        if (m.metodo_pago) {
          porMetodo[m.metodo_pago] = add(porMetodo[m.metodo_pago] ?? ZERO, amt);
        }
      } else if (m.tipo === 'egreso') {
        egresos = add(egresos, subtract(ZERO, amt));
      } else if (m.tipo === 'pago_cliente') {
        pagosClienteTotal = add(pagosClienteTotal, amt);
        if (m.metodo_pago) {
          porMetodo[m.metodo_pago] = add(porMetodo[m.metodo_pago] ?? ZERO, amt);
        }
      } else if (m.tipo === 'pago_proveedor') {
        pagosProveedorTotal = add(pagosProveedorTotal, subtract(ZERO, amt));
      }
    }

    const porMetodoStr: Record<string, string> = {};
    for (const [k, v] of Object.entries(porMetodo)) {
      porMetodoStr[k] = toNumericString(v);
    }

    return {
      ventas: toNumericString(totalVentas),
      compras: toNumericString(totalCompras),
      ingresos: toNumericString(ingresos),
      egresos: toNumericString(egresos),
      pagos_cliente: toNumericString(pagosClienteTotal),
      pagos_proveedor: toNumericString(pagosProveedorTotal),
      por_metodo: porMetodoStr,
    };
  }

  private async obtenerMovimientosVentas(tx: Tx, tenantId: string, desde: Date) {
    const rows = await tx.select({
      id: ventas.id,
      total: ventas.total,
      metodo_pago: ventas.metodo_pago,
      created_at: ventas.created_at,
    })
      .from(ventas)
      .where(and(
        eq(ventas.tenant_id, tenantId),
        gte(ventas.created_at, desde),
        ne(ventas.metodo_pago, 'cuenta_corriente'),
      ))
      .orderBy(desc(ventas.created_at))
      .limit(50);

    return rows.map((v) => ({
      id: v.id,
      tipo: 'venta' as const,
      metodo_pago: v.metodo_pago,
      monto: v.total,
      concepto: `Venta #${v.id.slice(0, 8)}`,
      created_at: v.created_at,
    }));
  }

  private async obtenerMovimientosCompras(tx: Tx, tenantId: string, desde: Date) {
    const rows = await tx.select({
      id: compras.id,
      total: compras.total,
      metodo_pago: compras.metodo_pago,
      created_at: compras.created_at,
    })
      .from(compras)
      .where(and(
        eq(compras.tenant_id, tenantId),
        gte(compras.created_at, desde),
        ne(compras.metodo_pago, 'cuenta_corriente'),
      ))
      .orderBy(desc(compras.created_at))
      .limit(50);

    return rows.map((c) => ({
      id: c.id,
      tipo: 'compra' as const,
      metodo_pago: c.metodo_pago,
      monto: toNumericString(subtract(ZERO, fromString(c.total))),
      concepto: `Compra #${c.id.slice(0, 8)}`,
      created_at: c.created_at,
    }));
  }

  private async requireSesionAbierta(tx: Tx, tenantId: string) {
    const [sesion] = await tx.select()
      .from(sesionesCaja)
      .where(and(eq(sesionesCaja.tenant_id, tenantId), eq(sesionesCaja.estado, 'abierta')))
      .limit(1);

    if (!sesion) {
      throw new BadRequestException('No hay una caja abierta. Abrí la caja antes de registrar movimientos.');
    }
    return sesion;
  }
}
