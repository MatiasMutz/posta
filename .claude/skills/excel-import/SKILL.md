---
name: excel-import
description: Implementa o extiende el motor de importación Excel/CSV (upload async, BullMQ, sanitización, mapeo Levenshtein, corrección in-line). Usar al tocar apps/api/src/modules/imports/ o agregar entidades importables.
---

# Excel Import

Motor async de importación Excel/CSV (Fase 3). **Nada pesado en el request** — el worker BullMQ procesa el archivo.

## Flujo

```
Front                          API                         Worker (BullMQ)
 │── GET /imports/upload-url ──→│ signed URL Supabase Storage
 │── PUT archivo ──────────────→ Storage
 │── POST /imports/analizar ───→│ headers + sugerencias Levenshtein (≥80%)
 │── POST /imports ────────────→│ crea import_jobs + encola job → { jobId }
 │── GET /imports/:id/estado ──→│ polling ~2s
 │── POST /imports/:id/reintento → filas corregidas in-line (idempotente)
```

## Checklist

- [ ] Worker usa `withTenant(tenantId, ...)` — `tenantId` en payload del job
- [ ] Montos: `sanitizarMonto` — nunca `parseFloat` (skill `money`)
- [ ] Solo filas válidas persisten; errores en `import_jobs.errores` (`FilaConError[]`)
- [ ] Re-import = upsert (inventario: SKU → código barras; clientes: CUIT → email)
- [ ] Duplicados intra-archivo: `import-validators.ts`
- [ ] Rol: solo `dueno` (`@Roles('dueno')` + UI)
- [ ] Tests: `__tests__/column-mapper.spec.ts`, `sanitizer.spec.ts`, isolation spec

## Archivos clave

| Archivo | Rol |
|---|---|
| `imports.processor.ts` | Worker BullMQ |
| `imports.service.ts` | Orquestación API |
| `sanitizer.ts` | Fechas DD/MM/AAAA, montos ARS, CUIT |
| `column-mapper.ts` | Aliases + Levenshtein |
| `profiles/*.profile.ts` | Campos por entidad |
| `persistencia-*.ts` | Upsert por tipo |

## Sanitizadores (`sanitizer.ts`)

| Función | Entrada | Salida |
|---|---|---|
| `sanitizarTexto` | `" Coca Cola  "` | `"Coca Cola"` |
| `sanitizarMonto` | `"$ 1.234,56"` | `"1234.56"` |
| `sanitizarEntero` | `"20.0"` | `"20"` |
| `sanitizarFecha` | `"15/03/2024"` | `"2024-03-15"` |
| `sanitizarCuit` | `"20-12345678-9"` | `"20123456789"` |

## Extender entidad importable

Ver [reference.md](reference.md) — perfil, aliases, schema Zod, persistencia y tests.

## Setup (una vez)

- Bucket Supabase Storage `imports` (RLS por tenant en path)
- `REDIS_URL=redis://localhost:6379` en `.env` de la API
- Detalle SQL del bucket: [reference.md](reference.md)
