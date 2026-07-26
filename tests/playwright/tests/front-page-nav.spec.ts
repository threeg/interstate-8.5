import { test, expect, type Page } from '@playwright/test';
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

/**
 * Current-section marking survives query-string filters (INT8-031, FR-16, NFR-1).
 *
 * Written independently of the implementation, from the ticket and the
 * interface contract only. FR-16 makes the primary nav the path into the Songs
 * section; NFR-1 (WCAG 2.1 AA) makes `aria-current="page"` the *programmatic*
 * "you are here" signal, so the marking is not cosmetic — it is the only thing
 * a screen-reader user has to tell them which section they are in.
 *
 * The section a visitor is in is a property of the *route*, not of the query
 * string: `/songs`, `/songs?type=Covers` and `/songs?type=NoSuchType` are all
 * the Songs section. Every assertion below therefore holds the marking constant
 * across query variants, and — crucially — checks the *whole* nav, not just the
 * Songs link: "Songs is marked" alone would also be satisfied by an
 * implementation that marked every item.
 *
 * Assertions hang off the two things the CSS actually keys off
 * (`site-header.css`: `.site-header__nav .is-active`,
 * `.site-header__nav a[aria-current="page"]`, and the mobile
 * `li:has(a[aria-current="page"])`), so a green test means the visual treatment
 * genuinely lights up, not merely that some attribute exists somewhere.
 */

/** Documented `type` values (api-contract.md §2.1) — term names, URL-encoded. */
const TYPE = {
  all: 'All',
  modestMouse: 'Modest Mouse',
};

/** Built the same way as songs-landing.spec.ts's helper, so encoding is never hand-rolled. */
function songsUrl(params: Record<string, string> = {}): string {
  const qs = new URLSearchParams(params).toString();
  return qs ? `/songs?${qs}` : '/songs';
}

/**
 * A value the `type` filter does not resolve to a term. api-contract.md §2.1:
 * "An unrecognized value yields zero results (FR-19), not a silent fallback" —
 * verified against the running site, which returns 200 with the
 * "No songs match these filters" empty state. Still the Songs section, so it
 * must still be marked; this is the variant most likely to be missed by an
 * implementation that infers the section from the result set rather than the
 * route.
 */
const UNKNOWN_TYPE = 'NoSuchType';

const NAV_LINK = 'nav.site-header__nav a';

/**
 * The visible text of every nav link the CSS would treat as current — i.e.
 * every link matching `.is-active` OR `[aria-current="page"]`, the exact pair
 * of selectors site-header.css uses for both the desktop underline and the
 * mobile left-border accent. Returning the whole list (not a boolean for one
 * link) is what lets a test assert "exactly one, and it is Songs" and so catch
 * an implementation that marks everything.
 */
async function markedNavItems(page: Page): Promise<string[]> {
  return page.locator(NAV_LINK).evaluateAll((els) =>
    els
      .filter((el) => el.classList.contains('is-active') || el.getAttribute('aria-current') === 'page')
      .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()),
  );
}

/** Asserts the full nav state: Songs marked both ways, Home marked neither way, and nothing else marked. */
async function expectOnlySongsMarked(page: Page): Promise<void> {
  const songsLink = page.locator(NAV_LINK, { hasText: 'Songs' });
  const homeLink = page.locator(NAV_LINK, { hasText: 'Home' });

  await expect(songsLink).toBeAttached();
  await expect(homeLink).toBeAttached();

  // Both signals, because the CSS and the accessibility contract each depend on
  // a different one: `.is-active` drives the colour/underline, `aria-current`
  // is what assistive technology announces (NFR-1).
  await expect(songsLink).toHaveClass(/is-active/);
  await expect(songsLink).toHaveAttribute('aria-current', 'page');

  // The other section must be actively *un*-marked. Without this an
  // implementation that marks every link would look correct.
  await expect(homeLink).not.toHaveClass(/is-active/);
  expect(await homeLink.getAttribute('aria-current')).toBeNull();

  expect(await markedNavItems(page), 'expected exactly one current nav item').toEqual(['Songs']);
}

