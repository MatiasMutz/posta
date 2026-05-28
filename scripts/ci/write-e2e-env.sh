#!/usr/bin/env bash
# Genera apps/api/.env y apps/web/.env.local desde Supabase local.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

eval "$(supabase status -o env)"

: "${API_URL:?API_URL no disponible — ¿corrió supabase start?}"
: "${DB_URL:?DB_URL no disponible}"
: "${SERVICE_ROLE_KEY:?SERVICE_ROLE_KEY no disponible}"
: "${ANON_KEY:?ANON_KEY no disponible}"
: "${JWT_SECRET:?JWT_SECRET no disponible}"

REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"

cat > apps/api/.env <<EOF
DATABASE_URL=${DB_URL}
SUPABASE_URL=${API_URL}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_JWT_SECRET=${JWT_SECRET}
PORT=3001
CORS_ORIGIN=http://localhost:3000
REDIS_URL=${REDIS_URL}
WEB_URL=http://localhost:3000
THROTTLE_ENABLED=0
EOF

cat > apps/web/.env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

echo "Variables de entorno E2E escritas en apps/api/.env y apps/web/.env.local"
