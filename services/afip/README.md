# Posta — Microservicio AFIP (stub)

FastAPI stateless pensado para Lambda/PaaS. El monolito NestJS consume este servicio vía HTTP cuando se implemente `FacturadorHttp`.

## Endpoints

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/v1/comprobantes` | Emite CAE (stub) |

## Desarrollo local

```bash
cd services/afip
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Enchufar al monolito

1. Implementar `FacturadorHttp` en `apps/api/src/modules/afip/` que llame a `POST /v1/comprobantes`.
2. Registrar en `AfipModule` según env `AFIP_SERVICE_URL`.
3. Mantener `FacturadorMock` para dev/CI.

Ver skill `.claude/skills/afip-adapter/SKILL.md`.
