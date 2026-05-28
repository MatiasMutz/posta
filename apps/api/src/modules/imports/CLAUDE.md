# Módulo imports

Responsabilidades: motor de importación de Excel/CSV para inventario y clientes.

## Flujo

```
GET  /imports/upload-url?filename&tipo  → { uploadUrl, storagePath }
POST /imports/analizar   { storagePath, tipo }     → { headers, sugerencias, camposDisponibles }
POST /imports            { storagePath, tipo, columnMap } → { jobId }
GET  /imports/:jobId/estado                         → { estado, fase, progreso, total, filasOk, filasError, errores? }
POST /imports/:jobId/reintento { correcciones }     → { importados, erroresResidual }
```

## Reglas críticas

- **Nada bloquea la UI.** El procesamiento pesado corre en `ImportsProcessor` (BullMQ worker). La API responde con `{ jobId }` en menos de 200ms.
- **RLS siempre.** El worker usa `withTenant(tenantId, ...)` para todas las operaciones de DB. El `tenantId` viaja en el payload del job BullMQ.
- **Solo filas válidas se escriben.** Las inválidas se almacenan en `import_jobs.errores` como `FilaConError[]` para corrección in-line posterior.
- **Upsert en re-importaciones.** Inventario: match por SKU → código de barras; si existe, actualiza precio/costo/stock y registra movimiento `ajuste` si el stock cambió. Si no existe, crea con movimiento `entrada`. Clientes: match por CUIT → email.
- **Duplicados en el mismo archivo** (mismo SKU/barras/CUIT/email en dos filas) se rechazan en validación con mensaje claro; se conserva la primera aparición.
- **Idempotencia del reintento.** `POST /:jobId/reintento` solo escribe las filas corregidas que pasan validación; usa el mismo upsert que el job principal.
- **Dinero (skill money).** `sanitizarMonto` normaliza "$ 1.234,56" → "1234.56" (string NUMERIC). Nunca se usa `parseFloat`.

## Perfiles de importación

| Tipo | Archivo |
|---|---|
| inventario | `profiles/inventario.profile.ts` — crea productos + movimiento inicial |
| clientes | `profiles/clientes.profile.ts` — crea clientes |

Para agregar un nuevo tipo: crear el perfil en `profiles/`, agregarlo a `ALIASES_POR_TIPO` en `column-mapper.ts`, extender `TipoImportSchema` en `packages/validation`.

## Column mapper

Normaliza → match exacto → Levenshtein con umbral 80%. Nunca auto-mapea por debajo del umbral; el usuario confirma antes de procesar.

## Storage

Bucket: `imports`. Archivos en `{tenantId}/{timestamp}-{filename}`.
- El frontend obtiene la URL firmada vía `GET /imports/upload-url` y sube directo a Supabase Storage.
- El worker descarga con el admin client (`SUPABASE_SERVICE_ROLE_KEY`).
- Las policies de Storage están en `drizzle/0005_storage_imports.sql` (bucket `imports`).
