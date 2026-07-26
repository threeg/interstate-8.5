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

/* -------------------------------------------------------------------------
 * INT8-029 — bucket grouping, the "#" catch-all and the sticky letter rail.
 *
 * Written independently of the implementation, from the INT8-029 ticket only.
 * SELECTOR ASSUMPTIONS, stated up front so they are cheap to correct — the
 * assertions' intent does not depend on them:
 *
 *  A. The rail is `.song-ledger__rail`. This is the one class name the ticket
 *     itself names (§5, "the letter rail (`.song-ledger__rail` in the compiled
 *     page)"), so it is quoted from spec rather than guessed.
 *  B. The ledger block is `.song-ledger` (BEM parent of A). Used only to scope
 *     the scan; if it is absent the scan falls back to the nearest common
 *     ancestor of all song links, and then to <body>.
 *  C. A "group header" is not identified by class at all. It is any element
 *     inside the ledger, outside the rail and outside any <a>, whose *own*
 *     text nodes (so a visually-hidden prefix span does not hide it) trim to
 *     one or two non-space characters, and which is immediately followed in
 *     document order by a song link. Two characters, not one, on purpose: the
 *     defect being fixed renders headers reading "(" and ".", and those must
 *     be *seen* and rejected rather than silently skipped.
 * ---------------------------------------------------------------------- */

/**
 * Real titles from the migrated dataset that exercise the bucket rule.
 * Verified against node_field_data — these are the only three listable song
 * titles that begin with a non-alphanumeric character. Two of them are
 * quoted with the migrated data's own quirks and are NOT typos here:
 * "Gohsts" is how the legacy title is spelled, and the N-bucket song is
 * "Never Ending" as two words.
 */
const PUNCT_THEN_DIGIT_TITLE = '(8)copy';
const PUNCT_THEN_LETTER_TITLE = '(No Song)';
const ELLIPSIS_TITLE = '...But Theyre Not Singing Gohsts';
const N_BUCKET_FIRST_TITLE = 'Never Ending Math Equation';

/** The catch-all bucket's label, and the full rail the ticket specifies. */
const CATCH_ALL = '#';
const RAIL_ENTRIES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(CATCH_ALL);

type LedgerEntry = { kind: 'header' | 'song'; value: string };

/**
 * The ledger as a flat document-order sequence of group headers and song
 * links. See assumptions B and C above.
 */
