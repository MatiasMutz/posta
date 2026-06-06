# CLAUDE.md — Posta

Este archivo es el centro de mando para cualquier agente de IA que trabaje en este repo. **Leelo entero antes de tocar código.** Si una instrucción de un prompt entra en conflicto con una regla inviolable de acá, gana esta regla; avisá el conflicto en vez de saltearla.

---

## 1. Qué es Posta (30 segundos)

SaaS multi-tenant de gestión para PyMEs argentinas sin conocimientos técnicos ni contables. Centraliza ventas, stock, compras, tesorería y facturación AFIP detrás de una UX simple, mobile-first, que **oculta la complejidad fiscal**. El diferencial es la **experiencia de uso** y un **motor de importación de Excel infalible** que vence el miedo a migrar.

Contexto completo en `docs/PROJECT.md`. Arquitectura en `docs/ARCHITECTURE.md`. Diseño en `docs/DESIGN_SYSTEM.md`. Plan de fases en `docs/ROADMAP.md`. Tests en `docs/TESTING.md`.

---

## 2. Cómo orientarte en el repo

1. **Siempre** arrancá leyendo `docs/PROJECT.md` (qué/por qué/alcance + decisiones D-01…D-12) y `docs/ARCHITECTURE.md` (cómo).
2. Antes de tocar un módulo, leé su `CLAUDE.md` propio si existe (`apps/api/src/modules/<modulo>/CLAUDE.md`).
3. Antes de una tarea de un tipo conocido (endpoint, RLS, dinero, AFIP, Excel, E2E), **leé la skill correspondiente en `.claude/skills/` y seguila**. Si una skill aplica, su uso no es opcional.
4. Estructura del repo: ver `docs/ARCHITECTURE.md` §3.

---

## 3. Reglas inviolables

Estas reglas no se negocian. Romperlas es un bug crítico aunque "funcione".

### Seguridad / multi-tenancy
- **Toda tabla de negocio lleva `tenant_id` y RLS forzado** (`ENABLE` + `FORCE ROW LEVEL SECURITY`). Ver skill `rls-policy`.
- Contexto de tenant **siempre con `SET LOCAL`, nunca `SET`** (con pooling, `SET` filtra datos entre tenants).
- **Fail-safe:** sin contexto de tenant, las queries devuelven **cero filas**, nunca todas.
- `tenant_id` es la **primera columna** de los índices compuestos de toda tabla con RLS.
- Por cada tabla con RLS, debe existir un test que pruebe que el tenant A no puede leer **ni escribir** datos del tenant B.
- El rol (dueño/vendedor/contador) se valida en el **backend**, no solo en la UI. Un vendedor nunca recibe `costo`/`ganancia` en una respuesta de la API.

### Dinero
- **Nunca `float`/`double` para dinero.** Base: `NUMERIC`. App: tipo dedicado del paquete `packages/money`. Ver skill `money`.
- Formato local siempre: ARS, miles con punto, decimales con coma, fechas DD/MM/AAAA.

### Integraciones externas
- El dominio **nunca** llama directo a un servicio externo. Siempre detrás de una interfaz/adaptador inyectado. Ver skill `afip-adapter`.
- La integración AFIP en dev/CI usa el **mock**; el real se enchufa en producción sin tocar el dominio. La resiliencia ("pendiente de facturación" si AFIP se cae) se implementa y testea desde ya.

### Asincronía
- Nada que sea pesado o dependa de terceros inestables corre en el request. Va a la cola (BullMQ). El parser de Excel **nunca** bloquea la UI; siempre con barra de progreso.

### Diseño
- Respetar `docs/DESIGN_SYSTEM.md` (dirección Editorial cálido). Usar tokens, no hex hardcodeados. Mantener el quiebre de navegación flotante y el tratamiento de montos en ARS. Mobile-first real.
- Ocultar jerga fiscal al dueño/vendedor; mostrarla solo en la vista de contador.

---

## 4. Definición de "hecho" (Definition of Done)

Una feature **no está terminada** hasta que:

1. Tiene **tests unitarios** que cubren la lógica de dominio.
2. Tiene **tests E2E** (Playwright) que cubren el flujo del usuario.
3. Todos los tests pasan en verde, más `typecheck` y `lint` limpios.
4. Si toca datos multi-tenant: tiene el test de aislamiento entre tenants (regla §3).
5. Pasó el **code review contra el plan** (lo provee Superpowers).
6. No introdujo `float` en dinero, ni llamadas directas a servicios externos, ni `SET` (en vez de `SET LOCAL`).
7. **Todos los errores que ve el usuario son descriptivos.** Nunca mostrar "Failed to fetch", "Error", o mensajes genéricos del runtime. Los errores de red se capturan y se explican en lenguaje claro. Los errores HTTP usan el campo `mensaje` del backend. El módulo `lib/api-client.ts` del web maneja esto centralmente.

