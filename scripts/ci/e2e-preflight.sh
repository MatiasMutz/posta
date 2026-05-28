#!/usr/bin/env bash
# Verifica prerrequisitos y puertos E2E antes de Playwright.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
E2E_WEB_PORT="${E2E_WEB_PORT:-3010}"
E2E_API_PORT="${E2E_API_PORT:-3002}"

echo "▸ Verificando prerrequisitos E2E…"

REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
REDIS_HOST="$(printf '%s' "$REDIS_URL" | sed -E 's#^redis://([^:/]+).*#\1#')"
REDIS_PORT="$(printf '%s' "$REDIS_URL" | sed -E 's#^redis://[^:]+:([0-9]+).*#\1#')"
REDIS_PORT="${REDIS_PORT:-6379}"

redis_responde() {
  if command -v redis-cli >/dev/null 2>&1; then
    redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1
    return
  fi

  # En CI (GHA) Redis corre como service container; el runner no trae redis-cli.
  if command -v nc >/dev/null 2>&1; then
    nc -z "$REDIS_HOST" "$REDIS_PORT" >/dev/null 2>&1
    return
  fi

  (echo > "/dev/tcp/${REDIS_HOST}/${REDIS_PORT}") >/dev/null 2>&1
}

if ! redis_responde; then
  echo "ERROR: Redis no responde en ${REDIS_URL}."
  echo "       Iniciá Redis: redis-server  (o: brew services start redis)"
  exit 1
fi

if ! supabase status >/dev/null 2>&1; then
  echo "ERROR: Supabase local no está corriendo."
  echo "       supabase start && ./scripts/ci/write-e2e-env.sh"
  exit 1
fi

if [[ ! -f "$ROOT/apps/api/.env" ]]; then
  echo "ERROR: Falta apps/api/.env."
  echo "       ./scripts/ci/write-e2e-env.sh"
  exit 1
fi

check_port() {
  local port="$1"
  local name="$2"
  local url="$3"

  if ! lsof -i ":$port" -sTCP:LISTEN >/dev/null 2>&1; then
    return 0
  fi

  if curl -sf -m 5 "$url" >/dev/null 2>&1; then
    echo "  ✓ $name responde en :$port (se reutilizará si reuseExistingServer está activo)"
    return 0
  fi

  echo "ERROR: Hay un proceso colgado en :$port ($name): acepta conexiones pero no responde HTTP."
  echo "       Suele quedar de un E2E interrumpido con Ctrl+C."
  echo "       Liberá el puerto: lsof -ti :$port | xargs kill -9"
  exit 1
}

check_port "$E2E_WEB_PORT" "Web E2E" "http://127.0.0.1:$E2E_WEB_PORT/"
check_port "$E2E_API_PORT" "API E2E" "http://127.0.0.1:$E2E_API_PORT/api/v1/health"

echo "▸ Prerrequisitos OK. Playwright levantará web (:$E2E_WEB_PORT) y API (:$E2E_API_PORT); la primera vez puede tardar ~20s."
