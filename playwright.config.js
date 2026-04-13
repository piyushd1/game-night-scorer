import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.STAGING_URL || 'https://game-night-scorer.web.app',
    viewport: { width: 430, height: 932 },
    actionTimeout: 10_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-chrome', use: { browserName: 'chromium' } },
  ],
});
