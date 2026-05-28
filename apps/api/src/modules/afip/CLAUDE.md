# Módulo afip

Responsabilidades: puerto `FacturadorElectronico` y adaptadores (mock → HTTP real).

## Reglas críticas

- El dominio (`VentasService`, `FacturacionProcessor`) **solo** depende de la interfaz, nunca de WSAA/WSFEV1 ni HTTP directo.
- Dev/CI: `FacturadorMock` inyectado por defecto. `AFIP_MOCK_FAIL=true` simula caída para tests y E2E. Producción enchufa el adaptador HTTP al microservicio real.
- Futuro: `FacturadorHttp` apunta al microservicio `services/afip/` (Python/FastAPI).

## Archivos

| Archivo | Rol |
|---------|-----|
| `facturador.interface.ts` | Puerto del dominio |
| `facturador.mock.ts` | Implementación dev/CI |
| `facturador-http.ts` | Cliente HTTP al microservicio (`AFIP_SERVICE_URL`) |

## Resiliencia (D-07)

1. La venta se persiste siempre.
2. Si AFIP falla → `pendiente_facturacion` + cola BullMQ `facturacion`.
3. Tras agotar reintentos → `error_afip`.
4. Reintento manual: `POST /ventas/:id/reintentar-facturacion` (solo dueño).

Ver skill `afip-adapter` en `.claude/skills/afip-adapter/SKILL.md`.
