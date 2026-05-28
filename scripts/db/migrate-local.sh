#!/usr/bin/env bash
# Aplica migraciones pendientes en Supabase local y repara el historial si 0006
# ya se aplicó manualmente (policies explícitas) sin quedar registrada.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql no encontrado. Instalá PostgreSQL client tools."
  exit 1
fi

if ! psql "$DB_URL" -c "SELECT 1" >/dev/null 2>&1; then
  echo "No se pudo conectar a $DB_URL"
  echo "¿Está corriendo Supabase local? (supabase start)"
  exit 1
fi

./scripts/ci/sync-supabase-migrations.sh

record_migration() {
  local version="$1"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO supabase_migrations.schema_migrations (version)
     VALUES ('$version')
     ON CONFLICT DO NOTHING;" >/dev/null
}

migration_applied() {
  local version="$1"
  psql "$DB_URL" -tAc \
    "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '$version' LIMIT 1;" \
    | grep -q 1
}

apply_sql_if_needed() {
  local version="$1"
  local file="$2"
  if migration_applied "$version"; then
    echo "  ✓ $version ya registrada"
    return 0
  fi
  echo "  → Aplicando $file ..."
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file"
  record_migration "$version"
  echo "  ✓ $version aplicada"
}

echo "Reparando historial de migraciones..."

# 0006: si las policies explícitas ya existen, solo registrar
if migration_applied "20250101000006"; then
  echo "  ✓ 20250101000006 ya registrada"
elif psql "$DB_URL" -tAc \
  "SELECT 1 FROM pg_policies WHERE policyname = 'clientes_select' LIMIT 1;" | grep -q 1; then
  echo "  → Policies 0006 ya presentes; registrando migración sin re-ejecutar"
  record_migration "20250101000006"
else
  apply_sql_if_needed "20250101000006" "supabase/migrations/20250101000006_rls_policies_explicit.sql"
fi

apply_sql_if_needed "20250101000007" "supabase/migrations/20250101000007_invitaciones.sql"
apply_sql_if_needed "20250101000008" "supabase/migrations/20250101000008_auditoria_clientes.sql"
apply_sql_if_needed "20250101000009" "supabase/migrations/20250101000009_productos_auditoria_triggers.sql"
echo "Migraciones al día:"
psql "$DB_URL" -c "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;"
