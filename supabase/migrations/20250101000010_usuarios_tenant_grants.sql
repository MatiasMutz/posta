-- Permite INSERT/UPDATE/DELETE en usuarios_tenant vía withTenant (rol authenticated).
-- Las policies de 0001 ya restringen por tenant_id; solo faltaban los GRANTs.

GRANT INSERT, UPDATE, DELETE ON usuarios_tenant TO authenticated;
