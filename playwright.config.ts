import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'pnpm build && pnpm preview --port 4321 --ignore-lock',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'webkit-phone', use: { ...devices['iPhone 14'], browserName: 'webkit' } },
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
