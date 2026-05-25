-- ────────────────────────────────────────────────────────────
-- Tabla: clientes
-- Regla: skill rls-policy — tenant_id líder, FORCE, fail-safe
-- ────────────────────────────────────────────────────────────

CREATE TABLE clientes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  nombre      VARCHAR(200) NOT NULL,
  email       VARCHAR(200),
  telefono    VARCHAR(30),
  cuit        CHAR(11),
  direccion   TEXT,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clientes_tenant       ON clientes (tenant_id);
CREATE INDEX idx_clientes_tenant_email ON clientes (tenant_id, email);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes FORCE ROW LEVEL SECURITY;

-- fail-safe: NULLIF devuelve NULL si el setting está vacío → 0 filas
CREATE POLICY "clientes_tenant_isolation"
  ON clientes
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON clientes TO authenticated;


-- ────────────────────────────────────────────────────────────
-- Tabla: import_jobs
-- Almacena el estado de cada job de importación.
-- ────────────────────────────────────────────────────────────

CREATE TABLE import_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL,
  tipo         VARCHAR(20) NOT NULL,      -- 'inventario' | 'clientes'
  estado       VARCHAR(20) NOT NULL DEFAULT 'pendiente',  -- pendiente | procesando | completado | error
  fase         VARCHAR(20),               -- parseando | validando | importando
  progreso     INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  filas_ok     INTEGER NOT NULL DEFAULT 0,
  filas_error  INTEGER NOT NULL DEFAULT 0,
  errores      JSONB,                     -- [{ numero, datos, problemas[] }]
  archivo_path TEXT NOT NULL,
  column_map   JSONB NOT NULL,            -- [{ headerArchivo, campo }]
  created_by   UUID NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_jobs_tenant        ON import_jobs (tenant_id);
CREATE INDEX idx_import_jobs_tenant_estado ON import_jobs (tenant_id, estado);

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs FORCE ROW LEVEL SECURITY;

CREATE POLICY "import_jobs_tenant_isolation"
  ON import_jobs
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE ON import_jobs TO authenticated;


-- ────────────────────────────────────────────────────────────
-- Supabase Storage bucket 'imports' — ejecutar en el dashboard
-- o vía Supabase Management API. No es SQL estándar de postgres.
-- ────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('imports', 'imports', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "usuarios pueden subir sus imports"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (
--   bucket_id = 'imports' AND
--   (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
-- );
--
-- CREATE POLICY "usuarios pueden leer sus imports"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (
--   bucket_id = 'imports' AND
--   (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
-- );
