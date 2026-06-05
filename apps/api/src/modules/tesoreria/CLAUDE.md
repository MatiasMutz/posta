# Módulo tesorería (caja + pagos cta. cte.)

Responsabilidades: caja chica (apertura/cierre), movimientos manuales, cobros a clientes, pagos a proveedores, flujo de caja.

## Reglas críticas

- **Dinero (skill money):** montos con `@posta/money`. Nunca `parseFloat` para aritmética.
- **saldo_deudor:** solo baja en `PagosService.registrarPagoCliente`. Validar `monto <= saldo_deudor`.
- **saldo_acreedor:** solo baja en `PagosService.registrarPagoProveedor`. Validar `monto <= saldo_acreedor`.
- **Sesión única:** un tenant solo puede tener una sesión `abierta` a la vez (índice parcial único).
- **Movimientos de caja:** ventas/compras se calculan dinámicamente desde sus tablas; ingresos/egresos/pagos se persisten en `movimientos_caja`.
- **tenant_id:** siempre de `request.user.tenantId`.

## Endpoints

| Método | Path | Roles |
|---|---|---|
| GET | /tesoreria/caja | dueno, contador |
| POST | /tesoreria/caja/apertura | dueno |
| POST | /tesoreria/caja/cierre | dueno |
| POST | /tesoreria/caja/movimientos | dueno |
| GET | /tesoreria/caja/movimientos | dueno, contador |
| GET | /tesoreria/flujo-caja | dueno, contador |
| GET | /tesoreria/pagos/cuentas-corrientes | dueno, contador |
| POST | /tesoreria/pagos/cliente | dueno |
| POST | /tesoreria/pagos/proveedor | dueno |

## Flujo de caja

`GET /tesoreria/flujo-caja?desde=&hasta=` devuelve totales en lenguaje claro:
facturación bruta, cobros recibidos, pagos realizados, costo de mercadería, IVA estimado, dinero neto.

## Roles

- **Dueño:** acceso total (abrir/cerrar caja, movimientos, pagos).
- **Contador:** solo lectura (estado caja, flujo, cuentas corrientes).
- **Vendedor:** bloqueado en API y web.
