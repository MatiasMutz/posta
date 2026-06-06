-- ────────────────────────────────────────────────────────────
-- Fase 6: tesorería — sesiones de caja, movimientos, pagos
-- skill rls-policy — tenant_id líder, FORCE, policies explícitas
-- ────────────────────────────────────────────────────────────

CREATE TABLE sesiones_caja (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  estado          VARCHAR(10) NOT NULL,   -- abierta | cerrada
  monto_apertura  NUMERIC(14,2) NOT NULL,
  monto_cierre    NUMERIC(14,2),
  monto_esperado  NUMERIC(14,2),
  diferencia      NUMERIC(14,2),
  observaciones   TEXT,
  abierta_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  cerrada_at      TIMESTAMPTZ,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sesiones_caja_tenant_estado ON sesiones_caja (tenant_id, estado);
CREATE INDEX idx_sesiones_caja_tenant_fecha  ON sesiones_caja (tenant_id, abierta_at);

CREATE UNIQUE INDEX idx_sesiones_caja_tenant_abierta
  ON sesiones_caja (tenant_id)
  WHERE estado = 'abierta';

ALTER TABLE sesiones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_caja FORCE ROW LEVEL SECURITY;

CREATE POLICY "sesiones_caja_select" ON sesiones_caja FOR SELECT
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "sesiones_caja_insert" ON sesiones_caja FOR INSERT
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "sesiones_caja_update" ON sesiones_caja FOR UPDATE
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

GRANT SELECT, INSERT, UPDATE ON sesiones_caja TO authenticated;


CREATE TABLE pagos_cliente (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  cliente_id      UUID NOT NULL REFERENCES clientes(id),
  monto           NUMERIC(14,2) NOT NULL,
  metodo_pago     VARCHAR(20) NOT NULL,
  observaciones   TEXT,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pagos_cliente_tenant_cliente ON pagos_cliente (tenant_id, cliente_id);
CREATE INDEX idx_pagos_cliente_tenant_fecha   ON pagos_cliente (tenant_id, created_at);

ALTER TABLE pagos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_cliente FORCE ROW LEVEL SECURITY;

CREATE POLICY "pagos_cliente_select" ON pagos_cliente FOR SELECT
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "pagos_cliente_insert" ON pagos_cliente FOR INSERT
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

GRANT SELECT, INSERT ON pagos_cliente TO authenticated;


CREATE TABLE pagos_proveedor (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  proveedor_id    UUID NOT NULL REFERENCES proveedores(id),
  monto           NUMERIC(14,2) NOT NULL,
  metodo_pago     VARCHAR(20) NOT NULL,
  observaciones   TEXT,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pagos_proveedor_tenant_prov ON pagos_proveedor (tenant_id, proveedor_id);
CREATE INDEX idx_pagos_proveedor_tenant_fecha ON pagos_proveedor (tenant_id, created_at);

ALTER TABLE pagos_proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_proveedor FORCE ROW LEVEL SECURITY;

CREATE POLICY "pagos_proveedor_select" ON pagos_proveedor FOR SELECT
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "pagos_proveedor_insert" ON pagos_proveedor FOR INSERT
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

GRANT SELECT, INSERT ON pagos_proveedor TO authenticated;


CREATE TABLE movimientos_caja (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL,
  sesion_caja_id    UUID NOT NULL REFERENCES sesiones_caja(id),
  tipo              VARCHAR(20) NOT NULL,   -- ingreso | egreso | pago_cliente | pago_proveedor
  metodo_pago       VARCHAR(20),
  monto             NUMERIC(14,2) NOT NULL,
  concepto          VARCHAR(200) NOT NULL,
  pago_cliente_id   UUID REFERENCES pagos_cliente(id),
  pago_proveedor_id UUID REFERENCES pagos_proveedor(id),
  created_by        UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mov_caja_tenant_sesion ON movimientos_caja (tenant_id, sesion_caja_id);
CREATE INDEX idx_mov_caja_tenant_fecha  ON movimientos_caja (tenant_id, created_at);

ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja FORCE ROW LEVEL SECURITY;

CREATE POLICY "movimientos_caja_select" ON movimientos_caja FOR SELECT
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

CREATE POLICY "movimientos_caja_insert" ON movimientos_caja FOR INSERT
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

GRANT SELECT, INSERT ON movimientos_caja TO authenticated;
