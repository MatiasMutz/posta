# Roadmap de implementación — Posta

> Orden de ataque por fases. Cada fase entrega algo verificable. La regla es **construir verticales completas** (de la base al frontend, con tests) en vez de construir capas horizontales sueltas. No se modela toda la base de antemano: se modela la vertical que se está implementando.
>
> Referencias: alcance en `PROJECT.md` §5; decisiones en `PROJECT.md` §6; cómo en `ARCHITECTURE.md`; tests en `docs/TESTING.md`.

---

## Fase 0 — Andamiaje y disciplina AI-native ✅

Objetivo: repo listo para desarrollar con disciplina de producción antes de escribir features de negocio.

- Monorepo (`ARCHITECTURE.md` §3): `apps/api`, `apps/web`, `services/afip`, `packages/*`, `docs/`, `.claude/skills/`
- **Superpowers** (metodología): ver `docs/AI-WORKFLOW.md`
- Skills de dominio en `.claude/skills/*/SKILL.md` (8 skills)
- MCPs: Supabase en `.mcp.json`; Context7 / Playwright / GitHub como plantillas comentadas
- NestJS + Next.js + Supabase; spikes D-13 (Drizzle) y D-14 (Zod) cerrados en `PROJECT.md` §6
- CI: lint, typecheck, unit, integration, OpenAPI smoke, E2E, E2E AFIP resilience
- Design tokens + componentes base (`ABtn`, `APill`, `APrice`)

**Hecho cuando:** hola mundo autenticado (front → API → Supabase) con unit + E2E en verde y CI en GitHub.

---

## Fase 1 — Cimiento multi-tenant ✅

- Auth Supabase (registro, login, JWT local + JWKS)
- Tenants, roles (dueño/vendedor/contador), invitaciones de equipo
- `withTenant` + `SET LOCAL`; RLS ENABLE + FORCE
- Tests de aislamiento por tabla + fail-safe
- `RolesGuard`; vendedor sin `costo` en API

**Estado:** ✅ Isolation specs: tenants, inventario, clientes, imports, ventas, invitaciones. E2E roles + equipo.

---

## Fase 2 — Inventario ✅

- Productos (SKU, costo, precio, stock mínimo) — skill `money`
- CRUD, paginación, búsqueda, alertas stock bajo
- Movimientos entrada/salida/ajuste + historial
- Soft-delete; E2E serial en `gestionar-producto.spec.ts`

---

## Fase 3 — Motor de Importación Excel/CSV ✅

- Skill `excel-import`; BullMQ + Supabase Storage
- Sanitización, Levenshtein, grilla in-line, reintento parcial
- Entidades: inventario + clientes
- E2E: happy path, errores, clientes

---

## Fase 4 — Ventas / POS + adaptador AFIP (mock) ✅

- Skill `afip-adapter`; `FacturadorMock` + `AFIP_MOCK_FAIL`
- POS, remito/presupuesto, historial, export IVA
- Clientes + saldo deudor (cta. cte. ventas; pagos → Fase 6)
- `FacturacionProcessor` (reintentos → `error_afip`)

### Post-hardening (calidad operativa)

| Área | Estado |
|------|--------|
| E2E existentes | auth (login, roles, activar-cuenta), inventario (gestión+movimientos), import×3, POS (+ factura A, stock insuficiente), remito, IVA, AFIP reintento, clientes CRUD/editar/cta. cte., equipo, ventas detalle |
| E2E pendientes | — |
| Tests API | ~145 unit + 43 integration (ver CI) |
| Tests web | `api-client`, `ventas-pos`, forms, money, paginacion, `sesion` |
| OpenAPI | `@ApiOperation` + errores estándar; smoke ampliado en CI |
| Errores | `AllExceptionsFilter`; `ApiError` + `api-client` unificado |
| DB | Migraciones `0001`–`0009`; `pnpm db:check`; `pnpm db:migrate` |
| AFIP | `FacturadorMock` (default) + `FacturadorHttp` vía `AFIP_SERVICE_URL` |
| Infra | `infra/*.Dockerfile`, `docker-compose.prod.yml` |
| Docs | `TESTING.md`, `DATA-FETCHING.md`, `AI-WORKFLOW.md` |

**Exclusiones explícitas (alcance actual):** dashboard dueño (Fase 7), tesorería/caja (Fase 6), pagos cta. cte., AFIP real en prod, onboarding wizard guiado.

---

## Fase 5 — Compras y Proveedores

- Gastos/compras; cuentas corrientes pasivas (proveedores)
- Export IVA Compras; import saldos iniciales (reusa Fase 3)

## Fase 6 — Tesorería y Finanzas

- Caja chica; flujo de caja; **pagos de cuenta corriente activa**

## Fase 7 — Dashboard y vista Contador

- KPIs dueño; vista contador consolidada

---

## Después del alcance actual

AFIP real (`services/afip/`), luego `PROJECT.md` §5.2 (e-commerce, Mercado Pago, CRM, contabilidad expresa, IA).

---

## Notas de secuencia

- **Inventario antes que Ventas:** autónomo; ejercita `money` y tablas densas.
- **Excel temprano (Fase 3):** mayor riesgo de producto; valida infra async.
- **Multi-tenant primero (Fase 1):** seguridad en cimientos, no parche.
