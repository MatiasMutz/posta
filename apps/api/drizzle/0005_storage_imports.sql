-- Bucket y policies de Storage para importaciones Excel/CSV.
-- Necesario en Supabase local (CI E2E) y en proyectos nuevos de producción.

INSERT INTO storage.buckets (id, name, public)
VALUES ('imports', 'imports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "imports_insert_own_tenant"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

CREATE POLICY "imports_select_own_tenant"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

CREATE POLICY "imports_update_own_tenant"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  )
  WITH CHECK (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );
