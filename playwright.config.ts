import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  // Tests must run serially: the server holds a single shared lobby,
  // so parallel runs would have tests interfering with each other.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
