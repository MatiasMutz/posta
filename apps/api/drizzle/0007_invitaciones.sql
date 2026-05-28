-- Migración 0007: invitaciones de usuarios al tenant

CREATE TABLE IF NOT EXISTS invitaciones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email             VARCHAR(200) NOT NULL,
  rol               VARCHAR(20) NOT NULL CHECK (rol IN ('vendedor', 'contador')),
  invitado_por      UUID NOT NULL,
  supabase_user_id  UUID,
  estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'aceptada', 'revocada')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_invitaciones_tenant_email
  ON invitaciones (tenant_id, email);

ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitaciones FORCE ROW LEVEL SECURITY;

CREATE POLICY "invitaciones_select" ON invitaciones FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "invitaciones_insert" ON invitaciones FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "invitaciones_update" ON invitaciones FOR UPDATE
  USING  (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "invitaciones_delete" ON invitaciones FOR DELETE
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON invitaciones TO authenticated;
