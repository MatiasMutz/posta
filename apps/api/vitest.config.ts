import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Carga el .env para los tests de integración (no hace falta dotenv extra)
function loadDotEnv() {
  try {
    const content = readFileSync(resolve(__dirname, '.env'), 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#\s=][^=]*)=(.*)$/);
      if (match) process.env[match[1].trim()] ??= match[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // .env opcional en CI (usa secrets del entorno)
  }
}
loadDotEnv();

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    hookTimeout: 30000,
    testTimeout: 30000,
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
});
