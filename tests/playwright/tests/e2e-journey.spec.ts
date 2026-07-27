import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * E2E capstone — the cross-screen journey (INT8-021). NFR-1, NFR-2, NFR-7, NFR-8.
 *
 * Written independently of the implementation, from the ticket
 * (spec/tickets/INT8-021-e2e-capstone.md), the requirements (NFR-1/2/7/8), the
 * interface contract (api-contract.md §2.1/§2.2) and the test strategy (§7, §9)
 * only. No theme template, CSS, PHP or Drupal config was read while authoring
 * this file. The live *rendered* pages were driven and inspected to confirm the
 * ground truth below — black-box observation, not a look at the source.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FILE IS FOR, AND WHAT IT DELIBERATELY DOES NOT DO
 *
 * INT8-021 adds no application behaviour. Every screen it touches already has
 * its own thorough suite:
 *
 *   - songs-landing.spec.ts  — the ledger, the filters, sort, empty state, the
 *                              letter rail, Axe on /songs, 320px.
 *   - song-page.spec.ts      — name/quote/lyrics/notes/video, missing fields,
 *                              404, Axe at desktop and 320px.
 *   - song-versions.spec.ts  — parent ↔ alternate, the lyric pair, Axe.
 *   - front-page-nav.spec.ts — the front page, nav wiring, current-section
 *                              marking, Axe on / and on a filtered /songs.
 *
 * So this file does not re-assert any of that. It asserts the one thing none of
 * those files does: that the screens actually COMPOSE — one continuous browser
 * session, driven by real clicks and real form controls, the way a visitor
 * arrives. Every one of those suites reaches its screen with `page.goto()`;
 * three specific hops are consequently untested anywhere today and are tested
 * here for the first time:
 *
 *   1. CLICKING the primary nav's "Songs" link (front-page-nav.spec.ts says in
 *      its own comment that it follows the destination directly rather than
 *      clicking, because the mobile nav is collapsed — this file opens the ☰
 *      panel and clicks it for real, at both viewports).
 *   2. OPERATING the Type filter control — selecting an option and submitting
 *      the filter bar. songs-landing.spec.ts proves the `?type=` parameter
 *      narrows the list and that the control reports the right current value,
 *      but never drives the control itself.
 *   3. CLICKING a song link in the ledger to reach that song's page.
 *      songs-landing.spec.ts asserts the FR-16 href *shape*; nothing follows
 *      one. (song-versions.spec.ts clicks song links, but only from a song
 *      page to a related song page — never from the landing.)
 *
 * ---------------------------------------------------------------------------
 * THE AXE DECISION (ticket DoD: "Axe clean on both screens")
 *
 * DECIDED: run a real, minimal, confirmatory Axe pass INLINE in the journey, at
 * the moment the journey visits each screen — not a pointer at the existing
 * coverage, and not a copy of it either.
 *
 * Why not simply cite the existing tests? Because they scan a different thing.
 * Their scans are of a *freshly loaded* URL:
 *   - songs-landing.spec.ts  → axe on `/songs` after page.goto
 *   - front-page-nav.spec.ts → axe on `/songs?type=Modest Mouse` after page.goto,
 *                              and on `/` after page.goto
 *   - song-page.spec.ts      → axe on a song page after page.goto, desktop + 320px
 *   - song-versions.spec.ts  → axe on an alternate page after page.goto
 * What this ticket's bar is about is the *assembled slice as a visitor moves
 * through it*: a landing whose filter the visitor just applied through the form
 * (so the page is a form round-trip, with focus and history state behind it),
 * and a song page the visitor reached by clicking rather than by typing a URL.
 * Those exact states are unscanned today. Two scans, at those two points, are
 * cheap and non-redundant.
 *
 * Why still minimal? Because the exhaustive per-screen a11y work — keyboard
 * operability, focus indicators, heading order and landmarks at *any* impact,
 * the 320px scans, the third-party-iframe exclusions — is already done in the
 * files listed above and re-running it here would be duplication, which is what
 * a reconciliation ticket should avoid. This file's scans use the same
 * serious/critical WCAG 2.1 AA filter those files use, so a regression that
 * would fail them fails here too.
 *
 * Neither page the journey scans has a `field_video` value (verified below), so
 * — unlike song-page.spec.ts — no third-party iframe subtree needs excluding.
 *
 * ---------------------------------------------------------------------------
 * SELECTOR ASSUMPTIONS, stated up front so they are cheap to correct. None of
 * the assertions' intent depends on them.
 *
 *  A. The primary nav lives inside the page's `<header>` element. Every link
 *     assertion is `header nav a` scoped, so footer chrome cannot satisfy it.
 *     Established by front-page-nav.spec.ts and page-shell.spec.ts, which pin
 *     `header.site-header` / `nav.site-header__nav`; this file uses the plain
 *     landmark tags so it survives a class rename.
 *  B. The ☰ toggle is a button whose accessible name matches /menu/i. Quoted
 *     from front-page-nav.spec.ts and page-shell.spec.ts, which both use it.
 *  C. The Type filter is a labelled form control whose accessible name is
 *     exactly "Type" (api-contract.md §2.1 names the parameter `type`), and the
 *     filter bar submits either on change or via a control named "Apply". The
 *     helper below handles BOTH without assuming which — see applyType().
 *  D. A song link is any `<a>` whose resolved path matches `/songs/<slug>`.
 *     That is FR-16's contractual shape, not a class name.
 *
 * ---------------------------------------------------------------------------
 * GROUND TRUTH — re-verified against the live migrated dataset at authoring
 * time (2026-07-26) via `lando drush php:eval` and the entity API, and against
 * the rendered pages. Nothing here is inherited unchecked from an earlier
 * ticket's fixtures.
 *
 *   - Song type terms are exactly: Modest Mouse (280 nodes), Ugly Casanova
 *     (26), Side Projects (175), Covers (11). "All" is the documented catch-all
 *     value (api-contract.md §2.1).
 *   - The rendered ledger lists 490 distinct song links under `?type=All` and
 *     278 under `?type=Modest Mouse` — so selecting Modest Mouse after All is a
 *     genuine, strict narrowing (490 → 278).
 *   - "Careless Whisper [Wham!]" (/songs/careless-whisper-wham) is a **Covers**
 *     song, listable: present in the ?type=All ledger, absent from the
 *     ?type=Modest Mouse one. It is the discriminating title for the filter
 *     step — a count alone could move for reasons other than the filter.
 *   - "Perpetual Motion Machine" (/songs/perpetual-motion-machine) is a listable
 *     Modest Mouse song with **four** alternates referencing it via
 *     field_parent_song, of which "Here Comes Trouble"
 *     (/songs/here-comes-trouble) is listable and linked from the parent's page.
 *     Confirmed on the live pages: the parent renders links to all four, and the
 *     child renders a link back to the parent.
 *   - NEITHER of those two nodes has a `field_video` value. Only two songs in
 *     the whole dataset do — "Float On" and "King Rat" — and both are
 *     deliberately avoided here so the Axe scans never reach YouTube's own
 *     player chrome (the third-party noise song-page.spec.ts has to exclude).
 *   - Lyric snippets below were checked to occur in the song they are
 *     attributed to. Lyrics render lowercased via CSS `text-transform` (a
 *     site-owner request recorded in song-page.spec.ts), so every lyric
 *     comparison here is case-insensitive.
 * ------------------------------------------------------------------------- */

