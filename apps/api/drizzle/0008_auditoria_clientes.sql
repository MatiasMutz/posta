-- Migración 0008: auditoría en clientes (created_by)
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS created_by UUID;

COMMENT ON COLUMN clientes.created_by IS 'Usuario que creó el registro (auth.users.id)';
