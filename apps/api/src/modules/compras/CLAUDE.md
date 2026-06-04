# Módulo compras (proveedores + compras/gastos)

Responsabilidades: CRUD de proveedores, registro de compras y gastos, saldo acreedor (cuenta corriente pasiva), exportación IVA Compras.

## Reglas críticas

- **Dinero (skill money):** totales con `@posta/money`. Nunca `parseFloat` para aritmética.
- **Stock:** si un ítem tiene `producto_id`, en la misma transacción: entrada de stock, actualización de `costo` al precio de compra, movimiento `entrada`.
- **Gastos:** `categoria = 'gasto'` → ítems sin `producto_id` (validación Zod).
- **saldo_acreedor:** solo `ComprasService.create` cuando `metodo_pago = 'cuenta_corriente'`. No editar desde CRUD de proveedores.
- **Import:** perfil `proveedores` suma `saldo_acreedor` al re-importar (saldos iniciales acumulativos).
- **tenant_id:** siempre de `request.user.tenantId`.

## Endpoints

| Método | Path | Roles |
|---|---|---|
| GET | /proveedores | dueno, contador |
| GET | /proveedores/:id | dueno, contador |
| POST | /proveedores | dueno |
| PATCH | /proveedores/:id | dueno |
| POST | /compras | dueno |
| GET | /compras | dueno, contador |
| GET | /compras/:id | dueno, contador |
| GET | /compras/iva-compras | dueno, contador |

## Exportación IVA Compras

`GET /compras/iva-compras?desde=&hasta=` → `.xlsx` con Fecha, Proveedor, CUIT, Tipo, Categoría, Nro., Neto, IVA 21%, Total.

Solo `factura_a`, `factura_b`, `ticket`. IVA: `total × 21/121`.

## Fase 6 (fuera de alcance)

Pagos a proveedores (bajar `saldo_acreedor`), conciliación de cta. cte. pasiva.
