# Roadmap de implementación — Posta

> Orden de ataque por fases. Cada fase entrega algo verificable. La regla es **construir verticales completas** (de la base al frontend, con tests) en vez de construir capas horizontales sueltas. No se modela toda la base de antemano: se modela la vertical que se está implementando.
>
> Referencias: alcance en `PROJECT.md` §5; decisiones en `PROJECT.md` §6; cómo en `ARCHITECTURE.md`.

---

## Fase 0 — Andamiaje y disciplina AI-native

Objetivo: que el repo esté listo para desarrollar con disciplina antes de escribir una sola feature de negocio.

- Monorepo con la estructura de `ARCHITECTURE.md` §3 (`apps/api`, `apps/web`, `services/afip`, `packages/*`, `docs/`, `.claude/skills/`).
- Instalar y configurar **Superpowers**.
- Escribir las **skills de dominio** base: `rls-policy`, `money`, `add-endpoint`, `e2e-feature`. (`afip-adapter` y `excel-import` pueden escribirse justo antes de su fase, pero dejarlas previstas.)
- Configurar MCPs (Context7, Supabase, Playwright, GitHub).
- Bootstrap de NestJS + Next.js + conexión a Supabase.
- **Spikes a cerrar y registrar en `PROJECT.md` §6:** ORM (Prisma vs Drizzle) con foco en compatibilidad con `SET LOCAL`/RLS; estrategia de validación compartida front/back.
- CI en GitHub Actions: lint + typecheck + unit + E2E en cada PR.
- Traducir los tokens de `DESIGN_SYSTEM.md` a la config de Tailwind y montar un par de componentes base (`ABtn`, `APill`, `APrice`) como prueba del sistema de diseño.

**Hecho cuando:** un "hola mundo" autenticado atraviesa todo el stack (front → API → Supabase) con un test unitario y un E2E en verde, y el pipeline de CI corre.

## Fase 1 — Cimiento multi-tenant (la base de seguridad)

Objetivo: dejar el aislamiento de datos blindado antes de cargar cualquier dato real.

- Auth con Supabase (registro, login, JWT).
- Modelo de **tenants** y de **usuarios con rol** (dueño/vendedor/contador).
- Mecanismo de **contexto de tenant por request** (`SET LOCAL app.tenant_id`) en la capa de acceso a datos.
- Primera tabla con RLS forzado + su **test de aislamiento entre tenants** (plantilla que se repetirá en cada tabla futura).
- Guards de rol en NestJS + test de que el vendedor no accede a finanzas.

**Hecho cuando:** existe el test que prueba que el tenant A no puede leer ni escribir datos del tenant B, y el de rol, ambos en verde. Esta fase valida la skill `rls-policy` en la práctica.

## Fase 2 — Primera vertical de negocio: Inventario ✅

Objetivo: la vertical más autónoma (no depende de AFIP), que ejercita dinero, tablas densas y el motor de Excel.

- Productos: SKU/código de barras, costo, precio, stock mínimo (dinero en `NUMERIC`, vía skill `money`).
- CRUD con la convención de `add-endpoint`.
- Listado denso en el front siguiendo `DESIGN_SYSTEM.md` (tabla cómoda, números legibles, búsqueda).
- Trazabilidad completa de movimientos de stock (entrada/salida/ajuste) con historial y formulario in-page.
- Alertas de stock bajo.
- Eliminar producto (soft-delete) desde la tabla.

**Hecho:** gestión de inventario completa de punta a punta, 51 tests unitarios + E2E en verde.

## Fase 3 — Motor de Importación Excel/CSV (el diferencial) 🚧

Objetivo: el corazón de la adopción. Se hace temprano porque valida la infra async y porque es el mayor riesgo de producto.

