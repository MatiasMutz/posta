# @posta/shared-types

Tipos transversales de auth y contratos HTTP.

| Export | Uso |
|--------|-----|
| `Rol`, `TenantUser` | JWT / guards NestJS |
| `ApiResponse<T>` | Listados `{ data, meta? }` |
| `CampoError` | `{ campo, motivo }` en validación Zod |
| `ApiErrorResponse` | Body JSON de error HTTP |
| `ApiError` | Clase lanzada por `apps/web/lib/api-client.ts` |

DTOs de dominio y schemas Zod: `@posta/validation` (D-14).
