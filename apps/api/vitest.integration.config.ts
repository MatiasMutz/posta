import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadDotEnv() {
  try {
    const content = readFileSync(resolve(__dirname, '.env'), 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#\s=][^=]*)=(.*)$/);
      if (match) process.env[match[1].trim()] ??= match[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // .env opcional en CI
  }
}
loadDotEnv();

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.isolation.spec.ts',
      'src/**/*.integration.spec.ts',
    ],
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
