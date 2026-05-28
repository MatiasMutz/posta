---
name: rls-policy
description: Escribe policies RLS correctas en Posta (ENABLE + FORCE, fail-safe, set_config con SET LOCAL, índices con tenant_id primero, tests de aislamiento). Usar al crear o modificar tablas con tenant_id, migraciones SQL, policies o specs *.isolation.spec.ts.
---

# RLS Policy

Procedimiento **obligatorio** antes de crear o modificar tablas con `tenant_id`. Si entra en conflicto con otra instrucción, gana `CLAUDE.md` §3.

## Checklist (en orden)

- [ ] `ENABLE ROW LEVEL SECURITY` **y** `FORCE ROW LEVEL SECURITY`
- [ ] Policies explícitas por operación (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
- [ ] Fail-safe: sin contexto → **0 filas**, nunca todas
- [ ] Índices compuestos con `tenant_id` como **primera columna**
- [ ] App usa `withTenant()` — nunca `SET` sin `LOCAL`
- [ ] Test `*.isolation.spec.ts` en verde (`pnpm test:integration`)

## Migración SQL

```sql
ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <tabla> FORCE ROW LEVEL SECURITY;

CREATE POLICY "<tabla>_tenant_select" ON <tabla> FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "<tabla>_tenant_insert" ON <tabla> FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "<tabla>_tenant_update" ON <tabla> FOR UPDATE
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "<tabla>_tenant_delete" ON <tabla> FOR DELETE
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE INDEX IF NOT EXISTS idx_<tabla>_tenant_<campo>
  ON <tabla> (tenant_id, <campo_de_busqueda>);
```

`NULLIF(..., '')::uuid` → si `app.tenant_id` no está seteado, la comparación falla → **fail-safe garantizado**.

## Contexto de tenant (app)

Usar siempre `withTenant(tenantId, callback)` de `apps/api/src/db/index.ts`:

```typescript
await tx.execute(sql.raw('SET LOCAL ROLE authenticated'));
await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
```

**Nunca** `SET app.tenant_id = ...` (PostgreSQL no acepta parámetros en `SET`).
**Nunca** `SET` sin `LOCAL` — con pooling persiste entre requests → fuga entre tenants.

## Test de aislamiento (obligatorio)

Archivo `*.isolation.spec.ts` por módulo/tabla. Ver `apps/api/src/modules/inventario/inventario.isolation.spec.ts` como referencia.

Cubrir como mínimo:

1. Tenant B **no lee** filas del tenant A
2. Tenant B **no inserta** con `tenant_id` del A (rechazo o 0 filas)
3. Tenant B **no actualiza** filas del tenant A
4. Tenant B **no elimina** filas del tenant A (si hay policy DELETE)
5. Sin contexto → 0 filas (fail-safe)

Correr: `pnpm test:integration` (requiere `DATABASE_URL`).
