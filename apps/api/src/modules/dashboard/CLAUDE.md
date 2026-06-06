# Módulo dashboard + vista contador

## Dashboard (`GET /dashboard`)

Solo **dueño**. Incluye `ganancia_estimada_mes` (costo actual × cantidad vendida).

## Contador (`GET /contador/resumen`, `GET /contador/comprobantes`)

**Dueño** y **contador**. Sin costos ni ganancias. Detalle fiscal: neto, IVA, CAE, export links vía endpoints existentes.

## Reglas

- Agregaciones con `@posta/money`; ventas excluyen remito/presupuesto.
- IVA: `calcularIvaComprobante` en `common/iva.ts`.
- Vendedor bloqueado en API y web.
