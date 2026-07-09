import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    // Force DB URL for the dev server used by Playwright so auth/reset tests can hit the DB.
    // Uses the current OS user for the unix socket connection — works in CI and local dev.
    command:
          process.env.DATABASE_URL
            ? `SKIP_DB_MIGRATE=1 npm run dev -- --port 3000`
            : 'DATABASE_URL=postgresql:///pts?host=/var/run/postgresql SKIP_DB_MIGRATE=1 npm run dev -- --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Workaround for environments where Playwright-managed browsers are unsupported
        // (e.g. Ubuntu 26.04). Provide a system browser path, e.g.:
        //   PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        },
      },
    },
  ],
});
