# Módulo clientes

Responsabilidades: CRUD de clientes, saldo deudor (cuenta corriente activa).

## Reglas críticas

- **Roles:** lectura (GET) → dueno, vendedor, contador. Escritura (POST, PATCH) → dueno.
- **saldo_deudor:** se actualiza atómicamente en `VentasService.create` cuando `metodo_pago = 'cuenta_corriente'`. Nunca modificar directamente desde este módulo; es un efecto de las ventas.
- **Soft delete:** no implementado aún — si se agrega, debe ser `activo = false`.
- **tenant_id:** siempre de `request.user.tenantId`, nunca del body.

## Endpoints

| Método | Path | Roles |
|---|---|---|
| GET | /clientes | dueno, vendedor, contador |
| GET | /clientes/:id | dueno, vendedor, contador |
| POST | /clientes | dueno |
| PATCH | /clientes/:id | dueno |

## Cuenta corriente

El `saldo_deudor` en la tabla `clientes` representa lo que el cliente nos debe. Se incrementa cuando se hace una venta con `metodo_pago = 'cuenta_corriente'`. Las cancelaciones (pagos del cliente) se registran en `PagosService.registrarPagoCliente` (módulo tesorería).
