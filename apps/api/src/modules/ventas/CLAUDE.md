# Módulo ventas

Responsabilidades: POS (punto de venta), facturación AFIP (via adaptador), historial de ventas, exportación IVA.

## Reglas críticas

- **Dinero (skill money):** subtotales y total se calculan con `@posta/money` (bigint, sin float drift). Nunca `parseFloat` para aritmética; sí para parsear el result de Drizzle NUMERIC cuando sea solo display.
- **Stock:** si `stock_actual < cantidad` solicitada, lanza `BadRequestException` descriptivo. No se permite vender en negativo. El descantar stock ocurre en la misma transacción que la venta (atómico).
- **AFIP (skill afip-adapter):** el dominio llama a `FacturadorElectronico` (interfaz). Si falla → la venta queda `pendiente_facturacion` y se encola reintento en BullMQ (3 intentos exponenciales: 60s, 5min, 15min). Al agotar → `error_afip`.
- **Cta. Cte.:** si `metodo_pago = 'cuenta_corriente'`, se suma el total al `clientes.saldo_deudor` en la misma transacción. **Requiere `cliente_id`** en el body.
- **tenant_id:** siempre de `request.user.tenantId`. Nunca del body.
- **Roles:** vendedor puede crear ventas pero no ver historial ni exportar IVA.

## Endpoints

| Método | Path | Roles |
|---|---|---|
| POST | /ventas | dueno, vendedor |
| GET | /ventas | dueno, contador |
| GET | /ventas/iva-ventas | dueno, contador |
| GET | /ventas/:id | dueno, vendedor, contador |
| POST | /ventas/:id/reintentar-facturacion | dueno |

## Estados de venta

| Estado | Descripción |
|---|---|
| `facturado` | CAE recibido de AFIP |
| `pendiente_facturacion` | AFIP no respondió; hay job encolado |
| `error_afip` | Máximo de reintentos agotados |
| `remito` | Comprobante no fiscal |
| `presupuesto` | Comprobante no fiscal |

## Exportación IVA

`GET /ventas/iva-ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` devuelve `.xlsx` con:
- Fecha, Tipo, Nro. Comprobante, CAE, Estado, Neto gravado, IVA 21%, Total
- Solo incluye `factura_b` y `factura_a` (excluye remitos y presupuestos).
- IVA calculado como `total × 21/121` (IVA incluido en precio).

## Simular caída de AFIP

```bash
AFIP_MOCK_FAIL=true  # estado → pendiente_facturacion, se encola reintento
```
