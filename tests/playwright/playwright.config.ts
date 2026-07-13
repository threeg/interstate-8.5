import { defineConfig, devices } from '@playwright/test';

/**
 * Interstate-8 Playwright config.
 * Tests run against the live Lando site (lando start required).
 * One-time browser install: lando npm run install-browsers (in tests/playwright/).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://interstate-8-5.lndo.site',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Browser matrix — NFR-8: current + previous major of evergreen browsers.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
