# Excel Import — Referencia

## Agregar un nuevo tipo importable

### 1. Perfil (`profiles/{entidad}.profile.ts`)

```typescript
export const ENTIDAD_CAMPOS: CampoDefinicion[] = [
  {
    campo: 'nombre',
    requerido: true,
    sanitizar: sanitizarTexto,
    validar: (v) => v.length <= 200 || 'Nombre demasiado largo',
  },
  // montos → sanitizarMonto; fechas → sanitizarFecha; CUIT → sanitizarCuit
];
```

### 2. Aliases (`column-mapper.ts`)

```typescript
const ENTIDAD_ALIASES: Record<string, string[]> = {
  nombre: ['nombre_producto', 'descripcion', ...],
};

const ALIASES_POR_TIPO = {
  inventario: INVENTARIO_ALIASES,
  clientes: CLIENTES_ALIASES,
  entidad: ENTIDAD_ALIASES, // ← agregar
};
```

### 3. Schema Zod (`packages/validation/src/imports.ts`)

```typescript
export const TipoImportSchema = z.enum(['inventario', 'clientes', 'entidad']);
```

Luego `pnpm build:packages`.

### 4. Persistencia

- Agregar caso en `ImportsService` (orquestación) y en `ImportsProcessor.process()`.
- Crear `persistencia-{entidad}.ts` con upsert idempotente.
- Stock del Excel reemplaza el actual (movimiento `ajuste` si cambió).

### 5. Tests

- Aliases en `__tests__/column-mapper.spec.ts`
- Sanitización en `__tests__/sanitizer.spec.ts`
- Integración con mock DB en `imports.processor.integration.spec.ts`

## Reglas invariantes

- **Nada bloquea el request.** Parsing y persistencia masiva → worker.
- **Filas con error no detienen la importación.** Se acumulan para corrección posterior.
- **Reintento idempotente.** Solo procesa filas recibidas; mismo upsert que el job principal.
- **`withTenant` en todas las escrituras del worker.**

## Supabase Storage — bucket `imports`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('imports', 'imports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "usuarios pueden subir sus imports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'imports' AND
  (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
);

CREATE POLICY "usuarios pueden leer sus imports"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'imports' AND
  (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
);
```

## Diagrama de flujo completo

```
Frontend                              API                          BullMQ Worker
   │                                   │                               │
   │─── GET /imports/upload-url ──────→│                               │
   │←── { uploadUrl, storagePath } ────│                               │
   │─── PUT uploadUrl (archivo) ──────→ Supabase Storage               │
   │─── POST /imports/analizar ────────→│ descarga + extrae headers     │
   │←── { headers, sugerencias } ──────│                               │
   │  [usuario confirma mapeo]         │                               │
   │─── POST /imports ─────────────────→│ crea import_jobs + encola     │
   │←── { jobId } ─────────────────────│                               │
   │─── GET /imports/:id/estado ──────→│ polling ~2s                    │
   │                                   │                    parsea/valida/importa
   │←── { estado, filasOk, errores? } ─│                               │
   │─── POST /imports/:id/reintento ───→│ correcciones in-line          │
```
