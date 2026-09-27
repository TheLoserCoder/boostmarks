import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  // Each test launches a real Chromium extension profile, so keep the number of
  // concurrent browsers low and allow the projection to hydrate before asserting.
  workers: 2,
  expect: { timeout: 10_000 },
  use: { trace: 'retain-on-failure' },
  reporter: 'list',
});
