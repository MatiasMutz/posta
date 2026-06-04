# Módulo auth

Responsabilidades: registro de dueño + tenant, login, y los guards de autenticación y rol.

## Decisiones clave

- **JWT verificado localmente** con `jsonwebtoken`. Tokens **HS256** (legacy) usan `SUPABASE_JWT_SECRET`; tokens **ES256/RS256** (Supabase actual) usan JWKS cacheado desde `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`. Sin HTTP call a Supabase Auth por request (solo fetch periódico de claves públicas).
- **tenant_id y rol en app_metadata del JWT**: se setean al registrar o al completar invitación. Así el JwtGuard no necesita consultar la BD en cada request.
- **Cambio de rol en equipo:** tras `PATCH /tenants/usuarios/:id/rol`, el usuario debe **cerrar sesión y volver a entrar** (o refrescar sesión) para que el JWT traiga el rol nuevo; hasta entonces el token anterior sigue vigente.
- **Supabase Admin client** (service role): solo se usa para operaciones admin (crear usuario, actualizar app_metadata). No se usa para queries de negocio.
- El `AuthService` opera sobre la BD sin `withTenant` (crea tenants y memberships como operación admin antes de que exista el contexto).

## Flujo de registro

1. `supabase.auth.admin.createUser` → obtener `user.id`
2. `db.insert(tenants)` → obtener `tenant.id`
3. `db.insert(usuariosTenant)` → membership con rol `dueno`
4. `supabase.auth.admin.updateUserById` → `app_metadata: { tenant_id, rol }`
5. `supabase.auth.signInWithPassword` → devolver la sesión

Si el paso 2-4 falla, se elimina el usuario de Supabase (limpieza de usuario huérfano).

## Guardia de rol

`RolesGuard` + decorador `@Roles(...)` en el controller. Ejemplo:
```typescript
@Roles('dueno')
@UseGuards(JwtGuard, RolesGuard)
@Get('finanzas')
```

El vendedor y el contador NUNCA reciben `costo` ni `ganancia` en ninguna respuesta. Solo el dueño ve costos.
