---
name: caveman-debugging
description: Approach de debugging con logs temporales para bugs complejos (tesorería, imports, multi-tenant). Usar cuando breakpoints no alcanzan o el flujo cruza async/DB/colas.
---

# Caveman Debugging

No es un MCP ni una herramienta: es un **approach** deliberado para aislar bugs en flujos complejos (BullMQ, `withTenant`, cálculos de dinero, RLS).

## Cuándo usarlo

- El bug es intermitente o depende de orden async
- Cruzás varias capas (processor → service → DB → cola)
- Los tests pasan pero el comportamiento en runtime falla
- Breakpoints no son prácticos (worker, CI, Supabase remoto)

## Procedimiento

### 1. Acotar la hipótesis

Escribí en una línea qué esperás vs qué pasa. Ej: *"El saldo_acreedor debería sumar 100 pero queda en 0 tras import"*.

### 2. Agregar logs temporales (mínimos)

```typescript
this.logger.debug(`[DEBUG-TMP] guardarFilas fila=${i} saldo=${toNumericString(saldo)} tenant=${tenantId}`);
```

Reglas:

- Prefijo fijo `[DEBUG-TMP]` para encontrarlos y borrarlos después
- Loguear **valores concretos** (ids, montos como string, fase del job) — no "entrando a función"
- En dinero: `toNumericString(m)` — nunca `Number(monto)`
- En workers: incluir `jobId` / `tenantId` en cada línea

### 3. Observar

- Reproducir **un** caso mínimo (un CSV, una venta, un pago)
- Correr solo el test o flujo afectado: `pnpm test:integration -- <spec>` o worker en dev
- Anotar la secuencia de logs vs la hipótesis

### 4. Remover los logs

Antes de commitear:

```bash
rg '\[DEBUG-TMP\]' apps/
```

Debe devolver vacío. Los logs temporales **no** van al PR.

### 5. Fijar con test

Convertir el caso reproducido en test (TDD): el que fallaba primero, después el fix mínimo.

## Anti-patrones

- Dejar `console.log` sueltos sin prefijo
- Loguear tokens, passwords o PII
- Agregar 20 logs en vez de 2–3 bien ubicados
- "Arreglar" sin entender la causa (ver Superpowers: debugging sistemático)

## Combinar con

- **error-handling** — si el bug es un catch que traga el error
- **money** — si sospechás float o `Number()` en montos
- **rls-policy** — si un tenant ve datos de otro o 0 filas inesperadas
