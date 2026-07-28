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
  sideProjects: 'Side Projects',
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
      // INT8-030 gave the document `scroll-behavior: smooth` (gated on
      // prefers-reduced-motion), so window.scrollTo now ANIMATES — two
      // animation frames land mid-flight and read a scrollY of ~10 instead
      // of 1200. Wait for the scroll to actually come to rest first. This
      // changes only when the measurement is taken, not what is asserted:
      // every expectation below is untouched.
      await waitForScrollSettled(page);
      // Then let sticky positioning and any scroll handler settle.
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

/* -------------------------------------------------------------------------
 * INT8-030 — the letter rail as real jump-to-letter navigation.
 *
 * Written independently of the implementation, from the INT8-030 ticket only.
 * The ticket asks for plain same-page anchors, so every assertion below is
 * about observable browser behaviour (where the page ends up, what is on
 * screen, what Tab reaches) rather than about how the markup is produced.
 *
 * SELECTOR ASSUMPTIONS, stated up front so they are cheap to correct — the
 * assertions' intent does not depend on them:
 *
 *  D. A group header is `.song-ledger__group-header`. Quoted from the ticket,
 *     not guessed: §1 says "give every non-empty `.song-ledger__group-header`
 *     a stable `id`" and §4 names the same class for `scroll-margin-top`.
 *     Same precedent as `.song-ledger__rail` (assumption A) for INT8-029.
 *  E. The sticky site header is `header.site-header`. Established by
 *     page-shell.spec.ts, which asserts that exact selector and its
 *     `data-header-variant`; the ticket's §4 describes this element as the
 *     first of the page's two sticky layers.
 *  F. A "rail entry" is the deepest element inside the rail whose own text
 *     nodes are exactly one of A-Z or "#" — and, when that element sits
 *     inside an `<a href>`, that anchor. No class name is assumed, so the
 *     tests keep working whether a present letter becomes `<a>A</a>` or
 *     `<a><span>A</span></a>`.
 *
 * GROUND TRUTH, verified against the live migrated dataset at authoring time
 * by fetching /songs?type=All and parsing the rendered rail and headers:
 *   - 26 group headers render: A-Z **except X**, then "#".
 *   - "X" is therefore the one and only absent rail letter under ?type=All.
 *     W and Y — its neighbours, which the Tab-skip assertion needs — are both
 *     present.
 *   - The "#" catch-all bucket is non-empty (it holds "033104", "060606",
 *     "100HHHEAVYYY", "(8)copy", "3rd Planet", … ), so "#" is a real jump
 *     target and not a decorative leftover.
 *   - The document is ~6864px tall at 1280x900 and the "#" header sits at
 *     ~6612px, i.e. within the last viewport-height. That was checked
 *     deliberately: it means even the *last* bucket can be scrolled clear of
 *     the sticky header (it lands ~648px down the viewport at maximum
 *     scroll), so requirement 4 can be asserted strictly for "#" too, with no
 *     "unless the page has run out of scroll" escape hatch.
 * ---------------------------------------------------------------------- */

/** Group headers. See assumption D. */
const GROUP_HEADER = '.song-ledger__group-header';
/** The sticky site header. See assumption E. */
const SITE_HEADER = 'header.site-header';
/** The rail. Assumption A, reused. */
const RAIL = '.song-ledger__rail';

/** The only rail letter with no songs behind it under ?type=All. */
const ABSENT_LETTER = 'X';
/** Its neighbours in the rail, both present — the Tab-skip proof needs them. */
const BEFORE_ABSENT = 'W';
const AFTER_ABSENT = 'Y';
/**
 * Present letters used for the jump assertions.
 *
 * NOT an arbitrary spread. Simulated against the live page (ids + anchors
 * injected by hand, no scroll offset — i.e. the naive implementation), the
 * buckets behave in two distinct ways:
 *   - B, M, S land at viewport y ≈ -0.2 — squarely underneath the 89px sticky
 *     header — while their bottom edge is still inside the viewport. These
 *     are the letters that discriminate, and they are why "is it in the
 *     viewport?" is not a sufficient assertion.
 *   - Z and "#" sit within the final viewport-height of the document, so the
 *     browser runs out of scroll and they land correctly *even when the bug
 *     is present*. They can never fail requirement 4 and prove nothing about
 *     it on their own.
 * Early/middle letters therefore have to be in this list.
 */
const JUMP_LETTERS = ['B', 'M', 'S', 'Z'];

type RailEntryShape = {
  letter: string;
  tag: string;
  href: string | null;
  tabindex: string | null;
  ariaHidden: string | null;
  ariaDisabled: string | null;
  accessibleName: string;
};

