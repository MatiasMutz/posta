import { Injectable } from '@nestjs/common';
import {
  and, count, desc, eq, gt, gte, lte, notInArray, sql, sum,
} from 'drizzle-orm';
import { withTenant } from '../../db';
import {
  ventas, itemsVenta, productos, clientes, sesionesCaja,
} from '../../db/schema';
import {
  fromString, add, subtract, multiply, multiplyRatio, toNumericString, ZERO,
} from '@posta/money';
import { CajaService } from '../tesoreria/caja/caja.service';
import type { DashboardQuery } from '@posta/validation';
import type { TenantUser } from '@posta/shared-types';

const TIPOS_NO_VENTA = ['presupuesto', 'remito'] as const;

function inicioDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function finDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function inicioMes(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function etiquetaDia(iso: string): string {
  const d = new Date(iso);
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${dias[d.getDay()]} ${d.getDate()}`;
}

@Injectable()
export class DashboardService {
  constructor(private readonly cajaService: CajaService) {}

  async getResumen(tenantId: string, user: TenantUser, query: DashboardQuery, tenantNombre: string) {
    const ahora = new Date();
    const hoyInicio = inicioDia(ahora);
    const hoyFin = finDia(ahora);
    const ayerInicio = inicioDia(new Date(ahora.getTime() - 86_400_000));
    const ayerFin = finDia(new Date(ahora.getTime() - 86_400_000));
    const mesInicio = inicioMes(ahora);
    const graficoDesde = new Date(hoyInicio.getTime() - (query.dias_grafico - 1) * 86_400_000);

    const baseVentas = notInArray(ventas.tipo, [...TIPOS_NO_VENTA]);

    const data = await withTenant(tenantId, async (tx) => {
      const [ventasHoyRow] = await tx.select({ total: sum(ventas.total) })
        .from(ventas)
        .where(and(baseVentas, gte(ventas.created_at, hoyInicio), lte(ventas.created_at, hoyFin)));

      const [ventasAyerRow] = await tx.select({ total: sum(ventas.total) })
        .from(ventas)
        .where(and(baseVentas, gte(ventas.created_at, ayerInicio), lte(ventas.created_at, ayerFin)));

      const [ventasMesRow] = await tx.select({ total: sum(ventas.total) })
        .from(ventas)
        .where(and(baseVentas, gte(ventas.created_at, mesInicio), lte(ventas.created_at, hoyFin)));

      const ventasPorDia = await tx.select({
        dia: sql<string>`date_trunc('day', ${ventas.created_at})::date`.as('dia'),
        total: sum(ventas.total),
      })
        .from(ventas)
        .where(and(baseVentas, gte(ventas.created_at, graficoDesde), lte(ventas.created_at, hoyFin)))
        .groupBy(sql`date_trunc('day', ${ventas.created_at})`)
        .orderBy(sql`date_trunc('day', ${ventas.created_at})`);

      const topProductos = await tx.select({
        producto_id: itemsVenta.producto_id,
        nombre: sql<string>`COALESCE(${productos.nombre}, ${itemsVenta.descripcion})`.as('nombre'),
        cantidad: sum(itemsVenta.cantidad),
        monto: sum(itemsVenta.subtotal),
      })
        .from(itemsVenta)
        .innerJoin(ventas, eq(itemsVenta.venta_id, ventas.id))
        .leftJoin(productos, eq(itemsVenta.producto_id, productos.id))
        .where(and(
          baseVentas,
          gte(ventas.created_at, hoyInicio),
          lte(ventas.created_at, hoyFin),
        ))
        .groupBy(itemsVenta.producto_id, productos.nombre, itemsVenta.descripcion)
        .orderBy(sql`sum(${itemsVenta.subtotal}) desc`)
        .limit(5);

      const horariosPico = await tx.select({
        hora: sql<number>`extract(hour from ${ventas.created_at})::int`.as('hora'),
        cantidad: count(),
        total: sum(ventas.total),
      })
        .from(ventas)
        .where(and(baseVentas, gte(ventas.created_at, mesInicio), lte(ventas.created_at, hoyFin)))
        .groupBy(sql`extract(hour from ${ventas.created_at})`)
        .orderBy(sql`count(*) desc`)
        .limit(5);

      const itemsConCosto = await tx.select({
        subtotal: itemsVenta.subtotal,
        cantidad: itemsVenta.cantidad,
        costo: productos.costo,
      })
        .from(itemsVenta)
        .innerJoin(ventas, eq(itemsVenta.venta_id, ventas.id))
        .innerJoin(productos, eq(itemsVenta.producto_id, productos.id))
        .where(and(
          baseVentas,
          gte(ventas.created_at, mesInicio),
          lte(ventas.created_at, hoyFin),
        ));

      const [cuentasRow] = await tx.select({ total: sum(clientes.saldo_deudor) })
        .from(clientes)
        .where(and(eq(clientes.activo, true), gt(clientes.saldo_deudor, '0')));

      const [clientesDeudaRow] = await tx.select({ total: count() })
        .from(clientes)
        .where(and(eq(clientes.activo, true), gt(clientes.saldo_deudor, '0')));

      const clientesConSaldo = await tx.select({
        id: clientes.id,
        nombre: clientes.nombre,
        saldo: clientes.saldo_deudor,
      })
        .from(clientes)
        .where(and(eq(clientes.activo, true), gt(clientes.saldo_deudor, '0')))
        .orderBy(desc(clientes.saldo_deudor))
        .limit(5);

      const stockBajo = await tx.select({
        id: productos.id,
        nombre: productos.nombre,
        sku: productos.sku,
        stock_actual: productos.stock_actual,
        stock_minimo: productos.stock_minimo,
      })
        .from(productos)
        .where(and(
          eq(productos.activo, true),
          lte(productos.stock_actual, productos.stock_minimo),
          gt(productos.stock_minimo, 0),
        ))
        .orderBy(productos.stock_actual)
        .limit(8);

      const [stockBajoCount] = await tx.select({ total: count() })
        .from(productos)
        .where(and(
          eq(productos.activo, true),
          lte(productos.stock_actual, productos.stock_minimo),
          gt(productos.stock_minimo, 0),
        ));

      const [sesionAbierta] = await tx.select()
        .from(sesionesCaja)
        .where(and(eq(sesionesCaja.tenant_id, tenantId), eq(sesionesCaja.estado, 'abierta')))
        .limit(1);

      let gananciaMes = ZERO;
      for (const item of itemsConCosto) {
        const costoLinea = multiply(fromString(item.costo), Number(item.cantidad));
        gananciaMes = add(gananciaMes, subtract(fromString(item.subtotal), costoLinea));
      }

      return {
        ventasHoy: ventasHoyRow?.total ?? '0',
        ventasAyer: ventasAyerRow?.total ?? '0',
        ventasMes: ventasMesRow?.total ?? '0',
        ventasPorDia,
        topProductos,
        horariosPico,
        gananciaMes: toNumericString(gananciaMes),
        cuentasACobrar: cuentasRow?.total ?? '0',
        clientesConDeuda: Number(clientesDeudaRow?.total ?? 0),
        clientesConSaldo,
        stockBajo,
        stockBajoCount: Number(stockBajoCount?.total ?? 0),
        sesionAbierta,
      };
    });

    const cajaEstado = await this.cajaService.getEstado(tenantId);

    const ventasHoyMoney = fromString(data.ventasHoy);
    const ventasAyerMoney = fromString(data.ventasAyer);
    let variacionHoy: string | null = null;
    if (ventasAyerMoney > 0n) {
      const diff = subtract(ventasHoyMoney, ventasAyerMoney);
      const pct = Number(diff * 10000n / ventasAyerMoney) / 100;
      variacionHoy = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    }

    const diasMap = new Map(data.ventasPorDia.map((r) => [String(r.dia), r.total ?? '0']));
    const ventasUltimosDias = Array.from({ length: query.dias_grafico }, (_, i) => {
      const d = new Date(graficoDesde.getTime() + i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      const esHoy = d.toDateString() === ahora.toDateString();
      return {
        dia: key,
        etiqueta: etiquetaDia(d.toISOString()),
        total: diasMap.get(key) ?? '0',
        es_hoy: esHoy,
      };
    });

    const alertas: Array<{ tipo: string; titulo: string; descripcion: string; tono: 'ok' | 'warn' | 'err' }> = [];

    if (data.sesionAbierta) {
      alertas.push({
        tipo: 'caja',
        titulo: 'Caja abierta',
        descripcion: `Turno activo desde ${new Date(data.sesionAbierta.abierta_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
        tono: 'ok',
      });
    } else {
      alertas.push({
        tipo: 'caja',
        titulo: 'Caja cerrada',
        descripcion: 'Abrí la caja del día para registrar movimientos.',
        tono: 'warn',
      });
    }

    for (const p of data.stockBajo.slice(0, 3)) {
      alertas.push({
        tipo: 'stock',
        titulo: 'Stock bajo',
        descripcion: `${p.nombre}${p.sku ? ` · ${p.sku}` : ''} · ${p.stock_actual} u. (mínimo ${p.stock_minimo})`,
        tono: 'warn',
      });
    }

    if (data.clientesConDeuda > 0) {
      alertas.push({
        tipo: 'deuda',
        titulo: 'Cuentas a cobrar',
        descripcion: `${data.clientesConDeuda} cliente${data.clientesConDeuda === 1 ? '' : 's'} con saldo pendiente`,
        tono: 'err',
      });
    }

    const diasMes = ahora.getDate();
    const promedioDiario = diasMes > 0
      ? toNumericString(multiplyRatio(fromString(data.ventasMes), 1n, BigInt(diasMes)))
      : '0';

    return {
      saludo: {
        email: user.email ?? '',
        tenant_nombre: tenantNombre,
        fecha: ahora.toISOString(),
      },
      kpis: {
        ventas_hoy: data.ventasHoy,
        ventas_ayer: data.ventasAyer,
        variacion_hoy: variacionHoy,
        ventas_mes: data.ventasMes,
        promedio_diario_mes: promedioDiario,
        saldo_caja: cajaEstado.saldo_actual,
        caja_abierta: !!data.sesionAbierta,
        cuentas_a_cobrar: data.cuentasACobrar,
        clientes_con_deuda: data.clientesConDeuda,
        ganancia_estimada_mes: data.gananciaMes,
        productos_stock_bajo: data.stockBajoCount,
      },
      ventas_ultimos_dias: ventasUltimosDias,
      top_productos_hoy: data.topProductos.map((p) => ({
        producto_id: p.producto_id,
        nombre: p.nombre,
        cantidad: String(p.cantidad ?? '0'),
        monto: p.monto ?? '0',
      })),
      horarios_pico: data.horariosPico.map((h) => ({
        hora: h.hora,
        cantidad: Number(h.cantidad),
        total: h.total ?? '0',
      })),
      alertas,
      cuentas_corrientes: data.clientesConSaldo.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        saldo: c.saldo,
      })),
      stock_bajo: data.stockBajo.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        sku: p.sku,
        stock_actual: p.stock_actual,
        stock_minimo: p.stock_minimo,
      })),
    };
  }
}
