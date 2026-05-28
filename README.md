# Posta — Guía de desarrollo

## Prerequisitos

| Herramienta | Versión mínima | Instalación |
|---|---|---|
| Node.js | 22+ | [nodejs.org](https://nodejs.org) |
| pnpm | 11+ | `npm i -g pnpm` |
| Redis | 7+ | `brew install redis` o `docker run -p 6379:6379 redis` |
| Cuenta Supabase | — | [supabase.com](https://supabase.com) |

---

## Setup inicial

```bash
git clone <repo>
cd posta
pnpm install
```

### Variables de entorno

Copiá el ejemplo y completá los valores:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env   # si existe, o creá el archivo
```

**`apps/api/.env`** — los valores se obtienen en Supabase → Settings:

```env
# Database → Connection string → Direct (puerto 5432, NO el pooler para tests)
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# API → Project URL y Keys
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# API → JWT Settings → JWT Secret
SUPABASE_JWT_SECRET=...

PORT=3001
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

**`apps/web/.env.local`**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Migraciones de base de datos

Fuente de verdad: `apps/api/drizzle/`. Copia en `supabase/migrations/` vía `./scripts/ci/sync-supabase-migrations.sh`.

```bash
# Local (recomendado)
pnpm db:migrate

# O manualmente en SQL Editor de Supabase, en orden:
# 0001_tenants … 0008_auditoria_clientes
```

Migraciones actuales:

```
0001_tenants.sql
0002_inventario.sql
0003_clientes_imports.sql
0004_ventas.sql
0005_storage_imports.sql
0006_rls_policies_explicit.sql
0007_invitaciones.sql
0008_auditoria_clientes.sql
```

Verificar alineación: `pnpm --filter api db:check`

---

## Levantar en desarrollo

Cada comando va en una terminal separada:

```bash
# Terminal 1 — Redis (si no corre como servicio)
redis-server

# Terminal 2 — API (compila packages internos primero)
pnpm dev:api

# Terminal 3 — Web
pnpm dev:web
```

- API: http://localhost:3001
- Web: http://localhost:3000

---

## Tests

### Unitarios (sin DB ni servicios externos)

```bash
# Todos los unit tests del monorepo
pnpm test

# Solo la API
cd apps/api && pnpm test

# Solo el web (lib + utilidades)
cd apps/web && pnpm test
```

Cobertura web: `api-client`, validación POS (`ventas-pos`), schemas de forms, `money`, `paginacion`, `APrice`. Ver `docs/TESTING.md`.

```bash
# Watch mode en la API
cd apps/api && pnpm test:watch
```

### Integración / Aislamiento RLS (requieren DB)

Verifican aislamiento entre tenants y conectividad Redis. Necesitás `DATABASE_URL` (Direct Connection, puerto 5432) y `REDIS_URL`.

```bash
# Desde la raíz del monorepo
pnpm test:integration

# Solo un módulo (desde apps/api)
pnpm test:integration:tenants
pnpm test:integration:inventario
```

### End-to-end con Playwright

Los E2E levantan web (`:3010`) y API (`:3002`) automáticamente — stack aislado del dev en `:3000`/`:3001`. Necesitás:

- Supabase local + migraciones
- Redis corriendo
- Variables de entorno generadas: `./scripts/ci/write-e2e-env.sh`

```bash
# Una vez: stack local listo
supabase start
./scripts/ci/write-e2e-env.sh
redis-server   # si no está corriendo

# Correr E2E (desde la raíz)
pnpm test:e2e

# Ver el reporte HTML
cd apps/web && pnpm exec playwright show-report
```

Tras `playwright test` puede haber ~15–20s sin tests visibles: Playwright compila Next y arranca la API.

**Si se cuelga ~2 minutos sin output:** suele ser un proceso colgado en `:3010` o `:3002` (típico tras Ctrl+C). El preflight lo detecta; manualmente:

```bash
for p in 3010 3002; do lsof -tiTCP:$p -sTCP:LISTEN | xargs kill -9 2>/dev/null; done
pnpm test:e2e
```

> Los E2E corren en Chrome y mobile (iPhone 13). En local, si `:3010`/`:3002` ya responden, Playwright los reutiliza.

---

## Scripts útiles

```bash
# Typecheck completo (API + Web + packages)
pnpm typecheck

# Lint
pnpm lint

# Compilar packages internos (necesario antes de `pnpm dev:api`)
pnpm build:packages

# Build de producción
pnpm build
```

---

## Simular caída de AFIP

Para probar el flujo `pendiente_facturacion` → reintento → `facturado`:

```bash
# En apps/api/.env, agregar:
AFIP_MOCK_FAIL=true
```

Con esto activo, todas las ventas tipo factura quedan en `pendiente_facturacion` y BullMQ encola el reintento. Sacá la variable para que vuelva a funcionar.
