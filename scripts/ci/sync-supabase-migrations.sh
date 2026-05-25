#!/usr/bin/env bash
# Copia las migraciones Drizzle al formato que espera Supabase CLI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/apps/api/drizzle"
DEST="$ROOT/supabase/migrations"

mkdir -p "$DEST"

copy() {
  local prefix="$1"
  local file="$2"
  cp "$SRC/$file" "$DEST/${prefix}_${file#*_}"
}

copy 20250101000001 0001_tenants.sql
copy 20250101000002 0002_inventario.sql
copy 20250101000003 0003_clientes_imports.sql
copy 20250101000004 0004_ventas.sql
copy 20250101000005 0005_storage_imports.sql

echo "Migraciones sincronizadas en supabase/migrations/"