/** The Type filter values this journey uses (api-contract.md §2.1, term names). */
const TYPE_ALL = 'All';
const TYPE_MODEST_MOUSE = 'Modest Mouse';

/** A listable **Covers** song: in the All ledger, out of the Modest Mouse one. */
const COVERS_ONLY_PATH = '/songs/careless-whisper-wham';

/** The song the journey opens from the ledger. Listable, Modest Mouse, no video. */
const SONG = {
  path: '/songs/perpetual-motion-machine',
  title: 'Perpetual Motion Machine',
  /** Occurs in this song's lyrics; not in its alternate's. */
  lyric: 'poison in the juice carafe',
};

/** One of its four real alternates. Listable, no video, links back to SONG. */
const ALTERNATE = {
  path: '/songs/here-comes-trouble',
  title: 'Here Comes Trouble',
  /** Occurs in the alternate's own lyrics; not in the parent's. */
  lyric: 'with your teeth to your lips',
};

/** NFR-2's contractual minimum width, and a desktop width for the matrix. */
const NARROW = { width: 320, height: 640 };
const DESKTOP = { width: 1280, height: 900 };

/* -------------------------------------------------------------------------
 * Helpers. Everything works off resolved hrefs, accessible names, visible text
 * and geometry — never off a class name this file has not been shown.
 * ---------------------------------------------------------------------- */

/** The pathname of the page the browser is actually on, without a trailing slash. */
function currentPath(page: Page): string {
  return new URL(page.url()).pathname.replace(/\/+$/, '') || '/';
}