async function ledgerSequence(page: Page): Promise<LedgerEntry[]> {
  const raw = (await page.evaluate(() => {
    const songHref = (el: Element): string | null => {
      const href = el.getAttribute('href') ?? '';
      return /\/songs\/[^/?#]+/.test(href) ? href : null;
    };
    const isSongLink = (el: Element) => el.tagName === 'A' && songHref(el) !== null;

    const links = Array.from(document.querySelectorAll('a[href]')).filter(isSongLink);

    // Scope: the ledger block, else the nearest common ancestor of the song
    // links, else the whole document.
    let scope: Element = document.body;
    const ledger = document.querySelector('.song-ledger');
    if (ledger) {
      scope = ledger;
    } else if (links.length > 1) {
      let node: Element | null = links[0];
      const last = links[links.length - 1];
      while (node && !node.contains(last)) node = node.parentElement;
      if (node) scope = node;
    }

    const rail = document.querySelector('.song-ledger__rail');

    /** Text contributed by an element's own text nodes only. */
    const ownText = (el: Element): string =>
      Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim();

    const out: { kind: string; value: string }[] = [];
    const seen = new Set<string>();
    for (const el of Array.from(scope.querySelectorAll('*'))) {
      const href = songHref(el);
      if (href && el.tagName === 'A') {
        if (seen.has(href)) continue;
        seen.add(href);
        out.push({ kind: 'song', value: (el.textContent ?? '').replace(/\s+/g, ' ').trim() });
        continue;
      }
      // Never mistake a rail entry (or any nav/link text) for a header.
      if (rail && rail.contains(el)) continue;
      if (el.closest('a')) continue;
      if (el.closest('nav')) continue;
      if (el.closest('[class*="rail"]')) continue;
      // One or two characters that could plausibly *read* as a bucket
      // heading: a letter, a digit, "#", or the leading punctuation the
      // current defect groups by. Deliberately excludes "*" and other
      // marker glyphs so a per-row alternate-title badge is not mistaken
      // for a heading.
      const text = ownText(el);
      if (/^[A-Za-z0-9#(\[{'"&.…,!?-]{1,2}$/.test(text)) {
        out.push({ kind: 'header', value: text });
      }
    }
    return out;
  })) as LedgerEntry[];

  // A header heads a group: keep only candidates immediately followed by a
  // song link. This drops incidental one/two-character text elsewhere.
  return raw.filter((e, i) => e.kind === 'song' || raw[i + 1]?.kind === 'song');
}

/** Just the group headers, in document order. */
function groupHeaders(seq: LedgerEntry[]): string[] {
  return seq.filter((e) => e.kind === 'header').map((e) => e.value);
}

/** The header a given song title is listed under, or null if it precedes all. */
function headerForTitle(seq: LedgerEntry[], title: string): string | null {
  let current: string | null = null;
  for (const entry of seq) {
    if (entry.kind === 'header') current = entry.value;
    else if (isTitle(entry.value, title)) return current;
  }
  return null;
}

type RailEntry = {
  text: string;
  tag: string;
  hasHref: boolean;
  ariaDisabled: string | null;
};

/**
 * The rail's entries in document order (assumption A), with just enough shape
 * to compare how one entry is marked against another — the ticket requires
 * "#" to be marked present when its bucket is non-empty, but does not pin how
 * presence is expressed, so the test compares "#" against a letter that is
 * unarguably present rather than inventing a class name.
 */
async function railEntries(page: Page): Promise<RailEntry[]> {
  return (await page.evaluate(() => {
    const rail = document.querySelector('.song-ledger__rail');
    if (!rail) return [];
    const ownText = (el: Element): string =>
      Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
    return Array.from(rail.querySelectorAll('*'))
      .filter((el) => /^\S{1,2}$/.test(ownText(el)))
      .map((el) => ({
        text: ownText(el),
        tag: el.tagName.toLowerCase(),
        hasHref: el.hasAttribute('href') || el.closest('a[href]') !== null,
        ariaDisabled: el.getAttribute('aria-disabled'),
      }));
  })) as RailEntry[];
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

  test('a title behind punctuation buckets by the first letter-or-digit found (INT8-029)', async ({
    page,
  }) => {
    await page.goto(songsUrl({ type: TYPE.all }));
    const seq = await ledgerSequence(page);
    expect(groupHeaders(seq).length, 'no group headers were found — see assumption C').toBeGreaterThan(0);

    // The rule looks *past* leading punctuation, then stops at the first
    // letter or digit. A digit sends the title to the catch-all even though
    // a letter ("copy") follows: "(8)copy" must not file under C, and must
    // not get a heading of its own reading "(".
    expect(
      headerForTitle(seq, PUNCT_THEN_DIGIT_TITLE),
      `"${PUNCT_THEN_DIGIT_TITLE}" is not under a "${CATCH_ALL}" heading`,
    ).toBe(CATCH_ALL);

    // Same first step, opposite outcome: past the "(" is a letter, so this
    // files under N like anyone would expect.
    expect(
      headerForTitle(seq, PUNCT_THEN_LETTER_TITLE),
      `"${PUNCT_THEN_LETTER_TITLE}" is not under an "N" heading`,
    ).toBe('N');

    expect(
      headerForTitle(seq, ELLIPSIS_TITLE),
      `"${ELLIPSIS_TITLE}" is not under a "B" heading`,
    ).toBe('B');
  });

  test('every group header is A-Z or "#", appears once, and "#" comes last (INT8-029)', async ({
    page,
  }) => {
    const combos = [
      songsUrl(),
      songsUrl({ type: TYPE.all }),
      songsUrl({ type: TYPE.all, alt: '0' }),
      songsUrl({ type: TYPE.modestMouse, alt: '0' }),
      songsUrl({ type: TYPE.sideProjects }),
    ];

    for (const url of combos) {
      await page.goto(url);
      const headers = groupHeaders(await ledgerSequence(page));
      expect(headers.length, `no group headers on ${url}`).toBeGreaterThan(0);

      // No nonsense headings: never "(", never ".".
      for (const h of headers) {
        expect(h, `unexpected group heading "${h}" on ${url}`).toMatch(/^[A-Z#]$/);
      }

      // Each bucket is a single group — no repeats, consecutive or not.
      expect(
        new Set(headers).size,
        `duplicate group headings on ${url}: ${headers.join(' ')}`,
      ).toBe(headers.length);

      // Bucket order: A..Z ascending, then "#" last if it is present at all.
      const letters = headers.filter((h) => h !== CATCH_ALL);
      expect(letters, `letter buckets out of order on ${url}`).toEqual([...letters].sort());
      if (headers.includes(CATCH_ALL)) {
        expect(headers[headers.length - 1], `"#" is not the last bucket on ${url}`).toBe(CATCH_ALL);
      }
    }
  });

  test('rows inside a bucket are ordered by the comparison key (INT8-029)', async ({ page }) => {
    await page.goto(songsUrl({ type: TYPE.all }));
    const links = await songLinks(page);

    const iNeverending = indexOfTitle(links, N_BUCKET_FIRST_TITLE);
    const iNoSong = indexOfTitle(links, PUNCT_THEN_LETTER_TITLE);
    expect(iNeverending, `"${N_BUCKET_FIRST_TITLE}" should be listed`).toBeGreaterThan(-1);
    expect(iNoSong, `"${PUNCT_THEN_LETTER_TITLE}" should be listed`).toBeGreaterThan(-1);

    // Within N, ordering is by comparison key — "never ending..." before
    // "no song)". Ordering by the raw title would put "(No Song)" first,
    // since "(" sorts before any letter.
    expect(iNeverending).toBeLessThan(iNoSong);

    // Both are in the same, single N group.
    const seq = await ledgerSequence(page);
    expect(headerForTitle(seq, N_BUCKET_FIRST_TITLE)).toBe('N');
    expect(headerForTitle(seq, PUNCT_THEN_LETTER_TITLE)).toBe('N');
  });

  test('the letter rail runs A-Z then "#", marked present like any other bucket (INT8-029)', async ({
    page,
  }) => {
    await page.goto(songsUrl({ type: TYPE.all }));

    const entries = await railEntries(page);
    expect(entries.length, 'no rail entries found — see assumption A').toBeGreaterThan(0);
    expect(entries.map((e) => e.text)).toEqual(RAIL_ENTRIES);
    expect(entries[entries.length - 1].text).toBe(CATCH_ALL);

    // With the full catalogue the "#" bucket is non-empty, so the rail must
    // mark it present. Presence marking is not pinned by the ticket, so
    // compare "#" against B — a bucket that unarguably has songs — rather
    // than assert a class name this test has not been shown.
    const hash = entries.find((e) => e.text === CATCH_ALL)!;
    const present = entries.find((e) => e.text === 'B')!;
    expect(
      { tag: hash.tag, hasHref: hash.hasHref, ariaDisabled: hash.ariaDisabled },
      '"#" is not marked present the way a non-empty letter bucket is',
    ).toEqual({ tag: present.tag, hasHref: present.hasHref, ariaDisabled: present.ariaDisabled });
  });

  test('the letter rail stays in view while the ledger scrolls (INT8-029)', async ({ page }) => {
    // The ticket pins this at desktop widths, and the project matrix includes
    // phone viewports, so fix the viewport here rather than inherit it.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(songsUrl({ type: TYPE.all }));

    const rail = page.locator('.song-ledger__rail');
    await expect(rail, 'the rail is missing — see assumption A').toBeVisible();

    const railTop = async (): Promise<number> =>
      rail.evaluate((el) => el.getBoundingClientRect().top);
    const scrollTo = async (y: number): Promise<number> => {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      // Let sticky positioning and any scroll handler settle.
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
      return page.evaluate(() => Math.round(window.scrollY));
    };

    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(pageHeight, 'the 490-song ledger should be far taller than the viewport').toBeGreaterThan(
      3000,
    );

    await scrollTo(0);
    const topAtRest = await railTop();

    const firstOffset = await scrollTo(1200);
    expect(firstOffset, 'the page did not scroll').toBeGreaterThan(1000);
    const topScrolled = await railTop();

    const secondOffset = await scrollTo(2400);
    expect(secondOffset).toBeGreaterThan(firstOffset);
    const topScrolledFurther = await railTop();

    // A non-sticky rail scrolls away with the page: its viewport top would be
    // roughly topAtRest - 1200, i.e. far above the fold.
    expect(
      topScrolled,
      `the rail scrolled away with the page (top was ${topAtRest} at rest, ${topScrolled} after scrolling 1200px)`,
    ).toBeGreaterThan(topAtRest - 1000);

    // Sticky's signature: a constant viewport position across scroll offsets,
    // docked just below the sticky site header rather than pinned to 0.
    expect(topScrolled).toBeGreaterThanOrEqual(0);
    expect(topScrolled, 'the rail is docked well below the fold').toBeLessThan(300);
    expect(
      Math.abs(topScrolledFurther - topScrolled),
      'the rail moved between two scroll positions, so it is not sticking',
    ).toBeLessThanOrEqual(2);
  });
});
