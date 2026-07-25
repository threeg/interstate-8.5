import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Songs landing (INT8-018) — FR-6–FR-11, FR-16, FR-18, FR-19.
 *
 * Written independently of the implementation, from the ticket, the interface
 * contract (api-contract.md §2.1), the test strategy (§7) and the wireframe
 * (spec/wireframes/02-songs-landing.md) only. Assertions therefore hang off
 * user-facing, spec-mandated things — the /songs route, the documented `type`
 * / `alt` / `released` / `playedlive` query parameters, accessible names,
 * visible text and the FR-16 `/songs/<slug>` link shape — never off CSS class
 * names, Views machine names or markup this test has not been shown.
 *
 * Counts below are ground truth from the migrated dataset (492 Song nodes, 2
 * of them field_exclude_from_list = true, so 490 listable).
 */

/** Songs listed once field_exclude_from_list is honoured (FR-6). */
const LISTED_TOTAL = 490;
/** Listed songs by Song type (band/group). Sums to LISTED_TOTAL. */
const COUNTS = {
  modestMouse: 278,
  modestMouseCanonical: 254, // 24 of the 278 are alternate versions (FR-10)
  uglyCasanova: 26,
  sideProjects: 175,
  covers: 11,
  allCanonical: 466, // all 24 alternates in the dataset are Modest Mouse ones
};

/** Documented `type` values (api-contract.md §2.1) — term names, URL-encoded. */
const TYPE = {
  all: 'All',
  modestMouse: 'Modest Mouse',
  uglyCasanova: 'Ugly Casanova',
  sideProjects: 'Side projects',
  covers: 'Covers',
};

/** A song that is flagged field_exclude_from_list — must never be listed. */
const EXCLUDED_TITLE = 'Lucky Me Again (2006/11/05)';
/** A real canonical/alternate pair, both Modest Mouse, both listable. */
const PARENT_TITLE = 'Lives';
const ALTERNATE_TITLE = 'Your Life';

type SongLink = { href: string; text: string };

function songsUrl(params: Record<string, string> = {}): string {
  const qs = new URLSearchParams(params).toString();
  return qs ? `/songs?${qs}` : '/songs';
}

/**
 * Every link on the page that points at a song page (FR-16: /songs/<slug>),
 * in document order, de-duplicated by href — the contract lists each song
 * once, so distinct hrefs are the list.
 */
