---
name: error-handling
description: Patrón de catch blocks, logging y respuestas al cliente en el backend NestJS de Posta. Usar al escribir processors BullMQ, services con try/catch, o traducir errores técnicos a mensajes en español.
---

# Error Handling

Evita errores genéricos al usuario y estados inconsistentes en jobs async. El front consume `{ mensaje, errores? }` vía `HttpExceptionFilter` y `lib/api-client.ts`.

## HTTP (controllers / services síncronos)

| Situación | Qué hacer |
|---|---|
| Validación de negocio | `throw new BadRequestException({ mensaje: '...', errores: [{ campo, motivo }] })` |
| Recurso inexistente | `NotFoundException` con `mensaje` claro |
| Sin permisos | `ForbiddenException` — no filtrar datos sensibles en el mensaje |
| Error inesperado | Dejar propagar; Nest devuelve 500 — **no** capturar y silenciar |

**Nunca** devolver al cliente: stack traces, mensajes de Postgres (`Failed query`, `duplicate key`), ni `"Error"` / `"Failed to fetch"`.

## Workers BullMQ (imports, facturación, etc.)

```typescript
try {
  // trabajo principal
} catch (err) {
  this.logger.error(`Job ${id} falló`, err);           // log completo para ops
  await marcarEstadoError(id, mensajeParaUsuario(err)); // persistir estado legible
  throw err;                                            // BullMQ reintenta si aplica
}
```

### Actualizaciones de progreso (best-effort)

Las escrituras intermedias de progreso **no deben abortar** el job por un fallo transitorio de DB:

- Reintentar 2–3 veces con backoff corto (ver `withRetry` en `imports.processor.ts`)
- Si agotan reintentos: `logger.warn` y **continuar** el procesamiento
- El estado final (`completado` / `error`) es **crítico**: reintentar y, si falla, `throw` para que BullMQ reintente el job entero

### Traducir errores técnicos

Funciones dedicadas por dominio, no `err.message` crudo al usuario:

- Imports: `mensajeErrorImportacion()` en `import-errors.ts`
- Storage: `mensajeErrorStorage()` en `imports.service.ts`

Patrón: matchear subcadenas conocidas (`duplicate key`, `Failed query`) → mensaje en español rioplatense; fallback genérico pero accionable.

## Logging

```typescript
private readonly logger = new Logger(MiService.name);

this.logger.log('...');                    // hitos normales
this.logger.warn('...', err);              // degradación recuperable (progreso, retry)
this.logger.error('...', err);             // fallo que requiere atención
```

- **Log:** detalle técnico (stack, query hints)
- **Respuesta al usuario / job.errores:** solo `mensaje` humanizado

## Cuándo re-throw

| Contexto | Re-throw |
|---|---|
| HTTP request | Sí, si no es `HttpException` ya construida |
| BullMQ worker — fallo de negocio/DB en paso crítico | Sí (BullMQ reintenta) |
| BullMQ — update de progreso intermedio | No (best-effort tras reintentos) |
| `withTenant` en request | Sí — sin contexto de tenant es bug crítico |

## Checklist

- [ ] Usuario ve `mensaje` descriptivo en español
- [ ] Errores de validación incluyen `errores: [{ campo, motivo }]`
- [ ] Workers persisten estado terminal (`completado` / `error`) antes de re-throw
- [ ] Progreso intermedio con retry; no tumba el job por un blip de conexión
- [ ] Tests para traductores de error (`import-errors.spec.ts` como referencia)
