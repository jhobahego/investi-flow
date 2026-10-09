import { defineConfig, devices } from '@playwright/test'

// E2E read-only: no real credentials, no production. See tests/e2e/scenarios/.
//
// Local vs CI:
// - CI (default): uses the Playwright-bundled Chromium
//   (`npx playwright install chromium`). No env vars needed.
// - Local without bundled browsers (e.g. `playwright install chromium`
//   fails with "platform not supported") and a system Chrome exists
//   (e.g. /usr/bin/google-chrome):
//     PLAYWRIGHT_CHROME=1 npx playwright test
//   To point at an explicit binary instead of the default channel:
//     PLAYWRIGHT_CHROME_PATH=/usr/bin/google-chrome npx playwright test
//   PLAYWRIGHT_CHROME_PATH takes precedence over PLAYWRIGHT_CHROME.
//   Neither is set in CI, so CI keeps using the bundled Chromium.
const useSystemChromeChannel = process.env.PLAYWRIGHT_CHROME === '1'
const systemChromePath = process.env.PLAYWRIGHT_CHROME_PATH

export default defineConfig({
  testDir: './tests/e2e/playwright',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // System Chrome only when explicitly requested; CI is unaffected.
        ...(systemChromePath
          ? { launchOptions: { executablePath: systemChromePath } }
          : useSystemChromeChannel
            ? { channel: 'chrome' }
            : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
