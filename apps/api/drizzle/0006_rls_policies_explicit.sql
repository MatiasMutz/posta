-- Migración 0006: policies RLS explícitas por operación (skill rls-policy)
-- Unifica clientes, import_jobs, ventas e items_venta con el patrón de inventario.

-- ── clientes ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "clientes_tenant_isolation" ON clientes;

CREATE POLICY "clientes_select" ON clientes FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "clientes_insert" ON clientes FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "clientes_update" ON clientes FOR UPDATE
  USING  (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "clientes_delete" ON clientes FOR DELETE
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ── import_jobs ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "import_jobs_tenant_isolation" ON import_jobs;

CREATE POLICY "import_jobs_select" ON import_jobs FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "import_jobs_insert" ON import_jobs FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "import_jobs_update" ON import_jobs FOR UPDATE
  USING  (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ── ventas ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ventas_tenant_isolation" ON ventas;

CREATE POLICY "ventas_select" ON ventas FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "ventas_insert" ON ventas FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "ventas_update" ON ventas FOR UPDATE
  USING  (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ── items_venta ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "items_venta_tenant_isolation" ON items_venta;

CREATE POLICY "items_venta_select" ON items_venta FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "items_venta_insert" ON items_venta FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
