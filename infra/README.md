# Infraestructura — Posta

Despliegue containerizado del monorepo (API NestJS + Web Next.js).

## Archivos

| Archivo | Uso |
|---------|-----|
| `api.Dockerfile` | Imagen de la API (`apps/api`) |
| `web.Dockerfile` | Imagen del front (`apps/web`) |
| `docker-compose.prod.yml` | Stack mínimo: API + Web + Redis |

## Variables requeridas

Copiá `.env.example` del root o definí en el entorno:

- `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`
- `REDIS_URL`
- `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Producción local (smoke)

```bash
docker compose -f infra/docker-compose.prod.yml build
docker compose -f infra/docker-compose.prod.yml up
```

La API escucha en `:3001`, el front en `:3000`. Aplicá migraciones en Supabase antes del primer deploy.

## Notas

- AFIP real vive en `services/afip/`; dev/CI usan `FacturadorMock` en la API hasta conectar el microservicio en producción.
- No incluye Supabase ni Postgres gestionados: usá Supabase Cloud o `supabase start` aparte.
