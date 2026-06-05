import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { withTenant } from '../../../db';
import {
  clientes, proveedores, sesionesCaja, movimientosCaja,
  pagosCliente, pagosProveedor,
} from '../../../db/schema';
import {
  fromString, subtract, toNumericString, ZERO, isNegative,
} from '@posta/money';
import type { PagoClienteDto, PagoProveedorDto } from '@posta/validation';

type Tx = Parameters<Parameters<typeof withTenant>[1]>[0];

@Injectable()
export class PagosService {
  async registrarPagoCliente(tenantId: string, userId: string, dto: PagoClienteDto) {
    const montoMoney = fromString(dto.monto);
    if (montoMoney <= 0n) {
      throw new BadRequestException('El monto debe ser mayor a cero.');
    }

    return withTenant(tenantId, async (tx) => {
      const [cliente] = await tx.select()
        .from(clientes)
        .where(eq(clientes.id, dto.cliente_id))
        .limit(1);

      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado.');
      }

      const saldoMoney = fromString(cliente.saldo_deudor);
      if (isNegative(subtract(saldoMoney, montoMoney))) {
        throw new BadRequestException('El monto supera el saldo deudor del cliente.');
      }

      const [pago] = await tx.insert(pagosCliente).values({
        tenant_id: tenantId,
        cliente_id: dto.cliente_id,
        monto: dto.monto,
        metodo_pago: dto.metodo_pago,
        observaciones: dto.observaciones ?? null,
        created_by: userId,
      }).returning();

      const nuevoSaldo = toNumericString(subtract(saldoMoney, montoMoney));
      await tx.update(clientes)
        .set({ saldo_deudor: nuevoSaldo, updated_at: new Date() })
        .where(eq(clientes.id, dto.cliente_id));

      await this.registrarMovimientoCajaPago(
        tx, tenantId, userId, 'pago_cliente', dto.monto, dto.metodo_pago,
        `Cobro a ${cliente.nombre}`, pago.id, null,
      );

      return { ...pago, saldo_deudor_nuevo: nuevoSaldo };
    });
  }

  async registrarPagoProveedor(tenantId: string, userId: string, dto: PagoProveedorDto) {
    const montoMoney = fromString(dto.monto);
    if (montoMoney <= 0n) {
      throw new BadRequestException('El monto debe ser mayor a cero.');
    }

    return withTenant(tenantId, async (tx) => {
      const [prov] = await tx.select()
        .from(proveedores)
        .where(eq(proveedores.id, dto.proveedor_id))
        .limit(1);

      if (!prov) {
        throw new NotFoundException('Proveedor no encontrado.');
      }

      const saldoMoney = fromString(prov.saldo_acreedor);
      if (isNegative(subtract(saldoMoney, montoMoney))) {
        throw new BadRequestException('El monto supera el saldo acreedor del proveedor.');
      }

      const [pago] = await tx.insert(pagosProveedor).values({
        tenant_id: tenantId,
        proveedor_id: dto.proveedor_id,
        monto: dto.monto,
        metodo_pago: dto.metodo_pago,
        observaciones: dto.observaciones ?? null,
        created_by: userId,
      }).returning();

      const nuevoSaldo = toNumericString(subtract(saldoMoney, montoMoney));
      await tx.update(proveedores)
        .set({ saldo_acreedor: nuevoSaldo, updated_at: new Date() })
        .where(eq(proveedores.id, dto.proveedor_id));

      await this.registrarMovimientoCajaPago(
        tx, tenantId, userId, 'pago_proveedor', dto.monto, dto.metodo_pago,
        `Pago a ${prov.nombre}`, null, pago.id,
      );

      return { ...pago, saldo_acreedor_nuevo: nuevoSaldo };
    });
  }

  async listarCuentasCorrientes(tenantId: string) {
    return withTenant(tenantId, async (tx) => {
      const clientesConSaldo = await tx.select({
        id: clientes.id,
        nombre: clientes.nombre,
        saldo: clientes.saldo_deudor,
        tipo: sql<'cliente'>`'cliente'`.as('tipo'),
      })
        .from(clientes)
        .where(and(eq(clientes.activo, true), gt(clientes.saldo_deudor, '0')))
        .orderBy(desc(clientes.saldo_deudor))
        .limit(20);

      const proveedoresConSaldo = await tx.select({
        id: proveedores.id,
        nombre: proveedores.nombre,
        saldo: proveedores.saldo_acreedor,
        tipo: sql<'proveedor'>`'proveedor'`.as('tipo'),
      })
        .from(proveedores)
        .where(and(eq(proveedores.activo, true), gt(proveedores.saldo_acreedor, '0')))
        .orderBy(desc(proveedores.saldo_acreedor))
        .limit(20);

      return {
        clientes: clientesConSaldo.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          saldo: c.saldo,
          tipo: 'cliente' as const,
        })),
        proveedores: proveedoresConSaldo.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          saldo: p.saldo,
          tipo: 'proveedor' as const,
        })),
      };
    });
  }

  private async registrarMovimientoCajaPago(
    tx: Tx,
    tenantId: string,
    userId: string,
    tipo: 'pago_cliente' | 'pago_proveedor',
    monto: string,
    metodoPago: string,
    concepto: string,
    pagoClienteId: string | null,
    pagoProveedorId: string | null,
  ) {
    const [sesion] = await tx.select()
      .from(sesionesCaja)
      .where(and(eq(sesionesCaja.tenant_id, tenantId), eq(sesionesCaja.estado, 'abierta')))
      .limit(1);

    if (!sesion) return;

    const montoSigned = tipo === 'pago_proveedor'
      ? toNumericString(subtract(ZERO, fromString(monto)))
      : monto;

    await tx.insert(movimientosCaja).values({
      tenant_id: tenantId,
      sesion_caja_id: sesion.id,
      tipo,
      metodo_pago: metodoPago as 'efectivo' | 'debito' | 'credito' | 'transferencia',
      monto: montoSigned,
      concepto,
      pago_cliente_id: pagoClienteId,
      pago_proveedor_id: pagoProveedorId,
      created_by: userId,
    });
  }
}