test.describe('primary nav current-section marking under query-string filters', () => {
  test('/songs with no query marks Songs and only Songs (unchanged-behaviour guard)', async ({ page }) => {
    // Green before the fix as well as after: this is the regression guard that
    // stops the fix from being a swap — the unfiltered case must not lose or
    // duplicate the marking on its way to making the filtered case work.
    const response = await page.goto(songsUrl());
    expect(response?.status()).toBe(200);
    await expectOnlySongsMarked(page);
  });

  test('/songs?type=Modest%20Mouse keeps Songs marked and leaves Home unmarked', async ({ page }) => {
    const response = await page.goto(songsUrl({ type: TYPE.modestMouse }));
    expect(response?.status()).toBe(200);
    // Same route, same section — a single documented filter parameter must not
    // change which section the visitor is told they are in (FR-16).
    await expectOnlySongsMarked(page);
  });

  test('/songs?type=All&alt=0 keeps Songs marked with both documented parameters at once', async ({ page }) => {
    const response = await page.goto(songsUrl({ type: TYPE.all, alt: '0' }));
    expect(response?.status()).toBe(200);
    // Two parameters, so a fix that special-cases a single known query string
    // (rather than ignoring the query string entirely) fails here.
    await expectOnlySongsMarked(page);
  });

  test('/songs?type=<unknown> keeps Songs marked in the no-results state', async ({ page }) => {
    const response = await page.goto(songsUrl({ type: UNKNOWN_TYPE }));
    expect(response?.status()).toBe(200);
    // Confirm we really are on the documented empty state and not a 404/redirect,
    // so the marking assertion below is about the no-results page it claims to be.
    await expect(page.locator('h1')).toHaveText(/songs/i);
    await expect(page.getByText(/no songs match these filters/i)).toBeVisible();

    await expectOnlySongsMarked(page);
  });

  test('the filtered Songs URL draws the same current-section underline as the unfiltered one', async ({ page }) => {
    // The DoD asks for the teal underline, but hardcoding a hex would duplicate
    // a design token (design-system.md §3 / tokens.css own that value). Instead
    // the unfiltered page — whose treatment is known-correct today — is the
    // reference, and the filtered page must render identically.
    const treatmentOf = async (url: string) => {
      await page.goto(url);
      return page.locator(NAV_LINK, { hasText: 'Songs' }).evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          color: cs.color,
          borderBottomColor: cs.borderBottomColor,
          borderBottomStyle: cs.borderBottomStyle,
          borderBottomWidth: cs.borderBottomWidth,
        };
      });
    };

    const unfiltered = await treatmentOf(songsUrl());
    const filtered = await treatmentOf(songsUrl({ type: TYPE.modestMouse }));

    // Sanity-check the reference itself: an underline that is transparent or
    // zero-width would make the comparison below vacuously true.
    expect(unfiltered.borderBottomStyle).toBe('solid');
    expect(parseFloat(unfiltered.borderBottomWidth)).toBeGreaterThan(0);
    expect(unfiltered.borderBottomColor).not.toBe('rgba(0, 0, 0, 0)');

    expect(filtered, JSON.stringify({ unfiltered, filtered }, null, 2)).toEqual(unfiltered);
  });

  test('axe: no serious/critical violations on a filtered Songs URL', async ({ page }) => {
    // NFR-1: aria-current is the programmatic "you are here" signal, so the
    // accessibility sweep has to cover the filtered URL too, not only /songs.
    await page.goto(songsUrl({ type: TYPE.modestMouse }));
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('the mobile panel shows the left-border accent on Songs at 320px on a filtered URL', async ({ page }) => {
    // Below --bp-nav (760px) the current item is a left-border accent on the
    // row, not an underline: site-header.css
    // `.site-header__nav li:has(.is-active), li:has(a[aria-current="page"])`.
    // Asserting the computed border on the <li> proves the marking landed on
    // the <a> where that :has() selector can see it — marking the <li> itself,
    // or a wrapper, would not light this rule.
    await page.setViewportSize({ width: 320, height: 640 });
    const response = await page.goto(songsUrl({ type: TYPE.modestMouse }));
    expect(response?.status()).toBe(200);

    const nav = page.locator('header.site-header nav.site-header__nav');
    await expect(nav).not.toBeVisible();
    await page.getByRole('button', { name: /menu/i }).click();
    await expect(nav).toBeVisible();

    const rows = await nav.evaluate((navEl) =>
      Array.from(navEl.querySelectorAll('li')).map((li) => {
        const cs = getComputedStyle(li);
        const link = li.querySelector('a');
        return {
          text: (link?.textContent ?? '').replace(/\s+/g, ' ').trim(),
          borderLeftColor: cs.borderLeftColor,
          borderLeftWidth: parseFloat(cs.borderLeftWidth),
        };
      }),
    );

    const songsRow = rows.find((r) => /songs/i.test(r.text));
    const homeRow = rows.find((r) => /home/i.test(r.text));
    expect(songsRow, JSON.stringify(rows, null, 2)).toBeDefined();
    expect(homeRow, JSON.stringify(rows, null, 2)).toBeDefined();

    // Width, not style: Tailwind's preflight sets `border-style: solid` with
    // `border-width: 0` on every element, so only a non-zero width proves the
    // accent rule actually applied.
    expect(songsRow!.borderLeftWidth, JSON.stringify(rows, null, 2)).toBeGreaterThan(0);
    expect(songsRow!.borderLeftColor, JSON.stringify(rows, null, 2)).not.toBe('rgba(0, 0, 0, 0)');

    // The accent must be exclusive to the current row — every other row leaves
    // border-left unset (the CSS comment is explicit that "no accent" is
    // genuinely absent rather than an invisible-coloured border).
    expect(homeRow!.borderLeftWidth, JSON.stringify(rows, null, 2)).toBe(0);
  });
});