"Después escribo el test" no es aceptable. Trabajamos con **TDD: el test que falla va primero** (lo impone Superpowers).

---

## 5. Disciplina de desarrollo — Superpowers

Este proyecto usa **Superpowers** como framework base de skills. Su metodología es obligatoria:

- **Brainstorming antes de codear:** ante una tarea ambigua, hacé preguntas y proponé un diseño aceptable antes de escribir código.
- **Plan antes de implementar:** descomponer en tareas chicas con archivos y tests escritos antes de tocar código.
- **TDD red-green-refactor:** el test que falla primero. Si se escribió implementación sin un test que falle antes, se borra y se rehace.
- **Subagentes + code review:** implementar contra el plan y revisar el resultado contra el plan; los problemas críticos bloquean el avance.
- **Debugging sistemático:** entender la causa raíz antes de "arreglar". No parchear lo que no se entiende.

Las skills de dominio propias (`.claude/skills/`) **componen** con Superpowers; no lo reemplazan.

---

## 6. Herramientas (MCPs) y cuándo usarlas

Mantener el set acotado (≤ 5–7) para no degradar la calidad de decisión del agente.

- **Context7** — siempre que uses una librería/API: verificar la doc **actual** antes de escribir, en vez de confiar en memoria (puede estar desactualizada).
- **Supabase MCP** — inspeccionar schema, gestionar usuarios auth y **revisar policies RLS** sin salir de la terminal. Usar al trabajar con base de datos o RLS.
- **Playwright MCP** — para E2E y verificación de UI. **Solo activarlo durante desarrollo E2E real** (specs Playwright, verificación visual). Es pesado en tokens; no invocarlo en tareas de backend, migraciones ni refactors de API.
- **GitHub MCP** — PRs, issues, estado de CI.

No instalar el filesystem MCP (Claude Code ya trae herramientas de archivo nativas). No sumar MCPs sin un uso claro: cada uno expande la superficie de ataque y satura la lista de tools.

---

## 7. Skills de dominio (en `.claude/skills/`)

> A crear al inicio del proyecto (ver `docs/ROADMAP.md`, Fase 0). Cada una encapsula un procedimiento verificable que Superpowers no cubre:

| Skill | Para qué |
|---|---|
| `rls-policy` | Escribir una policy RLS correcta (SET LOCAL, FORCE, fail-safe, índice líder, test de aislamiento). |
| `money` | Manejar montos: NUMERIC en base, tipo dedicado en app, formato ARS, cero floats. |
| `db-migration` | Crear migraciones Drizzle seguras: sin DROP accidentales, tenant_id + RLS + índices, sync a Supabase. |
| `error-handling` | Catch blocks en backend: logging, mensajes al cliente, progreso best-effort en workers, re-throw. |
| `openapi-contract` | Verificar que OpenAPI no rompió contratos (`openapi-smoke.sh`) antes de pushear. |
| `caveman-debugging` | Debug con logs temporales `[DEBUG-TMP]` → observar → remover → fijar con test. |
| `afip-adapter` | El patrón puerto/adaptador para AFIP (mock↔real), resiliencia y "pendiente de facturación". |
| `excel-import` | Implementar/extender el motor de importación: job async, sanitización, validación humanizada in-line. |
| `add-endpoint` | Agregar un endpoint REST con la convención del repo (DTO/Zod, guard de rol, contexto de tenant, OpenAPI, tests). |
| `paginacion` | Listados paginados: `PaginacionSchema`, `meta.total` en API, `APaginacion` en tablas del web. |
| `e2e-feature` | Testear una feature de punta a punta con Playwright en este repo (setup, datos por tenant, teardown). |

Cuando se cierre un patrón nuevo y repetible, escribir una skill nueva (Superpowers sabe hacerlo).

---

## 8. Convenciones rápidas

- **Idioma del producto:** español rioplatense. **Idioma del código** (nombres, comentarios técnicos): consistente con lo que ya exista en el módulo; nombres de dominio en español están bien (`venta`, `comprobante`, `saldo`).
- **Commits / PRs:** chicos y enfocados, uno por tarea del plan.
- **No re-litigar decisiones cerradas** (D-01…D-12 en `PROJECT.md`). Si creés que una decisión está mal, plantealo explícitamente al humano; no la cambies por tu cuenta.
- Ante una decisión técnica abierta marcada como "spike" en `ARCHITECTURE.md`: hacé el spike corto, registrá la decisión en `PROJECT.md` §6 y seguí.
