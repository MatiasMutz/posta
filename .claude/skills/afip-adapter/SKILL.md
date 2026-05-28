---
name: afip-adapter
description: Implementa facturación AFIP con patrón puerto/adaptador, mock intercambiable, cola BullMQ y estado pendiente_facturacion. Usar al tocar VentasService, AfipModule, facturador mock/real, reintentos o tests de resiliencia AFIP.
---

# AFIP Adapter

El dominio de ventas **nunca** importa AFIP directamente. Solo conoce `FacturadorElectronico` (puerto inyectado en `AfipModule`).

## Archivos

```
apps/api/src/modules/afip/
├── facturador.interface.ts   ← puerto + FACTURADOR_TOKEN
├── facturador-mock.ts        ← dev/CI (mock hasta AFIP real en prod)
└── afip.module.ts            ← aquí se swapea la implementación
```

Futuro: `facturador-afip-real.ts` → HTTP al microservicio `services/afip/` (FastAPI). El dominio no cambia.

## Contrato del puerto

```typescript
interface FacturadorElectronico {
  emitirComprobante(venta: VentaParaFacturar): Promise<ResultadoFacturacion>;
}
```

Montos en `VentaParaFacturar` son **strings** NUMERIC. Ver `facturador.interface.ts`.

## Resiliencia (VentasService)

1. La venta se persiste **siempre**.
2. Si `emitirComprobante` falla → estado `pendiente_facturacion` + job BullMQ (`facturacion`).
3. Reintentos exponenciales (base ~60s), hasta 3 intentos en el processor.
4. Agotados → `error_afip`. Reintento manual: `POST /ventas/:id/reintentar-facturacion`.

## Simular caída (dev/test)

```bash
AFIP_MOCK_FAIL=true          # todas las solicitudes fallan
AFIP_MOCK_DELAY_MS=500       # latencia artificial (default 100ms)
```

## Tests

- **Unit:** `ventas.service.spec.ts` con `AFIP_MOCK_FAIL=true`
- **E2E:** `apps/web/tests/e2e/ventas/afip-resilience.spec.ts` (API con `AFIP_MOCK_FAIL=true`)
