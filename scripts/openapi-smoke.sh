#!/usr/bin/env bash
# Verifica que OpenAPI expone los paths principales del producto.
set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
DOCS_URL="${API_URL}/api/v1/docs-json"

echo "OpenAPI smoke: ${DOCS_URL}"

json="$(curl -sf "${DOCS_URL}")"

# Debe coincidir con app.setGlobalPrefix('api/v1') en apps/api/src/main.ts
API_PREFIX="/api/v1"

check_path() {
  local path="${API_PREFIX}$1"
  if ! echo "$json" | grep -q "\"${path}\""; then
    echo "Falta path en OpenAPI: ${path}" >&2
    exit 1
  fi
  echo "  ok ${path}"
}

check_path "/auth/login"
check_path "/auth/registro"
check_path "/auth/completar-invitacion"
check_path "/tenants/me"
check_path "/tenants/usuarios"
check_path "/tenants/usuarios/invitar"
check_path "/inventario/productos"
check_path "/inventario/productos/{id}/movimientos"
check_path "/clientes"
check_path "/imports"
check_path "/imports/upload-url"
check_path "/imports/{jobId}/estado"
check_path "/ventas"
check_path "/ventas/iva-ventas"
check_path "/ventas/{id}/reintentar-facturacion"
check_path "/proveedores"
check_path "/compras"
check_path "/compras/iva-compras"
check_path "/tesoreria/caja"
check_path "/tesoreria/caja/apertura"
check_path "/tesoreria/caja/cierre"
check_path "/tesoreria/caja/movimientos"
check_path "/tesoreria/flujo-caja"
check_path "/tesoreria/pagos/cuentas-corrientes"
check_path "/tesoreria/pagos/cliente"
check_path "/tesoreria/pagos/proveedor"
check_path "/health"

echo "OpenAPI smoke: todos los paths presentes."
