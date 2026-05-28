# Migraciones Drizzle — Posta API

Fuente de verdad SQL en `apps/api/drizzle/`. Supabase CLI consume copias en `supabase/migrations/` (sincronizadas por script).

## Flujo manual

1. Crear `NNNN_descripcion.sql` en este directorio (siguiente número secuencial).
2. Actualizar el schema TypeScript en `src/db/schema/` si aplica.
3. Sincronizar a Supabase:
   ```bash
   ./scripts/ci/sync-supabase-migrations.sh
   ```
4. Aplicar en local (después de pull con migraciones nuevas):
   ```bash
   pnpm db:migrate
   ```
   Si preferís reset completo (borra datos locales): `supabase db reset`
5. Verificar alineación:
   ```bash
   pnpm --filter api db:check
   ```

## Reglas

- Toda tabla de negocio: `tenant_id`, RLS `ENABLE` + `FORCE`, policies explícitas (skill `rls-policy`).
- Dinero: `NUMERIC`, nunca float.
- `tenant_id` primera columna en índices compuestos.

## No usar en producción aún

`drizzle-kit push` no está en el flujo de producción; las migraciones son SQL revisadas a mano y versionadas en git.
