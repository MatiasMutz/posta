# Arquitectura — Posta

> El **cómo** técnico. Para el **qué/por qué** y el alcance, ver `PROJECT.md`. Las decisiones referenciadas (D-01 … D-14) están en `PROJECT.md` §6.

---

## 1. Panorama general

```
┌─────────────────────────────────────────────────────────────┐
│  Cliente (navegador / mobile-first)                          │
│  Next.js + React + TypeScript                                │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / REST (JWT)
┌───────────────────────────▼─────────────────────────────────┐
│  Monolito modular — NestJS (TypeScript)                      │
│  ┌──────────┬─────────┬───────────┬─────────────┐          │
│  │ Auth /   │ Ventas  │ Inventario│ Importación │          │
│  │ Tenants  │ (POS)   │ Stock     │ (Excel)     │          │
│  └──────────┴─────────┴───────────┴─────────────┘          │
│   capa de dominio  ·  capa de acceso a datos (tenant-aware)  │
└───────┬───────────────────────┬──────────────────┬──────────┘
        │                       │                  │
        │ SQL (RLS)             │ cola             │ HTTP (interfaz estable)
┌───────▼────────┐   ┌──────────▼────────┐  ┌──────▼─────────────────┐
│  Supabase      │   │  Redis + BullMQ   │  │  Microservicios de     │
│  Postgres+Auth │   │  worker(s) async  │  │  integración (Python)  │
│  Storage · RLS │   │  (Excel, retries) │  │  AFIP (mock→real), …   │
└────────────────┘   └───────────────────┘  └────────────────────────┘
```

Principios rectores:

1. **El dominio no conoce integraciones externas.** Ventas no sabe que existe AFIP; habla con una interfaz `FacturadorElectronico`. La implementación (mock o microservicio real) se inyecta. → D-05, D-07.
2. **Tenant-aware por defecto, fail-safe.** Toda query corre con un contexto de tenant; sin contexto, no devuelve nada. → D-06.
3. **Nada bloquea la UI.** Todo lo pesado o lo que dependa de terceros inestables pasa por la cola. → D-09.
4. **Tipos compartidos.** Los contratos de la API (DTOs, esquemas de validación) se definen una vez y se comparten entre back y front cuando es posible.

---

## 2. Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | Next.js (App Router) + React + TypeScript | Mobile-first. Server Components + fetch por defecto; React Query en pantallas interactivas. Ver `docs/DATA-FETCHING.md`. |
| UI / estilos | Tailwind CSS + tokens de `DESIGN_SYSTEM.md` | Los tokens del POC se traducen a variables/config de Tailwind. |
| Backend | NestJS + TypeScript | Monolito modular. Un módulo Nest por dominio. |
| Validación | **Zod** (`@posta/validation`, D-14) | Schemas compartidos front/back; errores API: `{ statusCode, mensaje, errores?: [{ campo, motivo }] }` |
| ORM / acceso a datos | **Drizzle** (D-13) | `withTenant()` + `SET LOCAL` por transacción. Ver skill `rls-policy`. |
| Base de datos | PostgreSQL (Supabase) | RLS forzado en todas las tablas con `tenant_id`. |
| Auth | Supabase Auth | JWT; el `tenant_id` y el rol viajan como claims / se resuelven al inicio del request. |
| Storage | Supabase Storage | Archivos Excel subidos para importación. |
| Cola async | BullMQ + Redis | Workers para parsing de Excel y, a futuro, webhooks y reintentos AFIP. |
| Integraciones | Microservicios Python (FastAPI), pensados para Lambda | AFIP primero. Librerías AFIP maduras viven mejor en Python. |
| Tests unit | Vitest (front) / Jest o Vitest (back) | |
| Tests E2E | Playwright | Hay MCP de Playwright; cuidado con el costo de tokens. |
| CI/CD | GitHub Actions | Lint + typecheck + unit + E2E en cada PR. |

> Donde dice "decidir en el primer spike", la decisión se toma con un spike corto al inicio, se registra en `PROJECT.md` §6 y se deja de discutir.

---

## 3. Estructura del repositorio (monorepo)

