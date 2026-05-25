# Posta — Guía de desarrollo

## Prerequisitos

| Herramienta | Versión mínima | Instalación |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `npm i -g pnpm` |
| Redis | 7+ | `brew install redis` o `docker run -p 6379:6379 redis` |
| Cuenta Supabase | — | [supabase.com](https://supabase.com) |

---

## Setup inicial

```bash
git clone <repo>
cd "Hub Gestion"
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

Ejecutá cada archivo en orden en el **SQL Editor de Supabase**:

```
apps/api/drizzle/0001_tenants.sql
apps/api/drizzle/0002_inventario.sql
apps/api/drizzle/0003_clientes_imports.sql
apps/api/drizzle/0004_ventas.sql
```

> El archivo `0003` incluye instrucciones comentadas para crear el bucket `imports` en Supabase Storage — necesario para el motor de importación Excel.

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

# Solo el web (componentes UI)
cd apps/web && pnpm test

# Watch mode en la API
cd apps/api && pnpm test:watch
```

### Integración / Aislamiento RLS (requieren DB)

Estos tests verifican que el aislamiento entre tenants funciona a nivel base de datos. Necesitás `DATABASE_URL` apuntando a la **Direct Connection** (puerto 5432).

```bash
cd apps/api

# Tenants
pnpm test:integration

# Inventario
pnpm test:integration:inventario

# Ventas (requiere migración 0004 aplicada)
npx vitest run src/modules/ventas/ventas.isolation.spec.ts
```

### End-to-end con Playwright

Los E2E levantan el web y la API automáticamente. Necesitás:
- Supabase corriendo y migraciones aplicadas
- Redis corriendo
- Un usuario de prueba creado (ver abajo)

```bash
# Crear usuario E2E (solo la primera vez)
curl -X POST http://localhost:3001/api/v1/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e@posta-test.com","password":"password123456","nombreTenant":"Tenant E2E"}'

# Correr los E2E
cd apps/web
E2E_EMAIL=e2e@posta-test.com E2E_PASSWORD=password123456 pnpm test:e2e

# Ver el reporte HTML
pnpm exec playwright show-report
```

Desde la raíz del monorepo:

```bash
pnpm test:e2e
```

> Los E2E corren en Chrome y mobile (iPhone 13). Si ya tenés el web y la API corriendo localmente, Playwright los reutiliza (`reuseExistingServer`).

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
