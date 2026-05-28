# Data fetching — Posta Web

Regla de decisión para pantallas Next.js App Router.

## Server Components + `apiClient` (default)

Usar para:

- Listados navegables con URL (`searchParams`: paginación, filtros)
- Páginas mostly read-only al cargar (inventario, historial, clientes, detalle venta)
- SEO no aplica (app autenticada); reduce JS client

Patrón: `getSesionAutenticada()` / `requireSesion()` en `apps/web/lib/sesion.ts` — rol desde `GET /tenants/me`, no solo JWT.

## React Query (`@tanstack/react-query`)

Usar para:

- Polling (estado de importación — `PollingEstado.tsx`)
- Invalidación tras mutación en UI muy interactiva
- Dashboards futuros (Fase 7)

Provider: `apps/web/components/providers/QueryProvider.tsx`.

## Client components interactivos

- **Forms:** React Hook Form + Zod (`@posta/validation`) — inventario, clientes, movimientos
- **POS:** estado local + `validarVentaPos()` en `lib/ventas-pos.ts` (mismo `CreateVentaSchema` que la API)

## Errores

- Toda llamada HTTP: `apps/web/lib/api-client.ts`
- Clase `ApiError` y tipos en `@posta/shared-types` (`CampoError`, `ApiErrorResponse`)
- El backend devuelve `{ statusCode, mensaje, errores?: [{ campo, motivo }] }`

## No mezclar sin motivo

No duplicar fetch en RSC y React Query para el mismo dato en la misma pantalla.