/**
 * Find every rail entry (assumption F) and stamp it with
 * `data-i8-rail-entry="<letter>"` so the rest of a test can address it with a
 * plain, stable locator regardless of the markup the implementation chose.
 *
 * Adding a test-only attribute is the same technique page-shell.spec.ts uses
 * in `markAsCurrent()`; it changes nothing the assertions look at (no class,
 * no role, no geometry) and it is the only way to name "the entry for X"
 * without hardcoding a class the implementer is free to rename when the
 * `<span>` becomes an `<a>`.
 *
 * Must be re-run after every navigation.
 */
async function stampRailEntries(page: Page): Promise<RailEntryShape[]> {
  return (await page.evaluate((railSel) => {
    const rail = document.querySelector(railSel);
    if (!rail) return [];

    const ownText = (el: Element): string =>
      Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim();

    /** aria-label / aria-labelledby / title beat content, as the AAM says. */
    const nameOf = (el: Element): string => {
      const label = el.getAttribute('aria-label');
      if (label && label.trim()) return label.trim();
      const labelledby = el.getAttribute('aria-labelledby');
      if (labelledby) {
        const parts = labelledby
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (parts) return parts;
      }
      const title = el.getAttribute('title');
      if (title && title.trim()) return title.trim();
      return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    };

    const out: RailEntryShape[] = [];
    for (const el of Array.from(rail.querySelectorAll('*'))) {
      const letter = ownText(el);
      if (!/^[A-Z#]$/.test(letter)) continue;
      const entry = (el.closest('a[href]') as Element | null) ?? el;
      if (entry.hasAttribute('data-i8-rail-entry')) continue;
      entry.setAttribute('data-i8-rail-entry', letter);
      out.push({
        letter,
        tag: entry.tagName.toLowerCase(),
        href: entry.getAttribute('href'),
        tabindex: entry.getAttribute('tabindex'),
        ariaHidden: entry.getAttribute('aria-hidden'),
        ariaDisabled: entry.getAttribute('aria-disabled'),
        accessibleName: nameOf(entry),
      });
    }
    return out;
  }, RAIL)) as RailEntryShape[];
}

function railEntry(page: Page, letter: string) {
  return page.locator(`[data-i8-rail-entry="${letter}"]`);
}

/**
 * Wait until scrolling has stopped. `scroll-behavior: smooth` (requirement 5)
 * animates the jump, so reading a bounding box immediately after the click
 * would measure a frame somewhere in the middle of the journey — the single
 * likeliest way for the requirement-4 assertion to become flaky nonsense.
 */
async function waitForScrollSettled(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __i8LastY?: number; __i8Still?: number };
      const y = Math.round(window.scrollY);
      if (w.__i8LastY === y) w.__i8Still = (w.__i8Still ?? 0) + 1;
      else {
        w.__i8LastY = y;
        w.__i8Still = 0;
      }
      return (w.__i8Still ?? 0) >= 3;
    },
    null,
    { timeout: 5000, polling: 60 },
  );
  await page.evaluate(() => {
    const w = window as unknown as { __i8LastY?: number; __i8Still?: number };
    delete w.__i8LastY;
    delete w.__i8Still;
  });
}

type Box = { top: number; right: number; bottom: number; left: number; width: number; height: number };

type Landing = {
  /** The fragment the rail entry pointed at, decoded. */
  fragment: string;
  /** Whether that fragment resolved to an element at all. */
  targetFound: boolean;
  /** The resolved target's own text — must be the bucket's letter. */
  targetText: string;
  /** Whether the resolved target really is a group header (assumption D). */
  targetIsGroupHeader: boolean;
  targetBox: Box | null;
  headerBox: Box | null;
  railBox: Box | null;
  viewportHeight: number;
  scrollY: number;
  /** What is actually painted at three points inside the target's own box. */
  hits: { at: string; element: string; isTarget: boolean }[];
};

/**
 * Everything requirement 4 needs, measured in one round-trip at the position
 * the browser actually came to rest in.
 */
