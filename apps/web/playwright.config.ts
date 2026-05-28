import { defineConfig, devices } from '@playwright/test';
import { AUTH_DUENO } from './tests/e2e/global-setup';

/** Stack E2E aislado (:3010 web, :3002 API) — no reutiliza dev en :3000/:3001. */
const E2E_WEB_PORT = process.env.E2E_WEB_PORT ?? '3010';
const E2E_API_PORT = process.env.E2E_API_PORT ?? '3002';
const E2E_BASE = `http://localhost:${E2E_WEB_PORT}`;
const E2E_API_URL = `http://localhost:${E2E_API_PORT}`;

process.env.E2E_BASE_URL = E2E_BASE;
process.env.E2E_API_URL = E2E_API_URL;
process.env.NEXT_PUBLIC_API_URL = E2E_API_URL;

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: E2E_BASE,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_DUENO },
    },
    {
      name: 'mobile',
      dependencies: ['setup'],
      use: { ...devices['iPhone 13'], storageState: AUTH_DUENO },
    },
  ],
  webServer: [
    {
      command: `pnpm exec next dev --port ${E2E_WEB_PORT}`,
      url: E2E_BASE,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        NEXT_PUBLIC_API_URL: E2E_API_URL,
      },
    },
    {
      command: 'pnpm dev:api',
      url: `${E2E_API_URL}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      cwd: '../..',
      env: {
        PORT: E2E_API_PORT,
        THROTTLE_ENABLED: '0',
        CORS_ORIGIN: E2E_BASE,
        WEB_URL: E2E_BASE,
        REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
        ...(process.env.AFIP_MOCK_FAIL ? { AFIP_MOCK_FAIL: process.env.AFIP_MOCK_FAIL } : {}),
      },
    },
  ],
});
