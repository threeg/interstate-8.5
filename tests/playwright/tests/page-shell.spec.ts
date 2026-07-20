import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Base layout shell — header + footer (INT8-015).
 * The header/footer render on every page, so this suite exercises them
 * against a stable core route (/user/login) rather than the front page,
 * which is re-pointed to a real minimal page in INT8-017.
 */
test.describe('page shell — header + footer', () => {
  test('header renders the badge, wordmark link and primary nav landmark', async ({ page }) => {
    await page.goto('/user/login');

    const header = page.locator('header.site-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveAttribute('data-header-variant', 'solid');

    const wordmark = header.locator('a[rel="home"]');
    await expect(wordmark).toBeVisible();
    // The badge is inside the same link as the wordmark, so it's clickable
    // through to the front page too, not just the text.
    await expect(wordmark.locator('.site-badge')).toBeVisible();

    // The nav landmark is always in the DOM; it's only visually collapsed
    // behind the ☰ toggle below --bp-nav (760px), so check attachment, not
    // role-query visibility (hidden elements aren't exposed to getByRole).
    await expect(header.locator('nav.site-header__nav[aria-label="Primary"]')).toBeAttached();
  });

  test('wordmark and nav render uppercase', async ({ page }) => {
    await page.goto('/user/login');
    const header = page.locator('header.site-header');
    await expect(header.locator('.site-branding__name')).toHaveCSS('text-transform', 'uppercase');
    await expect(header.locator('nav.site-header__nav')).toHaveCSS('text-transform', 'uppercase');
  });

  test('nav links change colour on hover', async ({ page }) => {
    await page.goto('/user/login');
    // Login's own always-present local-task link is a stable, non-test-data
    // link to exercise general <a> hover, independent of whatever's placed
    // in the primary-nav region.
    const link = page.locator('a[data-drupal-link-system-path="user/password"]').first();
    const before = await link.evaluate((el) => getComputedStyle(el).color);
    await link.hover();
    const after = await link.evaluate((el) => getComputedStyle(el).color);
    expect(after).not.toBe(before);
  });

  test('the active-link mechanism marks the current-page link', async ({ page }) => {
    await page.goto('/user/login');
    // core/drupal.active-link adds .is-active/aria-current="page" to links
    // matching the current path client-side; Drupal's own "Log in" local
    // task on the login page is a stable, always-present link to prove the
    // library is actually loaded and firing (core's default menu.html.twig
    // does no active-trail marking server-side at all).
    const loginTab = page.locator('a[data-drupal-link-system-path="user/login"]').first();
    await expect(loginTab).toHaveClass(/is-active/);
  });

  test('footer renders the secondary labels, copyright and disclaimer', async ({ page }) => {
    await page.goto('/user/login');

    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();
    for (const label of ['About', 'Contact', 'Support', 'Legal', 'Privacy']) {
      await expect(footer.getByText(label, { exact: false })).toBeVisible();
    }
    await expect(footer.locator('.site-footer__copyright')).toContainText('Interstate-8');
    await expect(footer.getByText(/no way associated/i)).toBeVisible();
  });

  test('the wordmark link is keyboard-reachable with visible focus', async ({ page }) => {
    await page.goto('/user/login');

    const wordmark = page.locator('header.site-header a[rel="home"]');
    await wordmark.focus();
    await expect(wordmark).toBeFocused();
  });

  test('the mobile nav toggle is keyboard-operable below 760px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/user/login');

    const toggle = page.getByRole('button', { name: /menu/i });
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('mobile nav toggle reveals the nav at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/user/login');

    const nav = page.locator('header.site-header nav.site-header__nav');
    const toggle = page.getByRole('button', { name: /menu/i });

    await expect(toggle).toBeVisible();
    await expect(nav).not.toBeVisible();
    await toggle.click();
    await expect(nav).toBeVisible();
  });

  test('has no serious or critical accessibility violations at desktop', async ({ page }) => {
    await page.goto('/user/login');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('has no serious or critical accessibility violations at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/user/login');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
