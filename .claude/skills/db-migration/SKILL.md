---
name: db-migration
description: Crea migraciones Drizzle/SQL seguras en Posta (sin DROP accidentales, tenant_id + RLS + índices, sync a supabase/migrations). Usar al agregar tablas, columnas, policies o índices en apps/api/drizzle/.
---

# DB Migration

Procedimiento **obligatorio** al cambiar el schema de Postgres. Componer con skill `rls-policy` para toda tabla con `tenant_id`.

## Checklist (en orden)

- [ ] Siguiente archivo secuencial en `apps/api/drizzle/NNNN_descripcion.sql`
- [ ] Schema TypeScript en `apps/api/src/db/schema/` alineado con el SQL
- [ ] **Sin DROP accidentales** — revisar diff línea por línea antes de commitear
- [ ] Tabla nueva de negocio: `tenant_id` + `ENABLE` + `FORCE` RLS + 4 policies (skill `rls-policy`)
- [ ] Índices compuestos con `tenant_id` como **primera columna**
- [ ] Montos: `NUMERIC(14,2)` — nunca float (skill `money`)
- [ ] `current_setting()` / `auth.*()` envueltos en `(select ...)` en policies (InitPlan)
- [ ] Sync: `./scripts/ci/sync-supabase-migrations.sh`
- [ ] Check: `pnpm --filter api db:check` (paridad drizzle ↔ supabase/migrations)
- [ ] Aplicar local: `pnpm db:migrate` (o `supabase db reset` si preferís reset)
- [ ] Test de aislamiento `*.isolation.spec.ts` si hay tabla nueva con RLS

## Flujo

```bash
# 1. Escribir SQL en apps/api/drizzle/
# 2. Actualizar schema Drizzle si aplica
./scripts/ci/sync-supabase-migrations.sh
pnpm --filter api db:check
pnpm db:migrate
pnpm test:integration   # si tocaste RLS
```

Fuente de verdad: `apps/api/drizzle/`. Copia en `supabase/migrations/` vía script — **nunca** editar solo una de las dos carpetas.

## Revisión anti-DROP

Antes de commitear, buscar en el diff:

```bash
git diff -- '*.sql' | grep -iE 'DROP (TABLE|COLUMN|INDEX|POLICY)'
```

Si hay `DROP`, confirmar que es intencional y documentado en el PR. En tablas con datos de producción, preferir migraciones aditivas (`ADD COLUMN`, `CREATE POLICY`) sobre destructivas.

## Tabla nueva — plantilla mínima

```sql
CREATE TABLE <tabla> (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL,
  -- columnas de negocio
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <tabla> FORCE ROW LEVEL SECURITY;

-- 4 policies (ver skill rls-policy)
CREATE INDEX IF NOT EXISTS idx_<tabla>_tenant_<campo> ON <tabla> (tenant_id, <campo>);
```

## No usar en producción

`drizzle-kit push` no está en el flujo. Las migraciones son SQL revisadas a mano y versionadas en git. Ver `apps/api/drizzle/README.md`.
