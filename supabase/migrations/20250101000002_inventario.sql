-- Migración 0002: productos + movimientos_stock con RLS
-- Ejecutar en el SQL editor de Supabase (o via supabase db push).
-- Sigue el procedimiento de la skill rls-policy.

-- ── Tabla productos ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID          NOT NULL,
  nombre         VARCHAR(200)  NOT NULL,
  sku            VARCHAR(50),
  codigo_barras  VARCHAR(100),
  costo          NUMERIC(14,2) NOT NULL,   -- skill money: nunca float
  precio         NUMERIC(14,2) NOT NULL,
  stock_actual   INTEGER       NOT NULL DEFAULT 0,
  stock_minimo   INTEGER       NOT NULL DEFAULT 0,
  activo         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- tenant_id primero en índices compuestos (RLS performance)
CREATE INDEX IF NOT EXISTS idx_productos_tenant
  ON productos (tenant_id);

-- SKU único por tenant (NULL excluido)
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_tenant_sku
  ON productos (tenant_id, sku) WHERE sku IS NOT NULL;

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos FORCE ROW LEVEL SECURITY;

CREATE POLICY "productos_select"
  ON productos FOR SELECT
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "productos_insert"
  ON productos FOR INSERT
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "productos_update"
  ON productos FOR UPDATE
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- No DELETE: soft-delete via activo=false
CREATE POLICY "productos_delete"
  ON productos FOR DELETE
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON productos TO authenticated;


-- ── Tabla movimientos_stock ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID          NOT NULL,
  producto_id     UUID          NOT NULL REFERENCES productos(id),
  tipo            VARCHAR(20)   NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad        INTEGER       NOT NULL CHECK (cantidad > 0),
  stock_anterior  INTEGER       NOT NULL,
  stock_posterior INTEGER       NOT NULL,
  motivo          VARCHAR(200),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by      UUID          NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movimientos_tenant_producto
  ON movimientos_stock (tenant_id, producto_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_tenant_fecha
  ON movimientos_stock (tenant_id, created_at);

ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock FORCE ROW LEVEL SECURITY;

CREATE POLICY "movimientos_stock_select"
  ON movimientos_stock FOR SELECT
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "movimientos_stock_insert"
  ON movimientos_stock FOR INSERT
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- Inmutable: no UPDATE ni DELETE (trazabilidad)
GRANT SELECT, INSERT ON movimientos_stock TO authenticated;


-- ── Trigger updated_at en productos ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
