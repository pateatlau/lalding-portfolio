import { defineConfig, devices } from '@playwright/test';

const adminAuthFile = 'e2e/.auth/admin.json';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:1111',
    trace: 'on-first-retry',
  },
  projects: [
    // Public site tests — multi-browser
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /admin-(?!auth)/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /admin-(?!auth)/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /admin-(?!auth)/,
    },

    // Admin auth setup — logs in and saves storageState
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Authenticated admin tests — Chromium only
    {
      name: 'admin',
      testMatch: /admin-(?!auth).*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: adminAuthFile,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:1111',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
