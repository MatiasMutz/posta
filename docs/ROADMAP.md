# Roadmap de implementación — Posta

> Orden de ataque por fases. Cada fase entrega algo verificable. La regla es **construir verticales completas** (de la base al frontend, con tests) en vez de construir capas horizontales sueltas. No se modela toda la base de antemano: se modela la vertical que se está implementando.
>
> Referencias: alcance en `PROJECT.md` §5; decisiones en `PROJECT.md` §6; cómo en `ARCHITECTURE.md`; tests en `docs/TESTING.md`.

---

## Estado según código (revisión implementación)

**Veredicto:** las fases **0 a 7 están listas para dar por cerradas en el roadmap**. Pendiente de visión amplia: onboarding guiado, AFIP real.

| Fase | ¿Implementado en código? | Notas |
|------|--------------------------|--------|
| 0 | Sí | Monorepo, CI, **11 skills**, packages, tokens UI. Superpowers = proceso del equipo, no artefacto del repo. |
| 1 | Sí | Auth, tenants, invitaciones, RLS, **8 isolation specs** + Storage JWT (`storage.isolation.integration.spec.ts`), roles API+web. Migraciones hasta `0013` (InitPlan RLS). |
| 2 | Sí | CRUD, paginación, búsqueda, `solo_bajo_stock`, movimientos, soft-delete, SKU y `codigo_barras`, E2E inventario. |
| 3 | Sí | BullMQ, Storage, perfiles inventario+clientes+proveedores, Levenshtein, reintento, 3 E2E import. Sin wizard de primera vez (ver exclusiones). |
| 4 | Sí | POS, clientes+saldo deudor al vender, factura A/B/**C**/ticket, remito/presupuesto, historial, export IVA, mock AFIP+cola, E2E ventas/AFIP. |
| 5 | Sí | Proveedores+saldo acreedor, compras/gastos, stock/costo en compra con producto, export IVA Compras, import proveedores, E2E compras. |
| 6 | Sí | Caja chica (apertura/cierre), movimientos, flujo de caja, pagos cliente/proveedor, E2E tesorería. |
| 7 | Sí | Dashboard dueño (`/dashboard`), vista contador (`/contador`), KPIs, export IVA, E2E dashboard. |

**Deuda menor (no bloquea avanzar):** E2E dedicados a factura C/ticket; stress import 5k filas documentado; cobertura mínima en CI; migrar `next lint` → ESLint CLI; extender contrato costo/ganancia a contador y dashboard.

### Estado operativo actual

| Área | Estado |
|------|--------|
| Migraciones DB | `0001`–`0013` (`pnpm db:migrate`, `pnpm --filter api db:check`) |
| Tests API unit | ~221 (`pnpm test`) |
| Tests integration | ~60 — 8× `*.isolation.spec.ts`, Storage JWT, BullMQ smoke (`pnpm test:integration`) |
| Tests web unit | ~49 (`pnpm --filter web test`) |
| E2E | 27 specs — chromium + mobile; job AFIP resilience aparte |
| Contratos roles | `costo-ganancia.contract.spec.ts` (vendedor sin costo/ganancia en API) |
| Errores API | `AllExceptionsFilter`; `ApiError` + `api-client` unificado |
| Nav web | `NavShell` en root layout (persistente); Panel ▦ arriba → inicio por rol |

**Verificación local antes de nuevas fases:**

```bash
pnpm db:migrate
pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration
pnpm --filter api db:check
pnpm test:e2e
```

---

## Fase 0 — Andamiaje y disciplina AI-native ✅

Objetivo: repo listo para desarrollar con disciplina de producción antes de escribir features de negocio.

- Monorepo (`ARCHITECTURE.md` §3): `apps/api`, `apps/web`, `services/afip`, `packages/*`, `docs/`, `.claude/skills/`
- **Superpowers** (metodología): ver `docs/AI-WORKFLOW.md`
- Skills de dominio en `.claude/skills/*/SKILL.md` (**11 skills** — ver `CLAUDE.md` §7)
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

**Estado:** ✅ Isolation specs: tenants, invitaciones, inventario, clientes, imports, ventas, compras, tesorería. Storage cross-tenant con JWT. E2E roles + equipo.

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
- Entidades: inventario + clientes + proveedores
- E2E: happy path, errores, clientes

---

## Fase 4 — Ventas / POS + adaptador AFIP (mock) ✅

- Skill `afip-adapter`; `FacturadorMock` + `AFIP_MOCK_FAIL` (+ `FacturadorHttp` si `AFIP_SERVICE_URL`)
- POS, remito/presupuesto, **factura A/B/C y ticket**, historial, export IVA
- Clientes + saldo deudor al vender en cta. cte. (**cobro de deuda → Fase 6**)
- `FacturacionProcessor` (reintentos → `error_afip`)

### Post-hardening Fase 4 (histórico)

E2E: auth, inventario, import×3, POS, remito, IVA, AFIP reintento, clientes, equipo, ventas detalle. Pendiente opcional: E2E factura C/ticket dedicados.

**Exclusiones que aplicaban en 0–4 (ya resueltas en fases posteriores):** dashboard (Fase 7), tesorería/pagos cta. cte. (Fase 6). Siguen fuera de alcance: AFIP real en prod (`services/afip` es stub), **onboarding wizard** post-registro (sí existe `/importar` como módulo).

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

## Fase 6 — Tesorería y Finanzas ✅

- Caja chica: apertura/cierre diario, ingresos/egresos manuales
- Flujo de caja: facturación bruta vs dinero neto (costo mercadería, IVA estimado)
- Pagos de cuenta corriente activa (clientes) y pasiva (proveedores)
- Migración `0012`; módulo `apps/api/src/modules/tesoreria/`
- E2E: `tesoreria/caja-pagos`

### Post-hardening Fase 6

| Área | Estado |
|------|--------|
| Isolation | `tesoreria.isolation.spec.ts` (sesiones_caja, movimientos_caja, pagos_cliente, pagos_proveedor) |
| OpenAPI smoke | `/tesoreria/caja`, `/tesoreria/pagos/*`, `/tesoreria/flujo-caja` |

## Fase 7 — Dashboard y vista Contador ✅

- **Dashboard dueño** (`/dashboard`): KPIs ventas día/mes, caja, cuentas a cobrar, ganancia estimada, gráfico SVG 7 días, top productos, horarios pico, alertas, accesos rápidos.
- **Vista contador** (`/contador`): resumen fiscal IVA ventas/compras, comprobantes paginados, export IVA, sin costos/ganancias.
- API: `GET /dashboard`, `GET /contador/resumen`, `GET /contador/comprobantes`.
- Tests: unit (`iva`, `contador.service`, `dashboard.access`), web (`auth`, `dashboard-utils`), E2E (`dashboard/*`, roles actualizados).

### Post-hardening Fase 7

| Área | Estado |
|------|--------|
| API | `GET /dashboard`, `GET /contador/resumen`, `GET /contador/comprobantes` |
| Roles | Vendedor bloqueado en dashboard/contador (API + middleware web) |
| E2E | `dashboard/dashboard-dueno`, `dashboard/contador-vista` |

---

## Después del alcance actual

AFIP real (`services/afip/`), luego `PROJECT.md` §5.2 (e-commerce, Mercado Pago, CRM, contabilidad expresa, IA).

---

## Notas de secuencia

- **Inventario antes que Ventas:** autónomo; ejercita `money` y tablas densas.
- **Excel temprano (Fase 3):** mayor riesgo de producto; valida infra async.
- **Multi-tenant primero (Fase 1):** seguridad en cimientos, no parche.