/**
 * The mechanism test. Everything above is satisfiable by client-side script;
 * this block is not, so it is what pins the marking to the *server response*
 * (INT8-031 DoD: "The marking is present in the server response, i.e. it holds
 * with JavaScript disabled"). Core's own client-side active-link library is
 * query-exact by design, so a symptom-level fix that leans on JS would pass the
 * tests above and fail here.
 */
test.describe('primary nav current-section marking is server-rendered', () => {
  test.use({ javaScriptEnabled: false });

  test('a filtered Songs URL marks Songs with JavaScript disabled', async ({ page }) => {
    const response = await page.goto(songsUrl({ type: TYPE.modestMouse }));
    expect(response?.status()).toBe(200);
    await expectOnlySongsMarked(page);
  });

  test('both documented parameters at once mark Songs with JavaScript disabled', async ({ page }) => {
    const response = await page.goto(songsUrl({ type: TYPE.all, alt: '0' }));
    expect(response?.status()).toBe(200);
    await expectOnlySongsMarked(page);
  });

  test('the front page still marks Home and only Home with JavaScript disabled', async ({ page }) => {
    // Guards the `<front>` special case: the configured front page route and
    // the `/` request are not the same route, so a route-based fix that forgets
    // Home would regress the front-page assertion at the top of this file.
    // Expected green before the fix as well — it is a regression guard, not a
    // red test.
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    const homeLink = page.locator(NAV_LINK, { hasText: 'Home' });
    await expect(homeLink).toHaveClass(/is-active/);
    await expect(homeLink).toHaveAttribute('aria-current', 'page');
    expect(await markedNavItems(page), 'expected exactly one current nav item').toEqual(['Home']);
  });
});