async function songLinks(page: Page): Promise<SongLink[]> {
  const raw = await page
    .locator('a[href*="/songs/"]')
    .evaluateAll((els) =>
      els.map((el) => ({
        href: el.getAttribute('href') ?? '',
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
      })),
    );

  const seen = new Set<string>();
  const out: SongLink[] = [];
  for (const link of raw) {
    // Only real song pages: /songs/<something>, never /songs itself.
    if (!/\/songs\/[^/?#]+/.test(link.href)) continue;
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    out.push(link);
  }
  return out;
}

/**
 * A song's link text is its title, optionally followed by the alternate-title
 * marker the design system leaves open (a badge / tag / asterisk near the
 * link). Match the title exactly, tolerating that trailing cue, rather than
 * asserting the marker's shape — FR-10 pins presence/absence, not the marker.
 */
function isTitle(text: string, title: string): boolean {
  const re = new RegExp(
    `^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(\\(?\\*?alt[a-z-]*\\)?|\\*)?$`,
    'i',
  );
  return re.test(text.trim());
}

function indexOfTitle(links: SongLink[], title: string): number {
  return links.findIndex((l) => isTitle(l.text, title));
}

function hasTitle(links: SongLink[], title: string): boolean {
  return indexOfTitle(links, title) !== -1;
}

/** FR-8 sort key: the title with a single leading article dropped. */
function sortKey(title: string): string {
  return title
    .trim()
    .replace(/^(a|an|the)\s+/i, '')
    .toLowerCase();
}

/** The exposed Type filter, addressed by its accessible name only. */
function typeFilter(page: Page) {
  return page.getByLabel(/type|band|group/i).first();
}

test.describe('Songs landing', () => {
  test('lists every non-excluded song as a link on one page, with no pager (FR-6, FR-7)', async ({
    page,
  }) => {
    // The complete catalogue needs the All type; the default is deliberately
    // narrowed to Modest Mouse (FR-9), which is asserted separately below.
    const response = await page.goto(songsUrl({ type: TYPE.all }));
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveText(/songs|songlist/i);

    const links = await songLinks(page);
    expect(links.length).toBe(LISTED_TOTAL);

    // FR-6: the two field_exclude_from_list songs are never listed.
    expect(hasTitle(links, EXCLUDED_TITLE)).toBe(false);

    // FR-7: one page, no pagination. No pager landmark and no ?page= link.
    await expect(page.getByRole('navigation', { name: /pag/i })).toHaveCount(0);
    await expect(page.locator('a[href*="page="]')).toHaveCount(0);
  });

  test('a song link points at its own /songs/<slug> page (FR-16)', async ({ page }) => {
    await page.goto(songsUrl());
    const links = await songLinks(page);
    expect(links.length).toBeGreaterThan(0);

    for (const link of links.slice(0, 5)) {
      expect(link.href).not.toBe('');
      expect(link.href).not.toBe('/songs');
      expect(link.href).toMatch(/\/songs\/[^/?#]+$/);
      expect(link.text.length).toBeGreaterThan(0);
    }
  });

  test('the Type filter defaults to Modest Mouse on first load (FR-9)', async ({ page }) => {
    await page.goto(songsUrl());

    const filter = typeFilter(page);
    await expect(filter).toBeAttached();
    // The control's *current* value must read as Modest Mouse, not All.
    await expect(filter.locator('option:checked')).toHaveText(/modest mouse/i);

    // And the rendered list must actually be the Modest Mouse subset.
    const links = await songLinks(page);
    expect(links.length).toBe(COUNTS.modestMouse);
    expect(hasTitle(links, EXCLUDED_TITLE)).toBe(false);
  });

  test('choosing another type narrows the list, and type + alt combine (FR-9, FR-18)', async ({
    page,
  }) => {
    await page.goto(songsUrl({ type: TYPE.uglyCasanova }));
    let links = await songLinks(page);
    expect(links.length).toBe(COUNTS.uglyCasanova);
    expect(links.length).toBeLessThan(COUNTS.modestMouse);
    expect(hasTitle(links, EXCLUDED_TITLE)).toBe(false);
    // Ugly Casanova has no alternate versions, so hiding them changes nothing.
    await page.goto(songsUrl({ type: TYPE.uglyCasanova, alt: '0' }));
    links = await songLinks(page);
    expect(links.length).toBe(COUNTS.uglyCasanova);

    await page.goto(songsUrl({ type: TYPE.sideProjects }));
    links = await songLinks(page);
    expect(links.length).toBe(COUNTS.sideProjects);
    expect(hasTitle(links, EXCLUDED_TITLE)).toBe(false);

    await page.goto(songsUrl({ type: TYPE.covers }));
    links = await songLinks(page);
    expect(links.length).toBe(COUNTS.covers);
    expect(hasTitle(links, EXCLUDED_TITLE)).toBe(false);

    // FR-18: the two filters compose — All + alt=0 drops all 24 alternates.
    await page.goto(songsUrl({ type: TYPE.all, alt: '0' }));
    links = await songLinks(page);
    expect(links.length).toBe(COUNTS.allCanonical);
    expect(hasTitle(links, EXCLUDED_TITLE)).toBe(false);
  });

  test('Alt-titles Show is the default and Hide drops alternates only (FR-10)', async ({
    page,
  }) => {
    // Show (default): the alternate and its parent are both listed.
    await page.goto(songsUrl());
    let links = await songLinks(page);
    expect(hasTitle(links, ALTERNATE_TITLE)).toBe(true);
    expect(hasTitle(links, PARENT_TITLE)).toBe(true);
    expect(links.length).toBe(COUNTS.modestMouse);

    // The alt filter itself is exposed and reads as showing alternates.
    const altFilter = page.getByLabel(/alt/i).first();
    await expect(altFilter).toBeAttached();
    await expect(altFilter).toBeEnabled();

    // Hide: the alternate goes, the canonical parent stays.
    await page.goto(songsUrl({ alt: '0' }));
    links = await songLinks(page);
    expect(hasTitle(links, ALTERNATE_TITLE)).toBe(false);
    expect(hasTitle(links, PARENT_TITLE)).toBe(true);
    expect(links.length).toBe(COUNTS.modestMouseCanonical);
    expect(hasTitle(links, EXCLUDED_TITLE)).toBe(false);
  });

  test('the Released and Played-live controls render disabled, not broken (FR-11)', async ({
    page,
  }) => {
    await page.goto(songsUrl());

    const released = page.getByLabel(/released/i).first();
    await expect(released).toBeAttached();
    await expect(released).toBeDisabled();

    const playedLive = page.getByLabel(/played\s*live/i).first();
    await expect(playedLive).toBeAttached();
    await expect(playedLive).toBeDisabled();

    // The wireframe requires these read as "coming soon" rather than broken.
    await expect(page.getByText(/coming soon/i).first()).toBeAttached();
  });

  test('the list is sorted alphabetically ignoring a leading article (FR-8)', async ({ page }) => {
    // Assert against the canonical-only list so no alternate-title marker text
    // can perturb the link text used as the sort key.
    await page.goto(songsUrl({ alt: '0' }));
    const links = await songLinks(page);
    expect(links.length).toBe(COUNTS.modestMouseCanonical);

    const iBukowski = indexOfTitle(links, 'Bukowski');
    const iColdPart = indexOfTitle(links, 'The Cold Part');
    const iDifferentCity = indexOfTitle(links, 'A Different City');
    const iLives = indexOfTitle(links, PARENT_TITLE);
    expect(iBukowski, 'Bukowski should be listed').toBeGreaterThan(-1);
    expect(iColdPart, '"The Cold Part" should be listed').toBeGreaterThan(-1);
    expect(iDifferentCity, '"A Different City" should be listed').toBeGreaterThan(-1);
    expect(iLives, '"Lives" should be listed').toBeGreaterThan(-1);

    // Article-insensitive order is B < (The) Cold Part < (A) Different City <
    // Lives. A naive alphabetical sort would instead give A Different City <
    // Bukowski < Lives < The Cold Part, so this ordering discriminates.
    expect(iBukowski).toBeLessThan(iColdPart);
    expect(iColdPart).toBeLessThan(iDifferentCity);
    expect(iDifferentCity).toBeLessThan(iLives);

    // And the whole list groups by the sort key's first letter, non-decreasing.
    // Compare first letters only: full-string collation of punctuation,
    // numerals and diacritics is not pinned by the spec, alphabetical grouping
    // is. Titles whose sort key does not start with a letter are skipped.
    const letters = links
      .map((l) => sortKey(l.text).charAt(0))
      .filter((c) => c >= 'a' && c <= 'z');
    for (let i = 1; i < letters.length; i++) {
      expect(
        letters[i] >= letters[i - 1],
        `sort key initials went backwards at position ${i}: "${letters[i - 1]}" then "${letters[i]}"`,
      ).toBe(true);
    }
  });

  test('a no-match filter combination shows an explicit empty state with a reset (FR-19)', async ({
    page,
  }) => {
    // Judgement call: no combination of the documented `type` / `alt`
    // parameters can yield zero rows against the real dataset — all 24
    // alternates are Modest Mouse ones, so every other type still has its
    // canonical songs under alt=0, and Modest Mouse has both. The reachable
    // no-match case is therefore a `type` value matching no term, which a user
    // can trigger by hand-editing the URL. FR-19 requires the explicit empty
    // state there too: a message and a reset, never a blank area or an error.
    const response = await page.goto(songsUrl({ type: 'NoSuchType' }));
    expect(response?.status()).toBe(200);

    const links = await songLinks(page);
    expect(links.length).toBe(0);

    await expect(page.getByText(/no songs match|no matching songs|no songs found/i).first())
      .toBeVisible();

    const reset = page
      .getByRole('link', { name: /reset|clear|show all/i })
      .or(page.getByRole('button', { name: /reset|clear|show all/i }));
    await expect(reset.first()).toBeAttached();
  });

  test('the excluded song never appears under any filter combination (FR-6)', async ({ page }) => {
    const combos = [
      songsUrl(),
      songsUrl({ type: TYPE.all }),
      songsUrl({ type: TYPE.all, alt: '0' }),
      songsUrl({ type: TYPE.all, alt: '1' }),
      songsUrl({ type: TYPE.modestMouse, alt: '0' }),
      songsUrl({ type: TYPE.uglyCasanova }),
      songsUrl({ type: TYPE.sideProjects }),
      songsUrl({ type: TYPE.covers }),
    ];

    for (const url of combos) {
      await page.goto(url);
      const links = await songLinks(page);
      expect(hasTitle(links, EXCLUDED_TITLE), `excluded song listed on ${url}`).toBe(false);
    }
  });

  test('the filter controls are keyboard operable and show a visible focus indicator (NFR-1)', async ({
    page,
  }) => {
    await page.goto(songsUrl());

    const filter = typeFilter(page);
    await filter.focus();
    await expect(filter).toBeFocused();

    const hasFocusIndicator = await filter.evaluate((el) => {
      const style = getComputedStyle(el);
      const outline =
        style.outlineStyle !== 'none' && parseFloat(style.outlineWidth || '0') > 0;
      const shadow = style.boxShadow !== 'none' && style.boxShadow !== '';
      const border = parseFloat(style.borderTopWidth || '0') > 0;
      return outline || shadow || border;
    });
    expect(hasFocusIndicator, 'the focused Type filter has no visible focus indicator').toBe(true);
  });

  test('axe: no serious/critical violations on /songs (NFR-1)', async ({ page }) => {
    await page.goto(songsUrl());
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('the page holds up at a 320px viewport (NFR-2)', async ({ page }) => {
    // None of the configured projects is 320px wide, so pin it here.
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(songsUrl());

    // No horizontal overflow of the document.
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow, 'the page scrolls horizontally at 320px').toBeLessThanOrEqual(1);

    // The filters and the list are still there — the filter bar may reflow or
    // collapse at this width, so assert attachment/accessible name, not pixels.
    await expect(typeFilter(page)).toBeAttached();
    await expect(page.getByLabel(/alt/i).first()).toBeAttached();
    const links = await songLinks(page);
    expect(links.length).toBe(COUNTS.modestMouse);
  });
});
