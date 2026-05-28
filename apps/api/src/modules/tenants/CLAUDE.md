# Módulo tenants

Responsabilidades: acceso al tenant actual del usuario autenticado.

## Importante

- Todas las queries de negocio usan `withTenant(user.tenantId, ...)` para que RLS aplique.
- `TenantsService.getTenantActual` también usa `withTenant`: la policy en `tenants` filtra por `id = app.tenant_id`.
- Nunca exponer datos de otro tenant; el `tenantId` siempre viene de `request.user` (JwtGuard), nunca del body o params del request.

## Roles

GET /tenants/me → cualquier rol autenticado (dueño, vendedor, contador).
