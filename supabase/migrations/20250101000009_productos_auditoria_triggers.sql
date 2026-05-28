-- Migración 0009: created_by en productos + triggers updated_at unificados

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS created_by UUID;

COMMENT ON COLUMN productos.created_by IS 'Usuario que creó el registro (auth.users.id)';

CREATE TRIGGER clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER ventas_updated_at
  BEFORE UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER import_jobs_updated_at
  BEFORE UPDATE ON import_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