async function measureLanding(page: Page, fragment: string): Promise<Landing> {
  return (await page.evaluate(
    ({ frag, headerSel, railSel, groupSel }) => {
      const box = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
      };
      const describe = (el: Element | null): string => {
        if (!el) return '(nothing)';
        const cls = (el.getAttribute('class') ?? '').trim().split(/\s+/).filter(Boolean).join('.');
        return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls}` : ''}`;
      };
      const ownText = (el: Element): string =>
        Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent ?? '')
          .join('')
          .replace(/\s+/g, ' ')
          .trim();

      const id = frag.replace(/^#/, '');
      let target: Element | null = null;
      try {
        target = id ? document.getElementById(id) : null;
      } catch {
        target = null;
      }

      const targetBox = box(target);
      const hits: { at: string; element: string; isTarget: boolean }[] = [];
      if (target && targetBox && targetBox.width > 0 && targetBox.height > 0) {
        const probes: [string, number, number][] = [
          ['top edge, centre', targetBox.left + targetBox.width / 2, targetBox.top + Math.min(4, targetBox.height / 2)],
          ['middle, centre', targetBox.left + targetBox.width / 2, targetBox.top + targetBox.height / 2],
          ['middle, left edge', targetBox.left + Math.min(6, targetBox.width / 2), targetBox.top + targetBox.height / 2],
        ];
        for (const [at, x, y] of probes) {
          const hit = document.elementFromPoint(x, y);
          hits.push({
            at,
            element: describe(hit),
            isTarget: Boolean(hit) && (hit === target || target.contains(hit as Node)),
          });
        }
      }

      return {
        fragment: frag,
        targetFound: Boolean(target),
        targetText: target ? ownText(target) : '',
        targetIsGroupHeader: Boolean(target && target.matches(groupSel)),
        targetBox,
        headerBox: box(document.querySelector(headerSel)),
        railBox: box(document.querySelector(railSel)),
        viewportHeight: window.innerHeight,
        scrollY: Math.round(window.scrollY),
        hits,
      };
    },
    { frag: fragment, headerSel: SITE_HEADER, railSel: RAIL, groupSel: GROUP_HEADER },
  )) as Landing;
}

/**
 * THE ASSERTION REQUIREMENT 4 EXISTS FOR.
 *
 * A naive `#anchor` jump scrolls the target to viewport y=0, which on this
 * page puts it *underneath* the sticky site header — the group header the
 * user just asked to see is the very thing that gets hidden. So "did it
 * scroll?" and even "is it inside the viewport?" both pass while the bug is
 * present; neither is sufficient.
 *
 * What is asserted instead, all against boxes measured live at the resting
 * scroll position, never against a hardcoded pixel offset:
 *
 *  1. PREMISE — the sticky header is really docked over the top of the
 *     viewport at this scroll position. Without this the whole check could
 *     pass vacuously (nothing can be hidden behind a header that isn't
 *     there), so it is asserted rather than assumed.
 *  2. The target's TOP edge is at or below the header's BOTTOM edge. This is
 *     the geometric statement of "not underneath the header", and it is
 *     false by construction for a jump with no scroll offset.
 *  3. The target's BOTTOM edge is inside the viewport — so the whole header
 *     row is visible, not just its lower sliver peeking out.
 *  4. It is clear of the *other* sticky layer, the rail itself.
 *  5. Belt and braces against anything geometry cannot see (z-index,
 *     transforms, a translucent overlay): what the browser reports as
 *     painted at three points inside the target's own box is the target, not
 *     the site header.
 */
function expectLandedClearOfStickyChrome(landing: Landing, label: string): void {
  expect(landing.targetFound, `${label}: the fragment "${landing.fragment}" resolves to no element`).toBe(true);
  expect(landing.targetBox, `${label}: the jump target has no box`).not.toBeNull();
  expect(landing.headerBox, `${label}: no ${SITE_HEADER} found — see assumption E`).not.toBeNull();

  const target = landing.targetBox!;
  const header = landing.headerBox!;

  // 1. Premise: the sticky header is docked over the top of the viewport.
  expect(
    header.bottom,
    `${label}: PREMISE FAILED — the sticky site header is not covering the top of the viewport ` +
      `(its box is ${JSON.stringify(header)}), so this test cannot prove anything about overlap`,
  ).toBeGreaterThan(0);
  expect(header.top, `${label}: PREMISE FAILED — the site header is not docked at the viewport top`).toBeLessThanOrEqual(2);

  // 2. Not underneath the sticky header. The half-pixel is sub-pixel layout
  //    rounding only — nowhere near enough slack to let an 89px-tall header
  //    swallow the group header.
  expect(
    target.top,
    `${label}: the group header landed UNDER the sticky site header — its top is at y=${target.top.toFixed(1)} ` +
      `but the header's bottom edge is at y=${header.bottom.toFixed(1)}. This is the sticky-offset bug ` +
      '(requirement 4): the jump needs a scroll offset equal to the sticky chrome above it.',
  ).toBeGreaterThanOrEqual(header.bottom - 0.5);

  // 3. Fully visible, not merely "in the viewport".
  expect(
    target.bottom,
    `${label}: the group header is cut off at the bottom of the viewport ` +
      `(bottom y=${target.bottom.toFixed(1)}, viewport ${landing.viewportHeight}px)`,
  ).toBeLessThanOrEqual(landing.viewportHeight);

  // 4. Clear of the second sticky layer — the rail.
  if (landing.railBox) {
    const rail = landing.railBox;
    const overlapsVertically = target.top < rail.bottom && target.bottom > rail.top;
    const overlapsHorizontally = target.left < rail.right && target.right > rail.left;
    expect(
      overlapsVertically && overlapsHorizontally,
      `${label}: the group header overlaps the sticky rail (header ${JSON.stringify(target)}, rail ${JSON.stringify(rail)})`,
    ).toBe(false);
  }

  // 5. Nothing is painted on top of it.
  expect(landing.hits.length, `${label}: could not probe what is painted over the group header`).toBeGreaterThan(0);
  for (const hit of landing.hits) {
    expect(
      hit.isTarget,
      `${label}: the group header is obscured — at its ${hit.at} the browser paints "${hit.element}", not the header itself`,
    ).toBe(true);
  }
}

