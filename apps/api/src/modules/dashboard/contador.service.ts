import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { withTenant } from '../../db';
import { ventas, compras, clientes } from '../../db/schema';
import { fromString, add, toNumericString, ZERO } from '@posta/money';
import { respuestaPaginada } from '../../common/pagination';
import { calcularIvaComprobante, TIPOS_FISCALES } from '../../common/iva';
import type { ContadorResumenQuery, ContadorComprobantesQuery } from '@posta/validation';

const ETIQUETA_TIPO: Record<string, string> = {
  factura_a: 'Factura A',
  factura_b: 'Factura B',
  factura_c: 'Factura C',
  ticket: 'Ticket',
};

function rangoPeriodo(query: { desde?: string; hasta?: string }) {
  const ahora = new Date();
  const desde = query.desde
    ? new Date(`${query.desde}T00:00:00.000Z`)
    : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const hasta = query.hasta
    ? new Date(`${query.hasta}T23:59:59.999Z`)
    : ahora;
  return { desde, hasta };
}

@Injectable()
export class ContadorService {
  async getResumen(tenantId: string, query: ContadorResumenQuery) {
    const { desde, hasta } = rangoPeriodo(query);

    return withTenant(tenantId, async (tx) => {
      const ventasRows = await tx.select({
        tipo: ventas.tipo,
        estado: ventas.estado,
        total: ventas.total,
      })
        .from(ventas)
        .where(and(
          inArray(ventas.tipo, [...TIPOS_FISCALES]),
          gte(ventas.created_at, desde),
          lte(ventas.created_at, hasta),
        ));

      const comprasRows = await tx.select({
        tipo_comprobante: compras.tipo_comprobante,
        total: compras.total,
      })
        .from(compras)
        .where(and(
          inArray(compras.tipo_comprobante, ['factura_a', 'factura_b', 'ticket']),
          gte(compras.created_at, desde),
          lte(compras.created_at, hasta),
        ));

      let netoVentas = ZERO;
      let ivaVentas = ZERO;
      let totalVentas = ZERO;
      let comprobantesFacturados = 0;
      let pendientesCae = 0;

      for (const v of ventasRows) {
        if (v.estado === 'facturado') {
          const { neto, iva } = calcularIvaComprobante(v.tipo, v.total);
          netoVentas = add(netoVentas, fromString(neto));
          ivaVentas = add(ivaVentas, fromString(iva));
          totalVentas = add(totalVentas, fromString(v.total));
          comprobantesFacturados += 1;
        } else if (v.estado === 'pendiente_facturacion' || v.estado === 'error_afip') {
          pendientesCae += 1;
        }
      }

      let netoCompras = ZERO;
      let ivaCompras = ZERO;
      let totalCompras = ZERO;

      for (const c of comprasRows) {
        const { neto, iva } = calcularIvaComprobante(
          c.tipo_comprobante === 'factura_a' ? 'factura_a' : 'factura_b',
          c.total,
        );
        netoCompras = add(netoCompras, fromString(neto));
        ivaCompras = add(ivaCompras, fromString(iva));
        totalCompras = add(totalCompras, fromString(c.total));
      }

      return {
        periodo: {
          desde: desde.toISOString().slice(0, 10),
          hasta: hasta.toISOString().slice(0, 10),
        },
        ventas: {
          neto_gravado: toNumericString(netoVentas),
          iva_debito: toNumericString(ivaVentas),
          total_facturado: toNumericString(totalVentas),
          comprobantes: comprobantesFacturados,
          pendientes_cae: pendientesCae,
        },
        compras: {
          neto_gravado: toNumericString(netoCompras),
          iva_credito: toNumericString(ivaCompras),
          total: toNumericString(totalCompras),
          comprobantes: comprasRows.length,
        },
      };
    });
  }

  async listarComprobantes(tenantId: string, query: ContadorComprobantesQuery) {
    const { desde, hasta } = rangoPeriodo(query);
    const offset = (query.pagina - 1) * query.limite;

    return withTenant(tenantId, async (tx) => {
      const conditions = [
        inArray(ventas.tipo, [...TIPOS_FISCALES]),
        gte(ventas.created_at, desde),
        lte(ventas.created_at, hasta),
      ];

      if (query.estado !== 'todos') {
        conditions.push(eq(ventas.estado, query.estado));
      }

      const where = and(...conditions);

      const [rows, [{ total }]] = await Promise.all([
        tx.select({
          id: ventas.id,
          created_at: ventas.created_at,
          tipo: ventas.tipo,
          estado: ventas.estado,
          numero_comprobante: ventas.numero_comprobante,
          cae: ventas.cae,
          total: ventas.total,
          cliente_nombre: clientes.nombre,
          cliente_cuit: clientes.cuit,
        })
          .from(ventas)
          .leftJoin(clientes, eq(ventas.cliente_id, clientes.id))
          .where(where)
          .orderBy(desc(ventas.created_at))
          .limit(query.limite)
          .offset(offset),
        tx.select({ total: count() }).from(ventas).where(where),
      ]);

      const items = rows.map((v) => {
        const { neto, iva } = calcularIvaComprobante(v.tipo, v.total);
        const fecha = new Date(v.created_at);
        return {
          id: v.id,
          fecha: `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`,
          tipo: ETIQUETA_TIPO[v.tipo] ?? v.tipo,
          tipo_raw: v.tipo,
          estado: v.estado,
          numero_comprobante: v.numero_comprobante,
          cae: v.cae,
          cliente: v.cliente_nombre ?? 'Consumidor final',
          cuit: v.cliente_cuit,
          neto,
          iva,
          total: v.total,
        };
      });

      return respuestaPaginada(items, query.pagina, query.limite, total);
    });
  }
}