**Implementado:**
- Skill `excel-import` (`.claude/skills/excel-import.md`) con el patrón completo documentado.
- Subida a Supabase Storage vía URL firmada + job en **BullMQ** + worker async.
- Sanitización (fechas DD/MM/AAAA, comas/puntos de moneda, CUIT) y validación fila por fila con errores humanizados.
- Mapeador visual de columnas con pre-sugerencia por heurística (Levenshtein, umbral 80%).
- Grilla de corrección in-line (celda en rojo) + reintento de filas corregidas.
- Barra de progreso con polling cada 2s (polling → WebSocket post-MVP).
- Importar **inventario** y **clientes** (schema + perfil de importación para cada uno).
- 32 tests unitarios de column-mapper y sanitizer.

**Pendiente antes de marcar como ✅:**
- E2E completo del flujo de importación con archivo real.
- Migración `0003_clientes_imports.sql` aplicada en Supabase + bucket `imports` creado.
- Tests con Redis corriendo en CI.

**Hecho cuando:** se puede arrastrar un Excel real (incluido uno con errores y miles de filas), corregir in-line y cargar solo las filas válidas, sin colgar la UI. Unit + E2E.

## Fase 4 — Ventas / POS + adaptador AFIP (mock) ✅

Objetivo: la pantalla de uso diario, con la integración fiscal lista para enchufar.

- Escribir la skill `afip-adapter`.
- Interfaz `FacturadorElectronico` + implementación **mock** (incl. simulación de caída de AFIP).
- POS ágil (3 clics) siguiendo el POC; estado `pendiente_facturacion` + reintento encolado.
- Modo Remito/Presupuesto (no fiscal).
- Clientes y cuentas corrientes (activos): saldo deudor, historial.
- Registro/historial de ventas; exportación IVA Ventas a Excel.

**Implementado:**
- Skill `afip-adapter` con el patrón puerto/adaptador documentado.
- `FacturadorElectronico` interface + `FacturadorMock` (`AFIP_MOCK_FAIL` para simular caída).
- `VentasModule`: POS, historial paginado, detalle, reintento manual de facturación.
- `FacturacionProcessor` (BullMQ): 3 reintentos exponenciales; al agotar → `error_afip`.
- `ClientesModule`: CRUD completo + `saldo_deudor` actualizado en ventas con cta. cte.
- Descuento de stock atómico en la misma transacción de venta.
- Frontend: POS (carrito + ticket post-venta con CAE), historial, clientes con saldo deudor.
- 99 tests en verde (7 nuevos de ventas/AFIP mock).

## Fase 5 — Compras y Proveedores

- Registro de gastos/compras; saldos de proveedores (cuentas corrientes pasivas).
- Exportación IVA Compras a Excel.
- Importación de saldos iniciales de proveedores (reusa Fase 3).

## Fase 6 — Tesorería y Finanzas

- Caja chica: apertura/cierre, ingresos/egresos.
- Flujo de caja: bruto vs. neto real (restando costo de mercadería e impuestos estimados), en lenguaje claro.
- Saldos positivos/negativos con el tratamiento visual de `DESIGN_SYSTEM.md`.

## Fase 7 — Dashboard y vista Contador

- Dashboard del dueño: ventas día/mes, caja, ganancia real, alertas, KPIs (producto más vendido, horarios pico).
- Vista contador (solo lectura) con el detalle fiscal y todas las exportaciones a Excel.

---

## Después del MVP (no planificar ahora)

Integración real de AFIP (WSAA/WSFEV1 en el microservicio Python), y luego el Roadmap de `PROJECT.md` §5.2 (e-commerce, Mercado Pago, CRM, contabilidad expresa, asistentes IA). La infra de colas y el patrón de adaptadores del MVP son los que habilitan todo eso.

---

## Notas de secuencia

- **Por qué Inventario antes que Ventas:** es autónomo (no depende de AFIP), y Ventas necesita productos para vender. Inventario también deja lista la skill `money` y el patrón de tablas densas.
- **Por qué el motor de Excel temprano (Fase 3):** es el mayor riesgo de producto y la mayor promesa comercial; validarlo pronto. Además estrena la infra async que reusan las fases siguientes.
- **Por qué el cimiento multi-tenant primero (Fase 1):** cargar datos antes de blindar el aislamiento es pedir una fuga. La seguridad va en los cimientos, no como parche.