/**
 * Resolve a design token to the value the browser actually computes, by
 * letting the browser do it on a throwaway element. Same discipline as
 * page-hero.spec.ts's tokenPx(): the token file is the visual contract, so
 * the test agrees with whatever it currently says instead of copying a value
 * out of it (the ticket forbids new tokens and hardcoded px/hex alike).
 */
async function resolveTokens(page: Page): Promise<{ width: string; colours: string[] }> {
  return page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.borderStyle = 'solid';
    probe.style.borderTopWidth = 'var(--focus-ring-width)';
    probe.style.color = 'var(--focus-ring-color)';
    document.body.appendChild(probe);
    const width = getComputedStyle(probe).borderTopWidth;
    const colour = getComputedStyle(probe).color;
    probe.style.color = 'var(--focus-ring-color-on-dark)';
    const colourOnDark = getComputedStyle(probe).color;
    probe.remove();
    return { width, colours: [colour, colourOnDark] };
  });
}

type Ring = { outlineStyle: string; outlineWidth: string; outlineColor: string; outlineOffset: string; boxShadow: string };

async function ringOf(page: Page, letter: string): Promise<Ring> {
  return railEntry(page, letter).evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      outlineOffset: cs.outlineOffset,
      boxShadow: cs.boxShadow,
    };
  });
}

/** Tab from the document start until `predicate` says we have arrived. */
async function tabUntil(
  page: Page,
  predicate: () => Promise<boolean>,
  maxTabs = 90,
): Promise<number> {
  for (let i = 1; i <= maxTabs; i++) {
    await page.keyboard.press('Tab');
    if (await predicate()) return i;
  }
  return -1;
}

/** The `data-i8-rail-entry` value of whatever currently has focus, or null. */
async function focusedRailLetter(page: Page): Promise<string | null> {
  return page.evaluate(() => document.activeElement?.getAttribute('data-i8-rail-entry') ?? null);
}