```
posta/
├── CLAUDE.md                  # reglas globales para el agente (raíz)
├── docs/
│   ├── PROJECT.md             # qué / por qué / alcance / decisiones
│   ├── ARCHITECTURE.md        # este archivo
│   ├── DESIGN_SYSTEM.md       # tokens, tipografía, componentes, navegación
│   ├── ROADMAP.md             # plan de fases
│   ├── TESTING.md             # estrategia de tests
│   ├── DATA-FETCHING.md       # RSC vs React Query vs POS
│   └── AI-WORKFLOW.md         # Superpowers, MCPs, DoD
├── .claude/
│   └── skills/                # skills de dominio propias (ver §9)
├── apps/
│   ├── api/                   # NestJS (monolito modular)
│   │   ├── drizzle/           # migraciones SQL (fuente de verdad)
│   │   └── src/modules/
│   │       ├── auth/          # JWT, registro, guards (+ CLAUDE.md)
│   │       ├── tenants/       # tenant actual, invitaciones de equipo
│   │       ├── inventario/    # productos, movimientos de stock
│   │       ├── clientes/      # CRUD, saldo deudor (cta. cte. activa)
│   │       ├── ventas/        # POS, historial, export IVA, AFIP mock
│   │       ├── imports/       # motor Excel/CSV (BullMQ)
│   │       ├── compras/       # proveedores, compras/gastos, IVA Compras
│   │       ├── tesoreria/     # caja chica, pagos cta. cte., flujo de caja
│   │       ├── dashboard/     # KPIs dueño + vista contador (fiscal)
│   │       └── afip/          # puerto FacturadorElectronico (+ CLAUDE.md)
│   └── web/                   # Next.js App Router
│       ├── app/               # rutas (dashboard, ventas, inventario, compras, caja, …)
│       ├── lib/               # api-client, paginacion, money (formato ARS)
│       └── tests/e2e/         # Playwright (+ .auth multi-rol)
├── services/
│   └── afip/                  # microservicio Python (producción; dev/CI usa mock en API)
├── packages/
│   ├── shared-types/
│   ├── validation/            # esquemas Zod compartidos
│   └── money/
├── infra/                     # Dockerfiles + docker-compose.prod.yml
├── scripts/                   # CI, openapi-smoke, sync migraciones
└── supabase/migrations/       # copia de drizzle/ para Supabase CLI
```

`CLAUDE.md` por módulo vive junto al código (`apps/api/src/modules/<modulo>/`). Skills versionadas en `.claude/skills/<nombre>/SKILL.md`.

---

## 4. Modelo de datos (lineamientos)

- **Toda tabla de negocio lleva `tenant_id UUID NOT NULL`.** Sin excepción. Las tablas globales (catálogos del sistema, no de negocio) son la única excepción y se marcan explícitamente.
- **`tenant_id` es la columna líder de los índices compuestos.** Crítico para performance de RLS (sin esto, RLS es órdenes de magnitud más lento). Ej.: índice en `(tenant_id, sku)` para productos, `(tenant_id, fecha)` para ventas.
- **Dinero: columnas `NUMERIC(p, 2)`** (precisión `p` adecuada al dominio, 2 decimales), nunca `float`/`double`. → D-08.
- **Identificadores: UUID** para entidades de negocio (evita enumeración entre tenants).
- **Auditoría mínima:** `created_at`, `updated_at`, y `created_by` (user) en entidades operativas.
- **Estados de venta:** incluir `pendiente_facturacion` para soportar la resiliencia de AFIP (D-07) desde el esquema, aunque la integración real llegue después.
- **Soft-delete** donde el negocio lo requiera (ej.: no borrar ventas históricas).

El esquema concreto se construye módulo por módulo siguiendo `ROADMAP.md`. No se modela toda la base de antemano: se modela la vertical que se está implementando.

---

## 5. Multi-tenancy y seguridad (núcleo del proyecto)

> Esta sección es un resumen. El **procedimiento exacto y verificable** para escribir policies vive en la skill de RLS (`.claude/skills/rls-policy/`). El agente DEBE consultarla antes de tocar cualquier policy o tabla con `tenant_id`.

Estrategia: **base de datos compartida, esquema compartido, aislamiento por `tenant_id` + Row-Level Security forzado.** Defensa en profundidad en dos capas:

1. **Capa de aplicación:** cada request resuelve el tenant del usuario autenticado (desde el JWT/sesión) y abre la transacción seteando el contexto de tenant.
2. **Capa de base de datos (la red de seguridad):** aunque la app olvide un filtro, las policies de RLS impiden ver o escribir filas de otro tenant.

Reglas inviolables (las repite y detalla la skill de RLS):

- Setear el contexto **siempre con `SET LOCAL`**, nunca `SET`. Con connection pooling, `SET` persiste entre requests de distintos tenants → fuga de datos catastrófica. `SET LOCAL` vive solo dentro de la transacción.
- `ENABLE ROW LEVEL SECURITY` **y** `FORCE ROW LEVEL SECURITY` en toda tabla con `tenant_id` (FORCE aplica RLS también al owner de la tabla).
- Policies de `SELECT/INSERT/UPDATE/DELETE` que comparan `tenant_id` contra el contexto de sesión (`current_setting('app.tenant_id')`).
- **Fail-safe:** si el contexto no está seteado, la policy debe resolver a "ninguna fila", nunca a "todas".
- Índice compuesto con `tenant_id` como primera columna en toda tabla con RLS.
- Tests obligatorios: por cada tabla con RLS, un test que verifique que el tenant A no puede leer NI escribir filas del tenant B (incluso forzando el `tenant_id` en el insert).

