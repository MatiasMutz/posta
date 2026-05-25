-- Migración 0001: tenants + usuarios_tenant con RLS
-- Ejecutar en el SQL editor de Supabase (o via supabase db push).
-- Sigue el procedimiento de la skill rls-policy.

-- ── Tabla tenants ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(200) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

-- Un tenant solo puede ver su propio registro.
-- Fail-safe: sin contexto → 0 filas (NULLIF convierte '' en NULL → comparación falla).
CREATE POLICY "tenants_select"
  ON tenants FOR SELECT
  USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT ON tenants TO authenticated;


-- ── Tabla usuarios_tenant ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios_tenant (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL,
  rol         VARCHAR(20) NOT NULL CHECK (rol IN ('dueno', 'vendedor', 'contador')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

-- tenant_id como columna líder del índice (performance de RLS)
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant_tenant_user
  ON usuarios_tenant (tenant_id, user_id);

ALTER TABLE usuarios_tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_tenant FORCE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_tenant_select"
  ON usuarios_tenant FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "usuarios_tenant_insert"
  ON usuarios_tenant FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "usuarios_tenant_update"
  ON usuarios_tenant FOR UPDATE
  USING  (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "usuarios_tenant_delete"
  ON usuarios_tenant FOR DELETE
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT ON usuarios_tenant TO authenticated;
-- INSERT/UPDATE/DELETE sobre usuarios_tenant solo los hace el servicio via admin (sin SET LOCAL ROLE).
