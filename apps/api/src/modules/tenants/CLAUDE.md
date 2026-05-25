# Módulo tenants

Responsabilidades: acceso al tenant actual del usuario autenticado.

## Importante

- Todas las queries de negocio usan `withTenant(user.tenantId, ...)` para que RLS aplique.
- `TenantsService.getTenantActual` es una excepción temporal: usa el db admin sin SET LOCAL ROLE porque el tenant en sí no tiene `tenant_id` (es la entidad raíz). La policy en `tenants` usa `id = NULLIF(...)::uuid`, así que el SET LOCAL igual lo filtra correctamente.
- Nunca exponer datos de otro tenant; el `tenantId` siempre viene de `request.user` (JwtGuard), nunca del body o params del request.

## Roles

GET /tenants/me → cualquier rol autenticado (dueño, vendedor, contador).