/** Escape a title for use inside a RegExp. */
function rx(title: string): RegExp {
  return new RegExp(`^\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
}

type SongLink = { path: string; text: string };

/**
 * Every link on the page pointing at a song DETAIL page (assumption D), in
 * document order, de-duplicated by path. This is "the list" as a visitor sees
 * it: the contract lists each song once, so distinct paths are the listing.
 */
async function songLinks(page: Page): Promise<SongLink[]> {
  return (await page.evaluate(() => {
    const seen = new Set<string>();
    const out: { path: string; text: string }[] = [];
    for (const a of Array.from(document.querySelectorAll('a[href]'))) {
      let path = '';
      try {
        path = new URL((a as HTMLAnchorElement).href, document.baseURI).pathname.replace(/\/+$/, '');
      } catch {
        continue;
      }
      if (!/^\/songs\/[^/]+$/.test(path)) continue;
      if (seen.has(path)) continue;
      seen.add(path);
      out.push({ path, text: (a.textContent ?? '').replace(/\s+/g, ' ').trim() });
    }
    return out;
  })) as SongLink[];
}

/** How far the document overflows its own viewport horizontally, in px. */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
}

/** Normalised, lowercased visible text of the page or of a scope within it. */
async function visibleText(page: Page, scope = 'body'): Promise<string> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return '';
    return (el.innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  }, scope);
}

/**
 * The primary nav's link with the given label (assumption A). Always present in
 * the DOM; below the nav breakpoint it is visually collapsed behind ☰.
 */
function navLink(page: Page, label: string) {
  return page.locator('header nav a', { hasText: label }).first();
}

/**
 * Make the primary nav operable, whatever the viewport. At desktop it already
 * is; at 320px it is collapsed behind the ☰ toggle (assumption B), and a
 * visitor's very first act is to open it — so this IS a journey step at narrow
 * widths, not setup.
 */
async function openNavIfCollapsed(page: Page): Promise<void> {
  const nav = page.locator('header nav').first();
  if (await nav.isVisible()) return;

  const toggle = page.getByRole('button', { name: /menu/i });
  await expect(toggle, 'the nav is collapsed but there is no ☰ toggle to open it').toBeVisible();
  await toggle.click();
  await expect(nav, 'the ☰ toggle did not reveal the primary nav').toBeVisible();
}

/**
 * Drive the Type filter as a visitor does: choose the value in the control,
 * then submit.
 *
 * Assumption C, handled rather than assumed: the filter bar renders an explicit
 * "Apply" control, but a theme is free to auto-submit on change instead. This
 * waits briefly for the navigation a change-handler would cause and presses
 * Apply only if none arrives — so the test passes either way and fails only if
 * the filter genuinely cannot be operated.
 */
async function applyType(page: Page, value: string): Promise<void> {
  const select = page.getByLabel(/^type$/i).first();
  await expect(select, 'the Type filter control is not usable').toBeVisible();
  await expect(select).toBeEnabled();
  await select.selectOption({ label: value });

  const landed = (url: URL) => url.searchParams.get('type') === value;
  const auto = await page
    .waitForURL(landed, { timeout: 1500 })
    .then(() => true)
    .catch(() => false);

  if (!auto) {
    const apply = page.getByRole('button', { name: /^apply$/i });
    await expect(
      apply,
      'the Type filter neither auto-submitted nor offers an "Apply" control — it cannot be operated',
    ).toBeVisible();
    await apply.click();
    await page.waitForURL(landed, { timeout: 15000 });
  }

  // The control must also report back the value that is now in force, or the
  // visitor cannot tell what they are looking at.
  await expect(select.locator('option:checked')).toHaveText(new RegExp(value, 'i'));
}

/** Serious/critical WCAG 2.1 AA violations on the page as it currently stands. */
async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
}

/* -------------------------------------------------------------------------
 * The journey.
 * ---------------------------------------------------------------------- */

/**
 * One continuous session: front page → Songs landing → Type filter → a song →
 * its alternate version. Every hop after the first is a real click or a real
 * form interaction; `page.goto()` is used exactly once, to arrive at the site.
 *
 * Every step asserts it landed where it meant to (path AND `<h1>`), so a click
 * that "succeeded" while going nowhere — or going somewhere else — is a
 * failure, not a silent pass.
 */
async function walkTheJourney(page: Page, label: string): Promise<void> {
  /* --- Step 1: arrive at the front page. The only page.goto in the journey. */
  const response = await page.goto('/');
  expect(response?.status(), `${label}: the front page did not return 200`).toBe(200);
  expect(currentPath(page), `${label}: did not land on the front page`).toBe('/');
  await expect(page.locator('header'), `${label}: the front page has no site header`).toBeVisible();

  /* --- Step 2: click through to the Songs landing via the primary nav (FR-16).
   * Not a goto: this is the visitor's actual route into the section, and at
   * 320px it means opening the ☰ panel first. */
  await openNavIfCollapsed(page);
  const songsNav = navLink(page, 'Songs');
  await expect(songsNav, `${label}: there is no "Songs" link in the primary nav`).toBeVisible();
  await songsNav.click();
  await page.waitForLoadState('domcontentloaded');

  expect(
    currentPath(page),
    `${label}: clicking the primary nav's "Songs" link did not land on /songs`,
  ).toBe('/songs');
  await expect(
    page.locator('h1'),
    `${label}: the page reached from the nav is not the Songs landing`,
  ).toHaveText(/songs/i);

  /* --- Step 3: the landing lists songs as links (NFR-7, first clause). Only
   * the shape is checked here — songs-landing.spec.ts owns the counts, the
   * exclusions, the sort and the buckets. */
  const onArrival = await songLinks(page);
  expect(onArrival.length, `${label}: the Songs landing lists no song links at all`).toBeGreaterThan(0);
  for (const link of onArrival.slice(0, 5)) {
    expect(link.path, `${label}: a ledger link is not a /songs/<slug> link`).toMatch(/^\/songs\/[^/]+$/);
    expect(link.text.length, `${label}: a ledger link has no link text`).toBeGreaterThan(0);
  }

  /* --- Step 4: operate the Type filter (NFR-7, second clause; FR-9).
   * Widen to All first, then narrow to Modest Mouse. Both directions are
   * asserted, because "the filter changed the list" and "the filter NARROWED
   * the list" are different claims and NFR-7 asks for the second. */
  await applyType(page, TYPE_ALL);
  const all = await songLinks(page);
  expect(
    all.length,
    `${label}: selecting Type "All" did not widen the ledger (${onArrival.length} → ${all.length})`,
  ).toBeGreaterThan(onArrival.length);
  expect(
    all.map((l) => l.path),
    `${label}: the Covers song ${COVERS_ONLY_PATH} is missing from the "All" ledger`,
  ).toContain(COVERS_ONLY_PATH);

  await applyType(page, TYPE_MODEST_MOUSE);
  const narrowed = await songLinks(page);
  expect(
    narrowed.length,
    `${label}: selecting Type "${TYPE_MODEST_MOUSE}" did not narrow the ledger ` +
      `(${all.length} songs under "All", ${narrowed.length} after)`,
  ).toBeLessThan(all.length);
  // A count can move for reasons other than the filter. This cannot: a Covers
  // song must be gone from a Modest Mouse ledger, and the song we are about to
  // open must still be there.
  expect(
    narrowed.map((l) => l.path),
    `${label}: a Covers song (${COVERS_ONLY_PATH}) survived the "${TYPE_MODEST_MOUSE}" filter`,
  ).not.toContain(COVERS_ONLY_PATH);
  expect(
    narrowed.map((l) => l.path),
    `${label}: ${SONG.path} is not in the filtered ledger, so the next hop cannot start from a click`,
  ).toContain(SONG.path);

  /* --- Step 5: click a song in the filtered ledger (NFR-7, third clause;
   * FR-16). Nothing else in the suite follows a ledger link. */
  const songInLedger = page.locator(`a[href$="${SONG.path}"]`).first();
  await expect(
    songInLedger,
    `${label}: no clickable ledger link resolves to ${SONG.path}`,
  ).toBeVisible();
  await songInLedger.click();
  await page.waitForLoadState('domcontentloaded');

  expect(
    currentPath(page),
    `${label}: clicking "${SONG.title}" in the ledger did not land on its song page`,
  ).toBe(SONG.path);
  await expect(
    page.locator('h1'),
    `${label}: the page reached from the ledger is not "${SONG.title}"`,
  ).toHaveText(rx(SONG.title));

  /* --- Step 6: the song page carries its core content (NFR-7, fourth clause;
   * FR-12). One load-bearing check only — song-page.spec.ts owns the full
   * field-by-field contract. */
  expect(
    await visibleText(page, 'main'),
    `${label}: ${SONG.path} rendered no lyrics — the song page reached by the journey is empty`,
  ).toContain(SONG.lyric);

  /* --- Step 7: click through to a real alternate version (FR-13). This is the
   * relationship, exercised end to end: the ledger → a parent → its alternate,
   * all by clicking. */
  const alternateLink = page.locator(`main a[href$="${ALTERNATE.path}"]`).first();
  await expect(
    alternateLink,
    `${label}: "${SONG.title}" does not link to its alternate version "${ALTERNATE.title}" ` +
      `(${ALTERNATE.path}) — verified in the dataset as a real field_parent_song relationship`,
  ).toBeVisible();
  await alternateLink.click();
  await page.waitForLoadState('domcontentloaded');

  expect(
    currentPath(page),
    `${label}: following the alternate-version link did not land on ${ALTERNATE.path}`,
  ).toBe(ALTERNATE.path);
  await expect(
    page.locator('h1'),
    `${label}: the page reached by the alternate link is not "${ALTERNATE.title}"`,
  ).toHaveText(rx(ALTERNATE.title));
  expect(
    await visibleText(page, 'main'),
    `${label}: ${ALTERNATE.path} rendered none of its own lyrics`,
  ).toContain(ALTERNATE.lyric);

  /* --- Step 8: and the relationship composes back the other way, so the
   * visitor is not stranded on the alternate. */
  await expect(
    page.locator(`main a[href$="${SONG.path}"]`).first(),
    `${label}: "${ALTERNATE.title}" offers no way back to its parent "${SONG.title}" (FR-13)`,
  ).toBeVisible();
}

