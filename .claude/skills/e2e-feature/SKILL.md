---
name: e2e-feature
description: Escribe y corre tests E2E con Playwright en Posta (auth multi-rol, global-setup, specs por flujo vertical, fixtures). Usar al agregar tests E2E, verificar flujos de usuario o configurar CI de Playwright.
---

# E2E Feature

Tests E2E con Playwright. Toda feature con UI visible requiere al menos un happy path E2E antes de cerrar la fase (`CLAUDE.md` §4).

## Prerrequisitos

- Supabase local + migraciones, Redis, API (`:3001`), Web (`:3000`)
- Variables: `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_API_URL`, `E2E_BASE_URL`
- Opcional multi-rol: `E2E_VENDEDOR_EMAIL`, `E2E_CONTADOR_EMAIL`, `E2E_ROLE_PASSWORD`

## Auth (patrón del repo)

1. `global-setup.ts` — crea directorio `.auth/`; opcionalmente prepara auth con `E2E_PREPARE_AUTH_IN_GLOBAL=1`
2. `auth.setup.ts` — corre `prepareE2EAuthStates()` (registro/login dueño + invitaciones vendedor/contador)
3. Storage states: `tests/e2e/.auth/dueno.json`, `vendedor.json`, `contador.json`
4. Proyectos Playwright dependen de `setup` y usan `storageState: AUTH_DUENO`

Config: `apps/web/playwright.config.ts` — levanta web + API via `webServer`.

## Convenciones

- Un spec por flujo vertical: `inventario/`, `ventas/`, `importar/`, `auth/`, `clientes/`
- Fixtures CSV en `tests/e2e/fixtures/`
- Preferir datos creados en el mismo test; `test.describe.configure({ mode: 'serial' })` solo si hay dependencia real
- `waitForURL` después de submits que navegan (no confiar solo en `toBeVisible`)
- Specs pendientes de implementar: `docs/E2E-PENDING-SPECS.md`

## Correr

```bash
pnpm test:e2e
```

Verificación completa (DoD):

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm test:e2e
```

## Ejemplo mínimo

```typescript
import { test, expect } from '@playwright/test';

test('dueño ve producto creado', async ({ page }) => {
  await page.goto('/inventario');
  await expect(page.getByText('Coca Cola 500ml')).toBeVisible();
});
```

Usar `getByRole`, `getByLabel` — evitar selectores frágiles. Referencia: specs existentes en `tests/e2e/`.
