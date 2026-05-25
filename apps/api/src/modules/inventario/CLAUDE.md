# Módulo inventario

Responsabilidades: gestión de productos y trazabilidad de stock.

## Reglas críticas

- **Dinero (skill money):** `costo` y `precio` son NUMERIC en la BD; en la app viajan como `string`. Nunca usar `parseFloat`. Usar `APrice` en el front.
- **Rol vendedor:** nunca recibe `costo` en la respuesta. Implementado en `ProductosService.findAll` y `findOne` stripeando la columna según `rol`.
- **Stock negativo:** `MovimientosService.registrar` lanza `BadRequestException` si una salida deja el stock < 0.
- **Soft delete:** los productos no se eliminan físicamente; `activo = false`. Los movimientos son inmutables (sin UPDATE ni DELETE).
- **tenant_id:** siempre proviene de `request.user.tenantId` (JwtGuard). Nunca aceptarlo del body o params.
- **Paginación (skill `paginacion`):** listados devuelven `{ data, meta: { pagina, limite, total } }`. En el web usar `APaginacion` bajo la tabla.

## Endpoints

| Método | Path | Roles |
|---|---|---|
| GET | /inventario/productos | dueno, vendedor, contador |
| GET | /inventario/productos/:id | dueno, vendedor, contador |
| POST | /inventario/productos | dueno |
| PATCH | /inventario/productos/:id | dueno |
| DELETE | /inventario/productos/:id | dueno |
| POST | /inventario/productos/:id/movimientos | dueno |
| GET | /inventario/productos/:id/movimientos | dueno, contador |
