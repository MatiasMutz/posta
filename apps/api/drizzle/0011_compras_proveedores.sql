-- ────────────────────────────────────────────────────────────
-- Fase 5: proveedores, compras, items_compra
-- skill rls-policy — tenant_id líder, FORCE, policies explícitas
-- ────────────────────────────────────────────────────────────

CREATE TABLE proveedores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  nombre          VARCHAR(200) NOT NULL,
  email           VARCHAR(200),
  telefono        VARCHAR(30),
  cuit            CHAR(11),
  direccion       TEXT,
  saldo_acreedor  NUMERIC(14,2) NOT NULL DEFAULT 0,
  activo          BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proveedores_tenant        ON proveedores (tenant_id);
CREATE INDEX idx_proveedores_tenant_nombre ON proveedores (tenant_id, nombre);
CREATE INDEX idx_proveedores_tenant_cuit   ON proveedores (tenant_id, cuit);

ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores FORCE ROW LEVEL SECURITY;

CREATE POLICY "proveedores_select" ON proveedores FOR SELECT
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "proveedores_insert" ON proveedores FOR INSERT
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "proveedores_update" ON proveedores FOR UPDATE
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "proveedores_delete" ON proveedores FOR DELETE
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON proveedores TO authenticated;


CREATE TABLE compras (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  proveedor_id        UUID REFERENCES proveedores(id),
  categoria           VARCHAR(10) NOT NULL,   -- compra | gasto
  tipo_comprobante    VARCHAR(20) NOT NULL,   -- factura_a | factura_b | ticket | sin_comprobante
  metodo_pago         VARCHAR(20) NOT NULL,
  subtotal            NUMERIC(14,2) NOT NULL,
  descuento           NUMERIC(14,2) NOT NULL DEFAULT 0,
  total               NUMERIC(14,2) NOT NULL,
  numero_comprobante  INTEGER,
  observaciones       TEXT,
  created_by          UUID NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compras_tenant        ON compras (tenant_id);
CREATE INDEX idx_compras_tenant_fecha  ON compras (tenant_id, created_at);
CREATE INDEX idx_compras_tenant_prov   ON compras (tenant_id, proveedor_id);

ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras FORCE ROW LEVEL SECURITY;

CREATE POLICY "compras_select" ON compras FOR SELECT
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "compras_insert" ON compras FOR INSERT
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "compras_update" ON compras FOR UPDATE
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

GRANT SELECT, INSERT, UPDATE ON compras TO authenticated;


CREATE TABLE items_compra (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  compra_id       UUID NOT NULL REFERENCES compras(id),
  producto_id     UUID REFERENCES productos(id),
  descripcion     VARCHAR(200) NOT NULL,
  cantidad        NUMERIC(14,3) NOT NULL,
  precio_unitario NUMERIC(14,2) NOT NULL,
  subtotal        NUMERIC(14,2) NOT NULL
);

CREATE INDEX idx_items_compra_tenant_compra ON items_compra (tenant_id, compra_id);

ALTER TABLE items_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_compra FORCE ROW LEVEL SECURITY;

CREATE POLICY "items_compra_select" ON items_compra FOR SELECT
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "items_compra_insert" ON items_compra FOR INSERT
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

GRANT SELECT, INSERT ON items_compra TO authenticated;
