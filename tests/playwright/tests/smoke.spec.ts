import { test, expect } from '@playwright/test';

/**
 * Smoke test — verifies the Lando site is reachable and serves the custom theme.
 * This is the only test in the scaffolding milestone; the full Songs suite
 * comes in INT8-021 once the content model and migrations are in place.
 */
test('site serves the interstate_85 theme', async ({ page }) => {
  await page.goto('/');
  // The page title contains either the site name or Drupal fallback.
  await expect(page).toHaveTitle(/.+/);
  // The custom theme's compiled CSS is linked (Drupal may attach multiple theme stylesheets).
  const cssLinks = page.locator('link[rel="stylesheet"][href*="interstate_85"]');
  const count = await cssLinks.count();
  expect(count).toBeGreaterThan(0);
});