**Roles y permisos (RBAC) — capa adicional sobre el tenant:** dentro de un tenant, el rol (dueño/vendedor/contador) controla qué endpoints puede llamar y qué campos recibe (ej.: el vendedor nunca recibe `costo` ni `ganancia`). Se aplica con guards de NestJS y se testea.

---

## 6. Integraciones externas — patrón de adaptador

> Procedimiento detallado en la skill `afip-adapter`. Resumen del patrón:

- El dominio define una **interfaz** (puerto), ej. `FacturadorElectronico` con métodos como `emitirComprobante(venta) → { cae, vencimientoCae, … }`.
- Hay **dos implementaciones** detrás de esa interfaz:
  - `FacturadorMock`: responde como AFIP pero sin red. Es la que corre en dev y CI. Permite construir y testear todo el flujo de ventas antes de conectar AFIP real en producción.
  - `FacturadorAfipReal`: llama al microservicio Python (FastAPI) que encapsula WSAA (ticket de acceso, certificados `.crt`/`.key`) y WSFEV1 (autorización, CAE). Se enchufa cuando haya CUIT y certificados de homologación, **sin tocar el dominio de ventas**.
- La **resiliencia** (D-07) es parte del contrato: ante timeout/caída de AFIP, la venta se persiste como `pendiente_facturacion` y se encola un reintento. Esto se modela y se testea desde el inicio con el mock simulando caídas.
- El microservicio se diseña **stateless**, pensado para Lambda, consumido por el monolito vía HTTP. Mismo patrón servirá para ML/Shopify/Mercado Pago a futuro.

---

## 7. Procesamiento asíncrono (Excel y más)

Flujo del motor de importación (el diferencial del producto):

1. El usuario sube el archivo → se guarda en Supabase Storage → se crea un **job** en BullMQ.
2. La API responde de inmediato con un `jobId`; la UI muestra **barra de progreso** (polling o realtime).
3. El **worker** procesa por lotes: sanitiza (espacios, formato de fecha DD/MM/AAAA, comas/puntos de moneda, validación de CUIT), valida fila por fila y reporta errores **estructurados y humanizados** (ej.: `{ fila: 14, columna: "precio", valor: "150r", motivo: "contiene caracteres no válidos" }`).
4. El front renderiza los errores sobre la grilla (celda en rojo) y permite corrección in-line; solo se importan las filas válidas, nunca se rechaza todo el archivo.
5. Al confirmar, se escribe en la base dentro del tenant (respetando RLS) en transacción/lotes.

La misma infraestructura de colas y workers se reutiliza a futuro para webhooks de e-commerce, reintentos de AFIP y tareas programadas.

---

## 8. API REST — convenciones

> Detalle accionable en la skill `add-endpoint`. Lineamientos:

- REST con sustantivos en plural (`/clientes`, `/inventario/productos`, `/ventas`).
- Versionado `/api/v1`.
- Validación Zod en el borde (`ZodValidationPipe`); errores de campo: `{ campo, motivo }`.
- Respuestas: listados `{ data, meta }`; algunos recursos singleton `{ data }`; otros devuelven el row directo (unificar progresivamente).
- Errores HTTP: `{ statusCode, mensaje, errores? }` vía `HttpExceptionFilter`.
- JWT + `RolesGuard` + `withTenant` en cada handler de negocio.
- OpenAPI en `/api/v1/docs`; decoradores en `apps/api/src/common/swagger/error-responses.ts`.

---

## 9. Enfoque AI-native

> El detalle operativo (qué skill, qué MCP, cómo) está en `/CLAUDE.md`. Resumen del enfoque:

- **Superpowers** como framework base de disciplina (TDD red-green-refactor, brainstorming antes de codear, planning, code review entre tareas, debugging sistemático).
- **Skills de dominio propias** en `.claude/skills/` para lo que Superpowers no cubre (RLS, dinero, AFIP, Excel, convención de endpoints, testing E2E del repo).
- **MCPs** acotados (≤ 5–7 para no degradar al agente): Context7 (docs al día), Supabase (schema + RLS), Playwright (E2E), GitHub (PRs/CI).
- **Definición de hecho:** una feature no está terminada sin tests unitarios **y** E2E en verde, code review contra el plan, y typecheck/lint limpios.

---

## 10. Despliegue

- **Ahora:** Supabase (DB/Auth/Storage) + un PaaS para el monolito NestJS + Redis gestionado + el microservicio AFIP en Lambda/PaaS. CI/CD con GitHub Actions. → D-11.
- **Después (fase de escala):** migración a AWS con Terraform. La elección de Supabase no la bloquea porque el corazón es Postgres estándar; el trabajo principal sería reemplazar los servicios gestionados por equivalentes y portar las policies RLS (que son SQL estándar).
