import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Front page + primary nav wiring (INT8-017, FR-16).
 * Home and Songs are the only two IA items that resolve this slice; the
 * rest of the v5 nav (Tour Dates, Discography, Band, News) is deferred and
 * omitted from the menu entirely (wireframes overview.md §2).
 */
test.describe('front page + primary nav', () => {
  test('the front page loads with the page shell and a current Home nav link', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    await expect(page.locator('header.site-header')).toBeVisible();
    await expect(page.locator('footer.site-footer')).toBeVisible();

    // The nav is always in the DOM; below --bp-nav (760px) it's visually
    // collapsed behind the ☰ toggle (covered by INT8-015's own suite), so
    // check attachment rather than visibility here.
    const homeLink = page.locator('nav.site-header__nav a', { hasText: 'Home' });
    await expect(homeLink).toBeAttached();
    await expect(homeLink).toHaveAttribute('href', '/');
    await expect(homeLink).toHaveClass(/is-active/);
  });

  test('the Songs nav link points at a page that actually resolves', async ({ page }) => {
    await page.goto('/');
    const songsLink = page.locator('nav.site-header__nav a', { hasText: 'Songs' });
    await expect(songsLink).toBeAttached();
    await expect(songsLink).toHaveAttribute('href', '/songs');

    // Follow the link's destination directly rather than clicking — on
    // mobile widths the nav is collapsed and unclickable until the ☰
    // toggle opens it, which is a separate, already-tested concern.
    const response = await page.goto('/songs');
    expect(response?.status()).toBe(200);
    await expect(page.locator('header.site-header')).toBeVisible();
    await expect(page.locator('h1')).toHaveText(/songs/i);
  });

  test('axe: no serious/critical violations on the front page', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
