#!/usr/bin/env bash
# Comprueba que cada migración Drizzle tiene copia idéntica en supabase/migrations.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DRIZZLE="$ROOT/apps/api/drizzle"
SUPA="$ROOT/supabase/migrations"

missing=0
for f in "$DRIZZLE"/*.sql; do
  base="$(basename "$f")"
  suffix="${base#*_}"
  match="$(compgen -G "$SUPA"/*_"$suffix" || true)"
  if [ -z "$match" ]; then
    echo "Sin copia Supabase para: $base" >&2
    missing=1
    continue
  fi
  supa_file="$(echo "$match" | head -1)"
  if ! diff -q "$f" "$supa_file" > /dev/null 2>&1; then
    echo "Contenido distinto entre Drizzle y Supabase para: $base" >&2
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  echo "Ejecutá: ./scripts/ci/sync-supabase-migrations.sh" >&2
  exit 1
fi

echo "db:check OK — $(ls "$DRIZZLE"/*.sql | wc -l | tr -d ' ') migraciones alineadas."
