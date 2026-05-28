#!/usr/bin/env bash
# Copia las migraciones Drizzle al formato que espera Supabase CLI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/apps/api/drizzle"
DEST="$ROOT/supabase/migrations"

mkdir -p "$DEST"

i=1
for f in $(ls "$SRC"/[0-9][0-9][0-9][0-9]_*.sql 2>/dev/null | sort); do
  base="$(basename "$f")"
  suffix="${base#*_}"
  prefix="$(printf "2025010100%04d" "$i")"
  cp "$f" "$DEST/${prefix}_${suffix}"
  echo "  ${base} -> ${prefix}_${suffix}"
  i=$((i + 1))
done

echo "Migraciones sincronizadas en supabase/migrations/ ($((i - 1)) archivos)"