test.describe('E2E capstone — the cross-screen journey (INT8-021)', () => {
  test('front page → Songs → Type filter → a song → its alternate, all by clicking, at desktop', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await walkTheJourney(page, 'desktop');
  });

  test('the same journey survives a 320px viewport (NFR-2)', async ({ page }) => {
    // NFR-2's contractual minimum width. No configured browser project is this
    // narrow, so it is pinned here.
    //
    // This is the journey's OWN 320px check, not a second copy of the
    // per-screen responsive suites (songs-landing.spec.ts, song-page.spec.ts and
    // song-versions.spec.ts each assert their screen's content and layout at
    // 320px already). What is asserted here is only what those cannot see: that
    // the journey's steps still WORK at 320px — the ☰ panel opens and its Songs
    // link is clickable, the Type filter can be operated, ledger links can be
    // clicked — and that no page the journey passes through pushes the document
    // sideways on the way.
    await page.setViewportSize(NARROW);

    const overflows: string[] = [];
    page.on('load', () => {
      /* recorded per navigation below instead — see the checks after each hop */
    });

    await walkTheJourney(page, '320px');

    // Walk the journey's own pages again for overflow, in the state the journey
    // leaves them. Each is checked at the width the visitor is actually using.
    for (const path of ['/', '/songs?type=Modest+Mouse&alt=1', SONG.path, ALTERNATE.path]) {
      await page.goto(path);
      const overflow = await horizontalOverflow(page);
      if (overflow > 1) overflows.push(`${path} overflows by ${overflow}px`);
    }
    expect(
      overflows,
      `pages in the journey scroll horizontally at 320px: ${overflows.join('; ')}`,
    ).toEqual([]);
  });

  test('axe: the two screens the journey visits are clean in the state the journey leaves them (NFR-1)', async ({
    page,
  }) => {
    // See "THE AXE DECISION" in the file header. This is a confirmatory pass on
    // states no other test scans — a landing the visitor has just filtered
    // through the form, and a song page reached by clicking — not a copy of the
    // per-screen a11y suites, which remain the exhaustive coverage.
    await page.setViewportSize(DESKTOP);

    await page.goto('/');
    await openNavIfCollapsed(page);
    await navLink(page, 'Songs').click();
    await page.waitForLoadState('domcontentloaded');
    await applyType(page, TYPE_MODEST_MOUSE);

    const onLanding = await seriousViolations(page);
    expect(
      onLanding,
      `Songs landing, after the Type filter was applied through the form:\n${JSON.stringify(onLanding, null, 2)}`,
    ).toEqual([]);

    const songInLedger = page.locator(`a[href$="${SONG.path}"]`).first();
    await expect(songInLedger).toBeVisible();
    await songInLedger.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1')).toHaveText(rx(SONG.title));

    // No exclusion is needed: neither of this journey's songs has a
    // `field_video` value (only "Float On" and "King Rat" do), so nothing here
    // reaches a third-party player's own markup.
    const onSongPage = await seriousViolations(page);
    expect(
      onSongPage,
      `${SONG.path}, reached by clicking from the ledger:\n${JSON.stringify(onSongPage, null, 2)}`,
    ).toEqual([]);
  });
});
