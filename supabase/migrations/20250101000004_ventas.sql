-- ────────────────────────────────────────────────────────────
-- saldo_deudor en clientes (cuenta corriente pasiva del cliente)
-- ────────────────────────────────────────────────────────────
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS saldo_deudor NUMERIC(14,2) NOT NULL DEFAULT 0;


-- ────────────────────────────────────────────────────────────
-- Tabla: ventas
-- skill rls-policy: tenant_id líder, FORCE, fail-safe
-- ────────────────────────────────────────────────────────────
CREATE TABLE ventas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL,
  cliente_id            UUID REFERENCES clientes(id),
  tipo                  VARCHAR(20) NOT NULL,       -- factura_b | factura_a | remito | presupuesto
  estado                VARCHAR(30) NOT NULL,       -- facturado | pendiente_facturacion | error_afip | remito | presupuesto
  metodo_pago           VARCHAR(20) NOT NULL,       -- efectivo | debito | credito | transferencia | cuenta_corriente
  subtotal              NUMERIC(14,2) NOT NULL,
  descuento             NUMERIC(14,2) NOT NULL DEFAULT 0,
  total                 NUMERIC(14,2) NOT NULL,
  cae                   VARCHAR(20),
  cae_vencimiento       DATE,
  numero_comprobante    INTEGER,
  intentos_facturacion  INTEGER NOT NULL DEFAULT 0,
  observaciones         TEXT,
  created_by            UUID NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ventas_tenant        ON ventas (tenant_id);
CREATE INDEX idx_ventas_tenant_fecha  ON ventas (tenant_id, created_at);
CREATE INDEX idx_ventas_tenant_estado ON ventas (tenant_id, estado);

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas FORCE ROW LEVEL SECURITY;

CREATE POLICY "ventas_tenant_isolation"
  ON ventas
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

GRANT SELECT, INSERT, UPDATE ON ventas TO authenticated;


-- ────────────────────────────────────────────────────────────
-- Tabla: items_venta
-- ────────────────────────────────────────────────────────────
CREATE TABLE items_venta (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  venta_id        UUID NOT NULL REFERENCES ventas(id),
  producto_id     UUID REFERENCES productos(id),
  descripcion     VARCHAR(200) NOT NULL,
  cantidad        NUMERIC(14,3) NOT NULL,
  precio_unitario NUMERIC(14,2) NOT NULL,
  subtotal        NUMERIC(14,2) NOT NULL
);

CREATE INDEX idx_items_venta_tenant_venta ON items_venta (tenant_id, venta_id);

ALTER TABLE items_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_venta FORCE ROW LEVEL SECURITY;

CREATE POLICY "items_venta_tenant_isolation"
  ON items_venta
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

GRANT SELECT, INSERT ON items_venta TO authenticated;
