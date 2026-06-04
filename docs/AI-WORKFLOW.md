# Workflow AI-native — Posta

Este repo se desarrolla con agentes de IA con estándares de **producto production-level**. La calidad depende de reglas verificables.

## Superpowers (metodología base)

[Superpowers](https://github.com/obra/superpowers): brainstorming, plan, TDD, code review.

1. Clonar/configurar Superpowers en el IDE
2. `CLAUDE.md` en raíz + skills en `.claude/skills/*/SKILL.md`
3. Tareas ambiguas → plan antes de codear
4. TDD: test rojo primero
5. Cierre con revisión contra el plan

Si Superpowers no está disponible, seguir manualmente `CLAUDE.md` §5.

## Skills de dominio

| Skill | Cuándo |
|-------|--------|
| `rls-policy` | Tablas `tenant_id`, policies, isolation specs |
| `money` | Montos NUMERIC / `@posta/money` |
| `add-endpoint` | Endpoints REST |
| `e2e-feature` | Playwright |
| `excel-import` | Motor importación |
| `afip-adapter` | Facturación / cola AFIP |
| `paginacion` | Listados paginados |

## MCPs (`.mcp.json`)

| MCP | Estado |
|-----|--------|
| **Supabase** | Configurado (HTTP) |
| Context7 | Plantilla en `_comment_templates` |
| Playwright / browser | Cursor IDE browser cuando está habilitado; E2E local con `pnpm test:e2e` |
| GitHub | Plantilla comentada (requiere token) |

Mantener ≤ 5–7 MCPs activos (`CLAUDE.md` §6).

## Definition of Done

Ver `CLAUDE.md` §4 y `docs/TESTING.md`.

1. Unit tests dominio
2. E2E si hay UI (`apps/web/tests/e2e/`)
3. `pnpm lint`, `pnpm typecheck`, `pnpm test`
4. `pnpm test:integration` si toca RLS/roles
5. Sin violaciones `CLAUDE.md` §3

## Comandos

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration
pnpm --filter api db:check
pnpm db:migrate    # migraciones locales
pnpm test:e2e
./scripts/openapi-smoke.sh   # con API en :3001
```