test.describe('Songs landing — jump-to-letter rail (INT8-030)', () => {
  test.beforeEach(async ({ page }) => {
    // The rail only exists above --bp-nav (760px), and the project's browser
    // matrix includes phone viewports, so every desktop assertion pins its
    // own viewport rather than inheriting one.
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('every present rail letter links to its own bucket\'s group-header id (INT8-030)', async ({
    page,
  }) => {
    await page.goto(songsUrl({ type: TYPE.all }));
    const entries = await stampRailEntries(page);
    expect(entries.length, `no rail entries found in ${RAIL} — see assumptions A and F`).toBe(27);

    // Ground truth: only X is absent under ?type=All (verified against the
    // live dataset — see the header comment).
    const absent = entries.filter((e) => !e.href).map((e) => e.letter);
    expect(
      absent,
      `the rail's non-linked entries should be exactly [${ABSENT_LETTER}] — every other bucket has songs`,
    ).toEqual([ABSENT_LETTER]);

    // Every present entry is a real anchor to a same-page fragment. Real
    // anchors are what buy the browser behaviour the ticket is paying for
    // (back button, bookmarkable fragment, works without JS), so "an <a> with
    // an href" is asserted rather than merely "something clickable".
    const present = entries.filter((e) => e.letter !== ABSENT_LETTER);
    for (const entry of present) {
      expect(entry.tag, `rail entry "${entry.letter}" is a <${entry.tag}>, not a link`).toBe('a');
      expect(entry.href, `rail entry "${entry.letter}" has no href`).toMatch(/^#\S/);
    }

    // Each fragment resolves to exactly one element, that element is the
    // group header for that same letter, and no two rail entries point at the
    // same id. This is the ticket's "the rail<->header mapping cannot drift"
    // requirement, asserted from the outside: it holds only if both sides
    // were handed the same computed id.
    const mapping = await page.evaluate(
      ({ groupSel, wanted }) => {
        const ownText = (el: Element): string =>
          Array.from(el.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent ?? '')
            .join('')
            .replace(/\s+/g, ' ')
            .trim();

        const headers = Array.from(document.querySelectorAll(groupSel)).map((el) => ({
          text: ownText(el),
          id: el.id,
        }));

        const targets = wanted.map(({ letter, href }) => {
          const id = (href ?? '').replace(/^#/, '');
          const matches = id ? document.querySelectorAll(`[id="${CSS.escape(id)}"]`).length : 0;
          const el = id ? document.getElementById(id) : null;
          return {
            letter,
            id,
            matches,
            isGroupHeader: Boolean(el && el.matches(groupSel)),
            text: el ? ownText(el) : null,
          };
        });

        return { headers, targets };
      },
      { groupSel: GROUP_HEADER, wanted: present.map((e) => ({ letter: e.letter, href: e.href })) },
    );

    // 26 buckets render under ?type=All: A-Z without X, then "#".
    expect(mapping.headers.length, 'unexpected number of group headers').toBe(26);
    for (const header of mapping.headers) {
      expect(header.id, `the "${header.text}" group header has no id`).not.toBe('');
    }
    expect(
      new Set(mapping.headers.map((h) => h.id)).size,
      `group-header ids are not unique: ${mapping.headers.map((h) => h.id).join(' ')}`,
    ).toBe(mapping.headers.length);

    for (const target of mapping.targets) {
      expect(target.matches, `rail entry "${target.letter}" points at "#${target.id}", which matches ${target.matches} elements`).toBe(1);
      expect(target.isGroupHeader, `rail entry "${target.letter}" points at "#${target.id}", which is not a ${GROUP_HEADER}`).toBe(true);
      expect(target.text, `rail entry "${target.letter}" points at the "${target.text}" bucket`).toBe(target.letter);
    }

    // The "#" bucket's fragment must not be a literal "#": that is an empty
    // fragment, which scrolls to the top of the document instead of to the
    // catch-all bucket, and percent-encoding it is the needless trap the
    // ticket calls out.
    const hash = present.find((e) => e.letter === CATCH_ALL)!;
    expect(hash.href, 'the "#" rail entry has no href').not.toBeNull();
    expect(hash.href, 'the "#" entry\'s fragment is empty (href="#") — it would jump to the top of the page').not.toBe('#');
    expect(
      decodeURIComponent(hash.href!.replace(/^#/, '')),
      'the "#" entry\'s fragment is a literal "#" — the ticket requires an explicitly non-"#" slug',
    ).not.toBe(CATCH_ALL);

    // "Stable": the same ids on a fresh render, so they are derived from the
    // bucket and not from a request-scoped counter or a uniqid.
    await page.goto(songsUrl({ type: TYPE.all }));
    const second = await stampRailEntries(page);
    expect(
      second.map((e) => `${e.letter}=${e.href ?? '-'}`),
      'the rail\'s fragments changed between two identical page loads — the ids are not stable',
    ).toEqual(entries.map((e) => `${e.letter}=${e.href ?? '-'}`));
  });

  test('clicking a rail letter lands its group header fully clear of the sticky chrome (INT8-030)', async ({
    page,
  }) => {
    await page.goto(songsUrl({ type: TYPE.all }));
    await stampRailEntries(page);

    for (const letter of JUMP_LETTERS) {
      const entry = railEntry(page, letter);
      await expect(entry, `no rail entry for "${letter}"`).toHaveCount(1);
      const href = await entry.getAttribute('href');
      expect(href, `rail entry "${letter}" has no href — it is not a link, so it cannot be clicked to jump`).not.toBeNull();
      expect(href!, `rail entry "${letter}" does not point at a same-page fragment`).toMatch(/^#\S/);

      await entry.click();
      await waitForScrollSettled(page);

      // The browser recorded the jump in the address bar — the fragment is
      // bookmarkable/shareable, which is half of why the ticket wants real
      // anchors rather than a scripted scroll.
      expect(page.url(), `clicking "${letter}" did not put its fragment in the URL`).toContain(href!);

      const landing = await measureLanding(page, href!);
      expect(landing.scrollY, `clicking "${letter}" left the page at the very top — nothing happened`).toBeGreaterThan(0);
      expect(landing.targetIsGroupHeader, `"${letter}" jumped to something that is not a group header`).toBe(true);
      expect(landing.targetText, `"${letter}" jumped to the "${landing.targetText}" bucket`).toBe(letter);

      expectLandedClearOfStickyChrome(landing, `jump to "${letter}"`);
    }
  });

  test('the "#" entry jumps to the catch-all bucket, clear of the sticky chrome (INT8-030)', async ({
    page,
  }) => {
    await page.goto(songsUrl({ type: TYPE.all }));
    await stampRailEntries(page);

    const entry = railEntry(page, CATCH_ALL);
    await expect(entry, 'no "#" rail entry').toHaveCount(1);
    const href = await entry.getAttribute('href');
    expect(href, 'the "#" rail entry has no href — it is not a link').not.toBeNull();
    expect(href!, 'the "#" rail entry does not point at a same-page fragment').toMatch(/^#\S/);
    expect(href, 'the "#" entry links to the empty fragment, which jumps to the top of the page').not.toBe('#');

    await entry.click();
    await waitForScrollSettled(page);

    const landing = await measureLanding(page, href!);
    expect(landing.targetIsGroupHeader, 'the "#" entry does not point at a group header').toBe(true);
    expect(landing.targetText, 'the "#" entry points at the wrong bucket').toBe(CATCH_ALL);

    // "#" is the last bucket, so the browser runs out of document before it
    // can put the header at y=0; measured against the real page it comes to
    // rest ~648px down the viewport whether or not a scroll offset is
    // applied. The check below is therefore a consistency guard here, not the
    // requirement-4 proof — that lives in the JUMP_LETTERS test above, where
    // B/M/S can actually land under the header.
    expectLandedClearOfStickyChrome(landing, 'jump to "#"');
  });

  test('an absent letter is inert text and Tab skips straight past it (INT8-030)', async ({
    page,
  }) => {
    await page.goto(songsUrl({ type: TYPE.all }));
    const entries = await stampRailEntries(page);

    const absent = entries.find((e) => e.letter === ABSENT_LETTER);
    expect(absent, `no "${ABSENT_LETTER}" rail entry to check`).toBeTruthy();

    // Not a link, and not made focusable by any other means. Nothing to jump
    // to, so nothing to activate.
    expect(absent!.tag, `"${ABSENT_LETTER}" has no songs, so it must not be a <${absent!.tag}>`).not.toBe('a');
    expect(absent!.href, `"${ABSENT_LETTER}" has an href but no bucket to jump to`).toBeNull();
    expect(
      absent!.tabindex === null || Number(absent!.tabindex) < 0,
      `"${ABSENT_LETTER}" carries tabindex="${absent!.tabindex}", putting a dead stop in the tab order`,
    ).toBe(true);
    // The ticket rules aria-disabled out explicitly: an absent letter is not
    // a temporarily unavailable control, it is alphabet filler.
    expect(absent!.ariaDisabled, `"${ABSENT_LETTER}" is marked aria-disabled; the ticket requires plain inert text`).toBeNull();

    // No focusable descendant either, whatever the element turned out to be.
    await expect(
      railEntry(page, ABSENT_LETTER).locator('a[href], button, [tabindex]:not([tabindex="-1"])'),
      `"${ABSENT_LETTER}" contains something focusable`,
    ).toHaveCount(0);

    // And the real proof, done the way a keyboard user would: tab to W (the
    // present letter immediately before X), press Tab once, and land on Y.
    // Both neighbours are present in the live dataset, so a single Tab
    // stepping W -> Y is exactly "X is not in the tab order".
    const reached = await tabUntil(page, async () => (await focusedRailLetter(page)) === BEFORE_ABSENT);
    expect(reached, `could not Tab to the "${BEFORE_ABSENT}" rail entry within 90 tab stops`).toBeGreaterThan(0);

    await page.keyboard.press('Tab');
    expect(
      await focusedRailLetter(page),
      `Tab from "${BEFORE_ABSENT}" should land on "${AFTER_ABSENT}", skipping the empty "${ABSENT_LETTER}" bucket`,
    ).toBe(AFTER_ABSENT);
  });

  test('a rail letter is Tab-reachable, shows the token focus ring, and Enter jumps (INT8-030)', async ({
    page,
  }) => {
    await page.goto(songsUrl({ type: TYPE.all }));
    await stampRailEntries(page);

    // Tab from the top of the document: this proves the rail is genuinely in
    // the tab order rather than merely focusable programmatically.
    const tabs = await tabUntil(page, async () => (await focusedRailLetter(page)) !== null);
    expect(tabs, 'no rail entry is reachable by Tab within 90 tab stops').toBeGreaterThan(0);

    const first = await focusedRailLetter(page);
    // A is the first present bucket under ?type=All, and DOM order is tab
    // order, so the rail's first tab stop is A.
    expect(first, `the rail's first tab stop is "${first}", not "A"`).toBe('A');
    await expect(railEntry(page, 'A')).toBeFocused();

    // Focus ring, following INT8-027's precedent (page-shell.spec.ts asserts
    // computed outline/box-shadow rather than a screenshot) but tightened the
    // way this ticket asks: §3 names --focus-ring-width / --focus-ring-color
    // and forbids new tokens, so the ring is compared against those tokens as
    // the live page resolves them — no px or hex is written down here.
    const ring = await ringOf(page, 'A');
    const tokens = await resolveTokens(page);
    expect(
      ring.outlineStyle,
      `the focused rail letter has no outline at all: ${JSON.stringify(ring)} — a keyboard user cannot see where they are (NFR-1)`,
    ).not.toBe('none');
    expect(parseFloat(ring.outlineWidth), `the focused rail letter's outline has no width: ${JSON.stringify(ring)}`).toBeGreaterThan(0);
    expect(
      ring.outlineWidth,
      `the rail's focus ring is ${ring.outlineWidth}, not --focus-ring-width (${tokens.width})`,
    ).toBe(tokens.width);
    expect(
      tokens.colours,
      `the rail's focus ring is drawn in ${ring.outlineColor}, which is neither --focus-ring-color nor --focus-ring-color-on-dark (${tokens.colours.join(' / ')})`,
    ).toContain(ring.outlineColor);

    // Enter activates it — the other half of "keyboard operable". A real
    // <a href> gives this for free; anything that needs a click handler
    // would fail here.
    const href = await railEntry(page, 'A').getAttribute('href');
    expect(href, 'the focused rail entry has no href, so Enter has nothing to activate').not.toBeNull();
    expect(href!, 'the focused rail entry does not point at a same-page fragment').toMatch(/^#\S/);

    await page.keyboard.press('Enter');
    await waitForScrollSettled(page);

    const landing = await measureLanding(page, href!);
    expect(landing.targetText, 'Enter on the "A" rail entry did not reach the A bucket').toBe('A');
    expectLandedClearOfStickyChrome(landing, 'Enter on "A"');
  });

  test('the rail is an exposed, labelled navigation region (INT8-030)', async ({ page }) => {
    await page.goto(songsUrl({ type: TYPE.all }));

    const exposure = await page.evaluate(
      (railSel) => {
        const rail = document.querySelector(railSel);
        if (!rail) return null;

        // aria-hidden on the rail *or on any ancestor* hides the whole
        // subtree from assistive technology, so the whole chain is checked.
        let hiddenBy: string | null = null;
        for (let el: Element | null = rail; el; el = el.parentElement) {
          if (el.getAttribute('aria-hidden') === 'true') {
            hiddenBy = el.tagName.toLowerCase() + (el.className ? `.${String(el.className).trim().split(/\s+/).join('.')}` : '');
            break;
          }
        }

        const nameOf = (el: Element): string => {
          const label = el.getAttribute('aria-label');
          if (label && label.trim()) return label.trim();
          const ref = el.getAttribute('aria-labelledby');
          if (ref) {
            const text = ref
              .split(/\s+/)
              .map((id) => document.getElementById(id)?.textContent ?? '')
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (text) return text;
          }
          return '';
        };

        const links = Array.from(rail.querySelectorAll('a[href]'));
        return {
          hiddenBy,
          isLandmark: rail.tagName === 'NAV' || rail.getAttribute('role') === 'navigation',
          landmarkName: nameOf(rail),
          linkCount: links.length,
          linkNames: links.map((a) => {
            const explicit = nameOf(a);
            const title = a.getAttribute('title') ?? '';
            return (explicit || title || a.textContent || '').replace(/\s+/g, ' ').trim();
          }),
        };
      },
      RAIL,
    );

    expect(exposure, `no ${RAIL} on the page — see assumption A`).not.toBeNull();

    // The core of the ticket's accessibility shift: the rail stops being
    // decoration. While it is aria-hidden its links are announced to nobody,
    // so a screen-reader or voice-control user has no jump navigation at all.
    expect(
      exposure!.hiddenBy,
      `the rail is still hidden from assistive technology by aria-hidden="true" on <${exposure!.hiddenBy}> — ` +
        'the ticket requires it to become a real navigation region',
    ).toBeNull();

    expect(exposure!.linkCount, 'the exposed rail contains no links').toBeGreaterThan(0);

    // WCAG 2.4.4 (Link Purpose in context): single-character link text is
    // only acceptable if something supplies the context. The ticket offers
    // two ways and says to pick one — a labelled navigation region, or a
    // per-link accessible name. Either satisfies this; doing neither does
    // not, and that is what is asserted.
    const labelledLandmark = exposure!.isLandmark && exposure!.landmarkName.length > 0;
    const namedLinks = exposure!.linkNames.every((n) => n.replace(/\s+/g, '').length > 1);
    expect(
      labelledLandmark || namedLinks,
      'the rail\'s single-character links have no context: it is neither a navigation landmark with an ' +
        `accessible name (landmark: ${exposure!.isLandmark}, name: "${exposure!.landmarkName}") nor a set of ` +
        `individually-named links (names: ${JSON.stringify(exposure!.linkNames.slice(0, 3))}…)`,
    ).toBe(true);
  });

  test('smooth scrolling is adopted and gated on prefers-reduced-motion (INT8-030)', async ({
    page,
  }) => {
    /**
     * Requirement 5. Read from the whole chain the document scroll actually
     * consults — the scrolling element and every ancestor of a group header —
     * so it does not matter whether the implementation scopes the declaration
     * to :root, to .song-ledger, or to something in between.
     *
     * NOTE ON THE TICKET'S ESCAPE HATCH: requirement 5 permits dropping smooth
     * scrolling entirely "if it turns out to fight the sticky-offset behaviour
     * in requirement 4", with the reason stated in `## Notes`. Red-green needs
     * a definite expectation, so the ticket's stated default — adopt it — is
     * what is asserted. If the implementer invokes the escape hatch, the
     * *first* expectation below is the one to relax (with the reason recorded);
     * the second is not negotiable, because it is the accessibility half.
     */
    const chainSmooth = async (): Promise<{ smooth: boolean; chain: string }> => {
      const chain = await page.evaluate((groupSel) => {
        const seen = new Set<Element>();
        const out: { el: string; value: string }[] = [];
        const add = (el: Element | null) => {
          if (!el || seen.has(el)) return;
          seen.add(el);
          const cls = String(el.className || '').trim().split(/\s+/).filter(Boolean).join('.');
          out.push({ el: `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`, value: getComputedStyle(el).scrollBehavior });
        };
        add(document.documentElement);
        add(document.body);
        add(document.scrollingElement);
        for (let el: Element | null = document.querySelector(groupSel); el; el = el.parentElement) add(el);
        return out;
      }, GROUP_HEADER);
      return {
        smooth: chain.some((c) => c.value === 'smooth'),
        chain: chain.map((c) => `${c.el}=${c.value}`).join(' '),
      };
    };

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(songsUrl({ type: TYPE.all }));
    const noPreference = await chainSmooth();
    expect(
      noPreference.smooth,
      `no element in the scroll chain declares scroll-behavior: smooth under prefers-reduced-motion: ` +
        `no-preference — ${noPreference.chain}`,
    ).toBe(true);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(songsUrl({ type: TYPE.all }));
    const reduced = await chainSmooth();
    // Scrolling animation is a recognised vestibular trigger. A user who has
    // asked their OS for reduced motion must get the instant jump, so smooth
    // must be gated behind @media (prefers-reduced-motion: no-preference)
    // rather than declared unconditionally.
    expect(
      reduced.smooth,
      `scroll-behavior: smooth is still applied under prefers-reduced-motion: reduce — ${reduced.chain}. ` +
        'It must be wrapped in @media (prefers-reduced-motion: no-preference).',
    ).toBe(false);
  });

  test('axe: the newly-exposed rail adds no serious/critical violations (INT8-030)', async ({
    page,
  }) => {
    await page.goto(songsUrl({ type: TYPE.all }));

    // PREMISE, deliberate: Axe skips aria-hidden subtrees entirely, so while
    // the rail is decoration this page is green for free and the check proves
    // nothing. Asserting exposure first is what makes the Axe run below
    // actually look at the rail's text — in particular the absent letters,
    // which are --color-line on white (~1.5:1) and would be a colour-contrast
    // violation the moment they are announced. Requirement 2 makes the
    // implementer choose a treatment; this is the check that confirms it.
    const exposed = await page.evaluate((railSel) => {
      const rail = document.querySelector(railSel);
      if (!rail) return 'missing';
      for (let el: Element | null = rail; el; el = el.parentElement) {
        if (el.getAttribute('aria-hidden') === 'true') return 'aria-hidden';
      }
      return 'exposed';
    }, RAIL);
    expect(exposed, 'the rail is not exposed to assistive technology, so this Axe run would not inspect it').toBe('exposed');

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('below 760px the rail is still absent and offers no jump navigation (INT8-030)', async ({
    page,
  }) => {
    // ANTI-REGRESSION LOCK, green before the implementation by design — the
    // same role page-hero.spec.ts's page-cache test plays. The ticket is
    // explicit that this work is desktop-only by construction (the hi-fi's
    // mobile composition has no rail), so the requirement here is that
    // *nothing changes*: adding links, ids and a nav landmark must not leak a
    // hidden set of tab stops or a stray landmark into the mobile layout.
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(songsUrl({ type: TYPE.all }));

    const rail = page.locator(RAIL);
    await expect(rail, 'the rail should not be shown below 760px').not.toBeVisible();

    // Nothing in the rail is clickable or focusable at this width. Counting
    // *visible* links rather than DOM nodes is the honest test: display:none
    // already removes them from the tab order and from the a11y tree, which
    // is exactly the "absent" the ticket means.
    await expect(rail.locator('a[href]:visible'), 'the mobile layout renders rail jump links').toHaveCount(0);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'the page scrolls horizontally at 320px').toBeLessThanOrEqual(1);

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
