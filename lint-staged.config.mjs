import path from 'node:path';

const apiRoot = path.join(process.cwd(), 'apps/api');

const WEB_LINT_SKIP = [
  '/tests/',
  'playwright.config.ts',
  'vitest.config.ts',
  'next-env.d.ts',
];

/** @type {import('lint-staged').Configuration} */
export default {
  'apps/api/src/**/*.ts': (files) => {
    const relativeFiles = files.map((file) =>
      path.relative(apiRoot, file).split(path.sep).join('/'),
    );
    const args = relativeFiles.map((file) => `"${file}"`).join(' ');

    return `bash -c 'cd apps/api && ./node_modules/.bin/eslint --fix ${args}'`;
  },
  'apps/web/**/*.{js,jsx,ts,tsx}': (files) => {
    const lintable = files.filter(
      (file) =>
        !file.endsWith('.test.ts') &&
        !file.endsWith('.test.tsx') &&
        !WEB_LINT_SKIP.some((part) => file.includes(part)),
    );

    if (lintable.length === 0) {
      return [];
    }

    return `bash -c 'cd apps/web && ./node_modules/.bin/next lint --fix'`;
  },
};
