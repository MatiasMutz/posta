---
name: paginacion
description: Implementa listados paginados en API y web (PaginacionSchema, respuestaPaginada con meta.total, APaginacion, parsePagina). Usar en endpoints GET de colecciones, tablas server-side o filtros con paginación en Next.js.
---

# Paginación

Convención **obligatoria** para todo listado paginado (API + web).

## Regla de producto

- Toda pantalla con tabla de datos de servidor lleva paginación visible (`APaginacion`), aunque haya una sola página.
- **Excepción:** grillas en memoria (ej. revisión pre-import Excel) — no son listados de API.

## Checklist

- [ ] Query schema extiende `PaginacionSchema` de `@posta/validation`
- [ ] Servicio devuelve `{ items, total }` con `count()` sobre los mismos filtros
- [ ] Controller usa `respuestaPaginada()`
- [ ] Web: `parsePagina()` + `APaginacion` bajo la tabla
- [ ] Al cambiar filtros/búsqueda → resetear a página 1
- [ ] Tests cubren `meta.total`

## API

### Query params

```typescript
import { PaginacionSchema, LIMITE_PAGINA_DEFAULT } from '@posta/validation';

export const ListVentasQuerySchema = PaginacionSchema.extend({
  buscar: z.string().max(200).optional(),
});
```

| Param | Default | Máximo |
|---|---|---|
| `pagina` | `1` | — |
| `limite` | `50` (`LIMITE_PAGINA_DEFAULT`) | `200` |

### Respuesta

```typescript
import { respuestaPaginada } from '../../../common/pagination';

const { items, total } = await this.service.findAll(tenantId, query);
return respuestaPaginada(items, query.pagina, query.limite, total);
// → { data: T[], meta: { pagina, limite, total } }
```

### Servicio

- `limit` + `offset` en la query de filas.
- `total` con `count()` en paralelo (`Promise.all`) sobre los **mismos filtros**.
- Tipo: `ResultadoPaginado<T>` → `{ items, total }`.
- Índice DB para orden/filtro: `(tenant_id, campo_orden)`.

## Web

Helpers: `apps/web/lib/paginacion.ts` (`parsePagina`, `LIMITE_PAGINA_DEFAULT`).

```tsx
import { Suspense } from 'react';
import { APaginacion } from '@/components/ui';
import { LIMITE_PAGINA_DEFAULT, parsePagina } from '@/lib/paginacion';

// Server Component: leer searchParams.pagina
<Suspense fallback={null}>
  <APaginacion pagina={pagina} limite={LIMITE_PAGINA_DEFAULT} total={total} />
</Suspense>
```

Tipado respuesta:

```typescript
const result = await apiClient<ApiResponse<Producto[]>>(url, { token });
const total = result.meta?.total ?? result.data.length;
```
