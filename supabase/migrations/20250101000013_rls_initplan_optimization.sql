-- Migración 0013: optimización InitPlan en policies RLS
-- Supabase Performance Advisor advierte cuando current_setting() o auth.*() se
-- evalúan por fila. Envolver en (select ...) fuerza evaluación una vez por query.
-- Comportamiento de seguridad idéntico; solo mejora performance a escala.

-- Expresiones reutilizables (comentario de referencia):
--   tenant ctx:  NULLIF((select current_setting('app.tenant_id', true)), '')::uuid
--   jwt tenant:  ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id')

-- ── tenants ───────────────────────────────────────────────────────────────────
ALTER POLICY "tenants_select" ON tenants
  USING (id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── usuarios_tenant ───────────────────────────────────────────────────────────
ALTER POLICY "usuarios_tenant_select" ON usuarios_tenant
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "usuarios_tenant_insert" ON usuarios_tenant
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "usuarios_tenant_update" ON usuarios_tenant
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "usuarios_tenant_delete" ON usuarios_tenant
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── productos ─────────────────────────────────────────────────────────────────
ALTER POLICY "productos_select" ON productos
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "productos_insert" ON productos
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "productos_update" ON productos
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "productos_delete" ON productos
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── movimientos_stock ─────────────────────────────────────────────────────────
ALTER POLICY "movimientos_stock_select" ON movimientos_stock
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "movimientos_stock_insert" ON movimientos_stock
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── clientes ──────────────────────────────────────────────────────────────────
ALTER POLICY "clientes_select" ON clientes
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "clientes_insert" ON clientes
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "clientes_update" ON clientes
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "clientes_delete" ON clientes
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── import_jobs ───────────────────────────────────────────────────────────────
ALTER POLICY "import_jobs_select" ON import_jobs
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "import_jobs_insert" ON import_jobs
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "import_jobs_update" ON import_jobs
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── ventas ────────────────────────────────────────────────────────────────────
ALTER POLICY "ventas_select" ON ventas
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "ventas_insert" ON ventas
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "ventas_update" ON ventas
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── items_venta ───────────────────────────────────────────────────────────────
ALTER POLICY "items_venta_select" ON items_venta
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "items_venta_insert" ON items_venta
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── storage imports ───────────────────────────────────────────────────────────
ALTER POLICY "imports_insert_own_tenant" ON storage.objects
  WITH CHECK (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id')
  );

ALTER POLICY "imports_select_own_tenant" ON storage.objects
  USING (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id')
  );

ALTER POLICY "imports_update_own_tenant" ON storage.objects
  USING (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id')
  )
  WITH CHECK (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id')
  );

-- ── invitaciones ──────────────────────────────────────────────────────────────
ALTER POLICY "invitaciones_select" ON invitaciones
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "invitaciones_insert" ON invitaciones
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "invitaciones_update" ON invitaciones
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "invitaciones_delete" ON invitaciones
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── proveedores ───────────────────────────────────────────────────────────────
ALTER POLICY "proveedores_select" ON proveedores
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "proveedores_insert" ON proveedores
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "proveedores_update" ON proveedores
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "proveedores_delete" ON proveedores
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── compras ───────────────────────────────────────────────────────────────────
ALTER POLICY "compras_select" ON compras
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "compras_insert" ON compras
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "compras_update" ON compras
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── items_compra ──────────────────────────────────────────────────────────────
ALTER POLICY "items_compra_select" ON items_compra
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "items_compra_insert" ON items_compra
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

-- ── tesorería ─────────────────────────────────────────────────────────────────
ALTER POLICY "sesiones_caja_select" ON sesiones_caja
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "sesiones_caja_insert" ON sesiones_caja
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "sesiones_caja_update" ON sesiones_caja
  USING  (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid)
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "pagos_cliente_select" ON pagos_cliente
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "pagos_cliente_insert" ON pagos_cliente
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "pagos_proveedor_select" ON pagos_proveedor
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "pagos_proveedor_insert" ON pagos_proveedor
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "movimientos_caja_select" ON movimientos_caja
  USING (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);

ALTER POLICY "movimientos_caja_insert" ON movimientos_caja
  WITH CHECK (tenant_id = NULLIF((select current_setting('app.tenant_id', true)), '')::uuid);
