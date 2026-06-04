# Roadmap de implementación — Posta

> Orden de ataque por fases. Cada fase entrega algo verificable. La regla es **construir verticales completas** (de la base al frontend, con tests) en vez de construir capas horizontales sueltas. No se modela toda la base de antemano: se modela la vertical que se está implementando.
>
> Referencias: alcance en `PROJECT.md` §5; decisiones en `PROJECT.md` §6; cómo en `ARCHITECTURE.md`; tests en `docs/TESTING.md`.

---

## Estado según código (revisión implementación)

**Veredicto:** las fases **0 a 5 están listas para dar por cerradas en el roadmap** y **arrancar Fase 6**, si el criterio es “vertical completa con tests” (`CLAUDE.md` §4). Pendiente de visión amplia: onboarding guiado, dashboard, AFIP real, **pagos** de cta. cte. (Fase 6).

| Fase | ¿Implementado en código? | Notas |
|------|--------------------------|--------|
| 0 | Sí | Monorepo, CI, skills, packages, tokens UI. Superpowers = proceso del equipo, no artefacto del repo. |
| 1 | Sí | Auth, tenants, invitaciones, RLS, 6 isolation specs, roles API+web. Migración `0010` (grants `usuarios_tenant`) incluida. Storage: RLS en SQL + `assertStoragePathDelTenant` en API (sin E2E cross-tenant de bucket). |
| 2 | Sí | CRUD, paginación, búsqueda, `solo_bajo_stock`, movimientos, soft-delete, SKU y `codigo_barras`, E2E inventario. |
| 3 | Sí | BullMQ, Storage, perfiles inventario+clientes, Levenshtein, reintento, 3 E2E import. Sin wizard de primera vez (ver exclusiones). |
| 4 | Sí | POS, clientes+saldo deudor al vender, factura A/B/**C**/ticket, remito/presupuesto, historial, export IVA, mock AFIP+cola, E2E ventas/AFIP. Sin cobro de deuda (Fase 6). |
| 5 | Sí | Proveedores+saldo acreedor, compras/gastos, stock/costo en compra con producto, export IVA Compras, import proveedores, E2E compras. Pagos a proveedor → Fase 6. |

**Deuda menor (no bloquea Fase 6):** E2E dedicados a factura C/ticket; test de integración Storage con JWT real; stress import 5k filas documentado; cobertura mínima en CI; migrar `next lint` → ESLint CLI.

**Antes de Fase 6 en tu máquina:** `pnpm db:migrate` (hasta `0011`), `pnpm test:integration`, `pnpm test:e2e` en verde.

---

## Fase 0 — Andamiaje y disciplina AI-native ✅

Objetivo: repo listo para desarrollar con disciplina de producción antes de escribir features de negocio.

- Monorepo (`ARCHITECTURE.md` §3): `apps/api`, `apps/web`, `services/afip`, `packages/*`, `docs/`, `.claude/skills/`
- **Superpowers** (metodología): ver `docs/AI-WORKFLOW.md`
- Skills de dominio en `.claude/skills/*/SKILL.md` (7 skills)
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

- Skill `afip-adapter`; `FacturadorMock` + `AFIP_MOCK_FAIL` (+ `FacturadorHttp` si `AFIP_SERVICE_URL`)
- POS, remito/presupuesto, **factura A/B/C y ticket**, historial, export IVA
- Clientes + saldo deudor al vender en cta. cte. (**cobro de deuda → Fase 6**)
- `FacturacionProcessor` (reintentos → `error_afip`)

### Post-hardening (calidad operativa)

| Área | Estado |
|------|--------|
| E2E existentes | auth (login, roles, activar-cuenta), inventario (gestión+movimientos), import×3, POS (+ factura A, stock insuficiente), remito, IVA, AFIP reintento, clientes CRUD/editar/cta. cte., equipo, ventas detalle |
| E2E pendientes | factura C/ticket (opcional; tipos ya en API/POS) |
| Tests API | ~167 unit + integration RLS (ver CI / `pnpm test:integration`) |
| Tests web | `api-client`, `ventas-pos`, forms, money, paginacion, `sesion` |
| OpenAPI | `@ApiOperation` + errores estándar; smoke ampliado en CI |
| Errores | `AllExceptionsFilter`; `ApiError` + `api-client` unificado |
| DB | Migraciones `0001`–`0010`; `pnpm db:check`; `pnpm db:migrate` |
| AFIP | `FacturadorMock` (default) + `FacturadorHttp` vía `AFIP_SERVICE_URL` |
| Infra | `infra/*.Dockerfile`, `docker-compose.prod.yml` |
| Docs | `TESTING.md`, `DATA-FETCHING.md`, `AI-WORKFLOW.md` |

**Exclusiones explícitas (no forman parte de 0–4):** dashboard dueño (Fase 7), tesorería/caja (Fase 6), **pagos** de cta. cte. activa, AFIP real en prod (`services/afip` es stub), **onboarding wizard** post-registro (sí existe `/importar` como módulo).

### Puerta a Fase 6

- [ ] Migraciones `0001`–`0011` aplicadas en el entorno que uses
- [ ] `pnpm lint && pnpm typecheck && pnpm test` en verde
- [ ] `pnpm test:integration` y `pnpm test:e2e` en verde (local o CI)

---

## Fase 5 — Compras y Proveedores ✅

- Proveedores CRUD + `saldo_acreedor` (cta. cte. pasiva al registrar compra)
- Compras/gastos; stock+costo si ítem con `producto_id`
- `GET /compras/iva-compras`; import perfil `proveedores`
- Migración `0011`; módulo `apps/api/src/modules/compras/`
- E2E: `compras/proveedores-crud`, `registrar-compra-cta-cte`, `export-iva-compras`, `import-proveedores`

### Post-hardening Fase 5

| Área | Estado |
|------|--------|
| E2E compras | proveedores CRUD, cta. cte., IVA export, import proveedores |
| Isolation | `compras.isolation.spec.ts` (proveedores, compras, items_compra) |
| OpenAPI smoke | `/proveedores`, `/compras`, `/compras/iva-compras` |

**Exclusiones (Fase 6):** pagos/cancelación deuda a proveedores y clientes.

## Fase 6 — Tesorería y Finanzas ⏳ siguiente

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
