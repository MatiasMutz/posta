# Testing — Posta

Estrategia de tests del monorepo. Complementa `CLAUDE.md` §4 (Definition of Done).

## Pirámide

| Capa | Comando | Qué cubre |
|------|---------|-----------|
| Unit (API) | `pnpm test` | Servicios, guards, processors, validadores |
| Unit (web) | `pnpm --filter web test` | `api-client`, `ventas-pos`, `money`, `paginacion`, schemas de forms |
| Integration / RLS | `pnpm test:integration` | Aislamiento multi-tenant, fail-safe sin contexto, processor imports |
| E2E | `pnpm test:e2e` | Flujos de usuario (Playwright, chromium + mobile) |
| OpenAPI smoke | `./scripts/openapi-smoke.sh` | Paths principales documentados |

## Unit — API

- Config: Vitest en `apps/api`
- Excluye `*.isolation.spec.ts` y `*.integration.spec.ts` del job unitario
- Cada módulo de dominio: `*.service.spec.ts`; controllers con spec mínimo

## Unit — Web

- Config: `apps/web/vitest.config.ts` (environment `node`, mocks de `fetch`)
- **No** testea componentes React montados (sin Testing Library por ahora); la lógica vive en `lib/`:
  - `lib/api-client.ts` — errores HTTP, `campo`/`motivo`, `NetworkError`
  - `lib/ventas-pos.ts` — validación POS con `CreateVentaSchema`
  - `lib/forms.test.ts` — smoke de schemas Zod usados en forms
  - `lib/money.ts`, `lib/paginacion.ts` — utilidades

## Integration

Requiere Supabase local (o `DATABASE_URL`) + Redis para processor de imports.

```bash
pnpm db:migrate          # aplicar migraciones locales
pnpm test:integration
```

Por cada tabla con RLS: `*.isolation.spec.ts` con lectura/escritura cruzada entre tenants **y** test fail-safe (sin `set_config` → 0 filas).

## E2E

Ver `.claude/skills/e2e-feature/SKILL.md` y `apps/web/playwright.config.ts`.

- Setup: `tests/e2e/auth.setup.ts` → storage states en `.auth/`
- Proyectos: `chromium` + `mobile` (iPhone 13), `workers: 1`
- AFIP resilience: job CI separado con `AFIP_MOCK_FAIL=true`

Specs pendientes: ninguno (cobertura en `apps/web/tests/e2e/`).

## CI (`.github/workflows/ci.yml`)

Orden: lint-typecheck → unit (+ `db:check`) → integration → openapi-smoke → e2e → e2e-afip-resilience.

## Verificación local completa

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration
pnpm --filter api db:check
pnpm test:e2e
```
