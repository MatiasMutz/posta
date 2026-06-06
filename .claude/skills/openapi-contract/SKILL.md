---
name: openapi-contract
description: Verifica que el OpenAPI de NestJS no rompió contratos antes de pushear (smoke de paths, decoradores, cambios breaking). Usar al agregar/modificar endpoints o antes de release con consumidores externos.
---

# OpenAPI Contract

La API expone Swagger en `/api/v1/docs` (JSON en `/api/v1/docs-json`). Decoradores en `apps/api/src/common/swagger/`.

## Checklist antes de pushear

- [ ] Endpoints nuevos tienen `@ApiTags`, `@ApiBearerAuth` y decoradores de `controller-docs.ts`
- [ ] Errores documentados con `error-responses.ts` (`campo` / `motivo`)
- [ ] Paths bajo prefijo global `api/v1` (ver `main.ts`)
- [ ] Smoke en verde con API levantada:

```bash
pnpm --filter api dev   # o proceso en :3001
./scripts/openapi-smoke.sh
```

El script verifica que los paths principales del producto existen en el spec. Si agregás un módulo nuevo con rutas de primer nivel, **sumá el path** a `scripts/openapi-smoke.sh`.

## Cambios breaking — revisar manualmente

Antes de mergear cambios en DTOs o rutas:

1. Exportar spec actual: `curl -s http://localhost:3001/api/v1/docs-json > /tmp/openapi-before.json`
2. Aplicar cambios y exportar de nuevo
3. Diff de paths y schemas:

```bash
# Paths removidos o renombrados = breaking
diff <(jq -r '.paths | keys[]' /tmp/openapi-before.json | sort) \
     <(jq -r '.paths | keys[]' /tmp/openapi-after.json | sort)
```

Breaking típicos a evitar sin versión nueva:

- Renombrar o eliminar paths
- Cambiar tipo de campo en respuesta (string → number)
- Hacer obligatorio un query param que era opcional
- Renombrar `mensaje` / `errores` en respuestas de error

## Convención de respuestas

| Tipo | Shape |
|---|---|
| Éxito colección | `{ datos: T[], meta: { total, pagina, por_pagina } }` |
| Error HTTP | `{ statusCode, mensaje, errores?: [{ campo, motivo }] }` |
| Montos | `string` (`"1234.56"`) — skill `money` |

## CI

`docs/TESTING.md`: orden de pipeline incluye `openapi-smoke` después de integration tests. Un path faltante en el smoke falla CI.

## Cuando importa más

- SDK generado desde OpenAPI
- Consumidores externos (contador, integraciones)
- Contratos compartidos con el front (`@posta/validation` debe alinearse con el spec)

Si solo cambiás lógica interna sin tocar rutas/DTOs, el smoke alcanza. Si cambiás schemas Zod exportados, corré también `pnpm typecheck` en web.
