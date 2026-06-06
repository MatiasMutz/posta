---
name: money
description: Maneja montos en Posta sin float (NUMERIC en BD, tipo Money en @posta/money, strings en API, APrice en UI). Usar al definir columnas de dinero, calcular totales/IVA, serializar respuestas API o formatear ARS en el front.
---

# Money

Reglas D-08. **Nunca** `float`, `double`, `real` ni aritmética con `number` para lógica de negocio.

## Checklist

- [ ] Columnas BD: `NUMERIC(14, 2)` — nunca float
- [ ] App: tipo `Money` de `@posta/money` (centavos en `bigint`)
- [ ] API/cliente: montos como **string** JSON (ej. `"1234.56"`)
- [ ] UI: componente `APrice` — no formatear a mano
- [ ] Tests: `0.10 + 0.20 = 0.30` (ver `packages/money/src/money.test.ts`)

## Base de datos (Drizzle)

```typescript
costo:  numeric('costo',  { precision: 14, scale: 2 }).notNull(),
precio: numeric('precio', { precision: 14, scale: 2 }).notNull(),
```

Drizzle devuelve `NUMERIC` como `string`. Correcto — no pasar por `parseFloat`.

## App (`@posta/money`)

```typescript
import {
  fromString, add, subtract, multiplyByQuantity, multiplyRatio, toNumericString, isNegative,
} from '@posta/money';

const costo = fromString(producto.costo);   // Money
const precio = fromString(producto.precio);
const ganancia = subtract(precio, costo);

// Precio × cantidad de unidades (cantidad NO es dinero)
const subtotal = multiplyByQuantity(fromString(item.precio_unitario), item.cantidad);

// IVA incluido: usar fracción exacta, no float
const iva = multiplyRatio(total, 21n, 121n);

// Validar montos negativos
if (isNegative(fromString(saldo))) throw new BadRequestException(...);

await tx.update(productos).set({ precio: toNumericString(nuevoPrecio) });
```

**Prohibido:** `parseFloat`, `Number(monto)`, `multiply(monto, Number(cantidad))` para líneas de venta/compra.

`multiply(m, factor)` queda para factores decimales puntuales (ej. descuentos); para cantidades de unidades usar `multiplyByQuantity`.

## UI (formato ARS)

```tsx
import { APrice } from '@/components/ui';

<APrice value={producto.precio} />           // string de la BD
<APrice value={toNumericString(ganancia)} /> // Money serializado
```

Convención visual: miles con punto, decimales con coma, fechas DD/MM/AAAA.
