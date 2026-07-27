import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Song versions — INT8-020. FR-13, FR-20 (plus NFR-1, NFR-2).
 *
 * Written independently of the implementation, from the ticket
 * (spec/tickets/INT8-020-song-versions.md), the requirements (§2.2, §4.3,
 * DR-1/DR-2/DR-3), the wireframe (spec/wireframes/03-song-page.md, Variant A
 * and Variant B), the design system (§3 "Lyric pair", and the 2026-07-26
 * decisions-log entry that pins the divider to `--color-line-accent`) and the
 * canonical hi-fi (`Interstate-8 1B.dc.html`, "Alternate version, side-by-side
 * lyrics") ONLY. No theme template, `.component.yml`, CSS, `.theme` file, PHP
 * or Drupal config was read while authoring this file, per the project's
 * independent-test-authorship rule (root CLAUDE.md, "Models"). The live
 * *rendered* pages were fetched to confirm the DOM assumptions below — that is
 * black-box observation, not a look at the source.
 *
 * SCOPE. This file covers ONLY a song's relationship to its parent and its
 * alternate versions:
 *   - FR-13 — a parent's page lists its alternates as links; an alternate's
 *     page links to its parent ("alternate title/lyrics for → parent").
 *   - FR-20 — an alternate's page shows its lyrics alongside the parent's
 *     normal lyrics; with `field_lyrics_same_as_parent` set, the alternate
 *     column reads "[same as normal version]" (linking the parent) instead of
 *     repeating them.
 * FR-12 / FR-14 / FR-15 / FR-17 are already covered by song-page.spec.ts
 * (INT8-019) and are deliberately NOT re-tested here. FR-10's alternate-title
 * marking on the *landing* belongs to songs-landing.spec.ts.
 *
 * SELECTOR ASSUMPTIONS, stated up front so they are cheap to correct — the
 * assertions' intent does not depend on any of them:
 *
 *  A. Nothing is addressed by a theme class name. The two lyric columns are
 *     found by their *label text* — "THIS VERSION" and "NORMAL VERSION" — which
 *     design-system.md §3 ("Lyric pair") pins verbatim, and their contents by
 *     the real migrated lyric lines they must show. Same technique as
 *     song-page.spec.ts assumption A.
 *  B. `<main>` wraps the page's own content; the site header, the page-title
 *     hero (which supplies the single `<h1>`) and the footer sit outside it.
 *     Established by page-hero.spec.ts and song-page.spec.ts (their assumption
 *     B) and re-confirmed against the live page while authoring — the alternate
 *     page renders `<main class="site-main">` with the `<h1>` above it.
 *     Link assertions are scoped to `<main>` so header/footer chrome cannot
 *     satisfy or break them.
 *  C. Arrangement is NOT assumed. Document order between the two columns is
 *     never asserted; the wireframe says arrangement is "Design's to improve
 *     upon". What IS asserted is what design-system.md §3 pins for the Lyric
 *     pair component: side-by-side on desktop, stacked on mobile, split by a
 *     `2px dashed var(--color-line-accent)` rule.
 *  D. Lyrics are rendered lowercased via CSS `text-transform` (a site-owner
 *     request recorded in song-page.spec.ts). `innerText` reflects that, so
 *     every lyric comparison here is case-insensitive.
 *
 * ---------------------------------------------------------------------------
 * GROUND TRUTH — verified against the live migrated dataset at authoring time
 * (2026-07-26) by querying Drupal's entity API directly through
 * `lando drush php:eval`. There is no fixture site; these are real nodes with
 * real Pathauto aliases, all published.
 *
 *   - 26 song nodes have a `field_parent_song`; 17 of those also have
 *     `field_lyrics_same_as_parent = 1`.
 *   - Every fixture below was checked for: published status, its real alias
 *     (read from `path_alias`, never guessed), its parent, its children (by
 *     querying which songs reference it via `field_parent_song`), its
 *     `field_lyrics_same_as_parent` value, and the actual text of its lyrics.
 *   - No fixture here has a `field_video` value, so — unlike song-page.spec.ts
 *     — the Axe scans below need no third-party-iframe exclusion.
 *   - Every lyric snippet used below was counted across all four songs in the
 *     two pairs to confirm it occurs in exactly the one song it is attributed
 *     to, and exactly once there. A snippet that appeared in both halves of a
 *     pair would make the "right lyrics in the right column" assertions
 *     meaningless, so this was checked rather than assumed.
 *   - No three-generation chains are used: `King Rat`, `Lives` and
 *     `Perpetual Motion Machine` were each confirmed to have NO parent of
 *     their own. Deeper nesting is out of scope for FR-13/FR-20.
 * ------------------------------------------------------------------------- */

type Song = {
  /** Real Pathauto alias, verified against `path_alias`. */
  path: string;
  /** `node_field_data.title`, verbatim. */
  title: string;
};

type Alternate = Song & {
  parent: Song;
  /** `field_lyrics_same_as_parent`. */
  sameAsParent: boolean;
  /**
   * A line that occurs in THIS song's lyrics and nowhere in the parent's.
   * `null` when the alternate has no lyrics of its own to show.
   */
  ownLyric: string | null;
  /** A line that occurs in the PARENT's lyrics and nowhere in this song's. */
  parentLyric: string;
};

/**
 * "Lucky Me Again (2006/11/05)" → "King Rat" — the differing-lyrics fixture,
 * and the strongest one available: `field_lyrics_same_as_parent = 0`, both
 * songs carry substantial lyrics (1567 vs 1955 characters after stripping
 * markup) and the two texts are genuinely different, not merely un-flagged.
 *
 * It is also the hi-fi's own worked example — "Alternate version, side-by-side
 * lyrics" draws King Rat with an alternate — so the composition this fixture
 * exercises is exactly the one the design pins.
 *
 * Snippet provenance (counted in the database across all four fixture songs):
 *   "sell all of my gold teeth again"  → 1× in the alternate, 0× in King Rat.
 *   "even crooks have to pay the rent" → 1× in King Rat, 0× in the alternate.
 * So each snippet proves the presence of ONE side's lyrics and can never be
 * satisfied by the other side's.
 *
 * NOTE: King Rat's own lyrics contain the words "lucky … me again", which is
 * why nothing in this file identifies a version by matching a song *title* in
 * page text — links are asserted by resolved href, not by name.
 */
const ALT_DIFFERENT: Alternate = {
  path: '/songs/lucky-me-again-20061105',
  title: 'Lucky Me Again (2006/11/05)',
  parent: { path: '/songs/king-rat', title: 'King Rat' },
  sameAsParent: false,
  ownLyric: 'sell all of my gold teeth again',
  parentLyric: 'even crooks have to pay the rent',
};

/**
 * "Your Life" → "Lives" — the FR-20 same-as-normal fixture.
 *
 * `field_lyrics_same_as_parent = 1` on the real node, and the two lyric bodies
 * are byte-for-byte identical after normalisation (1190 characters each). That
 * identity is what makes the "no duplicate lyrics" assertion sharp: the page
 * must show this text exactly ONCE (in the normal-version column) with the
 * placeholder standing in for the alternate's own copy. A page that repeated
 * the lyrics on both sides would show it twice, and a page that suppressed the
 * whole pair would show it zero times — both are caught.
 *
 * `parentLyric` is therefore also the alternate's own text; it is named for
 * the column it must appear in.
 */
const ALT_SAME: Alternate = {
  path: '/songs/your-life',
  title: 'Your Life',
  parent: { path: '/songs/lives', title: 'Lives' },
  sameAsParent: true,
  ownLyric: null,
  parentLyric: 'the dull sound of sharp math',
};

/**
 * Parents with two or more alternates (FR-13). Both child lists are exhaustive
 * — taken from an entity query for every song referencing the parent via
 * `field_parent_song`, so "lists them all" is a testable claim, not a sample.
 *
 * "Perpetual Motion Machine" is included alongside King Rat because it has
 * FOUR alternates: a page that renders only the first, or only a teaser
 * subset, fails there and would slip past a two-child fixture.
 */
const PARENTS: (Song & { children: Song[] })[] = [
  {
    path: '/songs/king-rat',
    title: 'King Rat',
    children: [
      { path: '/songs/lucky-me-again-20061105', title: 'Lucky Me Again (2006/11/05)' },
      { path: '/songs/lucky-me-again', title: 'Lucky Me Again' },
    ],
  },
  {
    path: '/songs/perpetual-motion-machine',
    title: 'Perpetual Motion Machine',
    children: [
      { path: '/songs/perpetual-motion-machine-20011125', title: 'Perpetual Motion Machine (2001/11/25)' },
      { path: '/songs/here-comes-trouble', title: 'Here Comes Trouble' },
      { path: '/songs/fish-jam', title: 'Fish Jam' },
      { path: '/songs/more-trouble', title: 'More Trouble' },
    ],
  },
];

/**
 * "Bukowski" — the regression fixture. Verified to have NO parent and NO
 * children (nothing references node 3553 via `field_parent_song`), published,
 * with 2112 characters of lyrics. It is the same node song-page.spec.ts uses
 * as its bare/missing-fields fixture, so anything this ticket breaks on it
 * would also be a regression against INT8-019.
 */
const PLAIN: Song & { lyric: string } = {
  path: '/songs/bukowski',
  title: 'Bukowski',
  // Counted in the database: this line occurs exactly once in Bukowski's
  // lyrics. (Its more obvious hook, "a little bit more like Bukowski", occurs
  // twice — the song repeats the couplet — which would make an
  // occurrences() === 1 premise wrong for reasons that have nothing to do with
  // this ticket.)
  lyric: 'woke up this morning and it seemed to me',
};

/** The Lyric pair's column labels — design-system.md §3 pins both verbatim. */
const THIS_VERSION = /^this\s*version\b/i;
const NORMAL_VERSION = /^normal\s*version\b/i;

/** FR-20 quotes this string, with its square brackets, verbatim. */
const SAME_AS_NORMAL = /same\s+as\s+normal\s+version/i;
const SAME_AS_NORMAL_BRACKETED = /\[\s*same\s+as\s+normal\s+version\s*\]/i;

/** FR-13 / the wireframe / design-system §3 all quote this cross-reference. */
const ALTERNATE_FOR = /alternate\s+title\s*\/\s*lyrics\s+for/i;

/* -------------------------------------------------------------------------
 * Helpers. Everything works off text, resolved hrefs, computed style and
 * geometry — never off a class name this file has not been shown (assumption
 * A). `labels`, `texts` and `visibleText` are adapted from song-page.spec.ts,
 * which established the house style for this screen.
 * ---------------------------------------------------------------------- */

type LabelInfo = {
  key: string;
  /** Document-order index of the element, or -1 when the label is absent. */
  index: number;
  /** The element's own text, verbatim. */
  text: string;
  tag: string;
  /** Whether it is actually rendered (a hidden label is not a label). */
  rendered: boolean;
};

/**
 * Find elements whose OWN text nodes match one of the given patterns. Own
 * text, not textContent, so that every ancestor up to <body> does not also
 * "match" the word NORMAL VERSION.
 */
async function labels(page: Page, patterns: Record<string, RegExp>): Promise<Record<string, LabelInfo>> {
  const wanted = Object.entries(patterns).map(([key, re]) => ({
    key,
    source: re.source,
    flags: re.flags,
  }));
  const list = (await page.evaluate((probes) => {
    const ownText = (el: Element): string =>
      Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim();

    const all = Array.from(document.querySelectorAll('*'));
    const out: LabelInfo[] = [];
    for (const { key, source, flags } of probes) {
      const re = new RegExp(source, flags);
      let hit: { el: Element; index: number } | null = null;
      for (let i = 0; i < all.length; i++) {
        const text = ownText(all[i]).replace(/:$/, '').trim();
        if (text && re.test(text)) {
          hit = { el: all[i], index: i };
          break;
        }
      }
      if (!hit) {
        out.push({ key, index: -1, text: '', tag: '', rendered: false });
        continue;
      }
      const cs = getComputedStyle(hit.el);
      const rect = hit.el.getBoundingClientRect();
      out.push({
        key,
        index: hit.index,
        text: ownText(hit.el),
        tag: hit.el.tagName.toLowerCase(),
        rendered: cs.display !== 'none' && cs.visibility !== 'hidden' && rect.height > 0,
      });
    }
    return out;
  }, wanted)) as LabelInfo[];

  const map: Record<string, LabelInfo> = {};
  for (const info of list) map[info.key] = info;
  return map;
}

/** The two Lyric-pair column labels, looked up together. */
async function columnLabels(page: Page) {
  return labels(page, { thisVersion: THIS_VERSION, normalVersion: NORMAL_VERSION });
}

/** Normalised, lowercased visible text of the page or of a scope within it. */
async function visibleText(page: Page, scope = 'body'): Promise<string> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return String.fromCharCode(0) + 'NOT-FOUND' + String.fromCharCode(0);
    return (el.innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  }, scope);
}

/** How many times a snippet occurs in a normalised text blob. */
function occurrences(haystack: string, needle: string): number {
  const n = needle.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!n) return 0;
  let count = 0;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(n, from);
    if (at === -1) return count;
    count += 1;
    from = at + n.length;
  }
}

type Box = { found: boolean; tag: string; x: number; y: number; width: number; height: number };

/**
 * The bounding box of the DEEPEST element containing a snippet. "Deepest"
 * because every ancestor contains it too and only the innermost one has the
 * geometry of the column it sits in.
 */
async function snippetBox(page: Page, snippet: string): Promise<Box> {
  return (await page.evaluate((raw) => {
    const norm = (s: string) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    const needle = norm(raw);
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      if (!norm(el.textContent ?? '').includes(needle)) continue;
      const deeper = Array.from(el.children).some((c) => norm(c.textContent ?? '').includes(needle));
      if (deeper) continue;
      const r = el.getBoundingClientRect();
      return {
        found: true,
        tag: el.tagName.toLowerCase(),
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        width: r.width,
        height: r.height,
      };
    }
    return { found: false, tag: '', x: 0, y: 0, width: 0, height: 0 };
  }, snippet)) as Box;
}

type Pairing = {
  labelFound: boolean;
  /**
   * True when some ancestor-or-self of the label (within 6 levels) contains
   * the wanted snippet and does NOT contain the unwanted one — i.e. the label
   * and its own lyrics share a scope that excludes the other column's lyrics.
   */
  isolated: boolean;
  /** The tightest scope that contained the wanted snippet, for diagnostics. */
  scopeTag: string;
  /** Whether the wanted snippet was found anywhere under the label's ancestry. */
  wantedSeen: boolean;
};

/**
 * Does `labelPattern`'s column actually hold `wanted` and not `unwanted`?
 *
 * Walks up from the label element and asks, at each level, whether that
 * subtree contains the wanted text but not the other column's. This is how the
 * "right lyrics in the right column" claim is testable at all without being
 * shown the markup — and it makes no assumption about which column comes first
 * in the document or on screen (assumption C).
 */
async function columnHolds(
  page: Page,
  labelPattern: RegExp,
  wanted: string,
  unwanted: string,
): Promise<Pairing> {
  return (await page.evaluate(
    ({ source, flags, wantedRaw, unwantedRaw }) => {
      const norm = (s: string) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
      const ownText = (el: Element): string =>
        norm(
          Array.from(el.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent ?? '')
            .join(''),
        );

      const re = new RegExp(source, flags);
      const all = Array.from(document.querySelectorAll('*'));
      const label = all.find((el) => {
        const t = ownText(el).replace(/:$/, '').trim();
        return t.length > 0 && re.test(t);
      });
      if (!label) {
        return { labelFound: false, isolated: false, scopeTag: '', wantedSeen: false };
      }

      const want = norm(wantedRaw);
      const avoid = norm(unwantedRaw);
      let node: Element | null = label;
      let wantedSeen = false;
      let scopeTag = '';
      for (let depth = 0; node && depth < 6; depth++) {
        const text = norm(node.textContent ?? '');
        const hasWanted = want.length > 0 && text.includes(want);
        const hasAvoid = avoid.length > 0 && text.includes(avoid);
        if (hasWanted) {
          wantedSeen = true;
          scopeTag = node.tagName.toLowerCase();
          if (!hasAvoid) {
            return { labelFound: true, isolated: true, scopeTag, wantedSeen: true };
          }
          // This scope already swallows both columns — stop, do not widen.
          return { labelFound: true, isolated: false, scopeTag, wantedSeen: true };
        }
        node = node.parentElement;
      }
      return { labelFound: true, isolated: false, scopeTag, wantedSeen };
    },
    { source: labelPattern.source, flags: labelPattern.flags, wantedRaw: wanted, unwantedRaw: unwanted },
  )) as Pairing;
}

type SongLink = { path: string; text: string; visible: boolean };

/** Every anchor inside <main> that points at a song DETAIL page. */
async function songDetailLinks(page: Page): Promise<SongLink[]> {
  return (await page.evaluate(() => {
    const main = document.querySelector('main') ?? document.body;
    const out: SongLink[] = [];
    for (const a of Array.from(main.querySelectorAll('a[href]'))) {
      const href = (a as HTMLAnchorElement).href;
      let path = '';
      try {
        path = new URL(href, document.baseURI).pathname.replace(/\/+$/, '');
      } catch {
        continue;
      }
      if (!/^\/songs\/.+/.test(path)) continue;
      const rect = a.getBoundingClientRect();
      const cs = getComputedStyle(a);
      out.push({
        path,
        text: (a.textContent ?? '').replace(/\s+/g, ' ').trim(),
        visible: cs.display !== 'none' && cs.visibility !== 'hidden' && rect.height > 0,
      });
    }
    return out;
  })) as SongLink[];
}

/**
 * Is the element carrying `phrase` a link to `targetPath`, inside one, or does
 * it contain one? Used for both FR-20's "[same as normal version]" (which must
 * *link* the parent) and FR-13's "alternate title/lyrics for → parent".
 */
async function phraseLinksTo(
  page: Page,
  phrase: RegExp,
  targetPath: string,
): Promise<{ phraseFound: boolean; phraseText: string; linked: boolean; nearbyHrefs: string[] }> {
  return (await page.evaluate(
    ({ source, flags, target }) => {
      const norm = (s: string) => (s ?? '').replace(/\s+/g, ' ').trim();
      const re = new RegExp(source, flags);
      const main = document.querySelector('main') ?? document.body;
      const all = Array.from(main.querySelectorAll('*'));

      const carrier = all.find((el) => {
        if (!re.test(norm(el.textContent ?? ''))) return false;
        return !Array.from(el.children).some((c) => re.test(norm(c.textContent ?? '')));
      });
      if (!carrier) return { phraseFound: false, phraseText: '', linked: false, nearbyHrefs: [] };

      const pathOf = (a: Element) => {
        try {
          return new URL((a as HTMLAnchorElement).href, document.baseURI).pathname.replace(/\/+$/, '');
        } catch {
          return '';
        }
      };

      const nearby = new Set<string>();
      let linked = false;

      // The carrier itself, or an anchor inside it.
      const inside = Array.from(carrier.querySelectorAll('a[href]'));
      if (carrier.tagName === 'A') inside.push(carrier);
      for (const a of inside) {
        nearby.add(pathOf(a));
        if (pathOf(a) === target) linked = true;
      }

      // Or an anchor ancestor, or an anchor in the immediate surrounding block.
      let node: Element | null = carrier;
      for (let depth = 0; node && depth < 4 && !linked; depth++) {
        if (node.tagName === 'A') {
          nearby.add(pathOf(node));
          if (pathOf(node) === target) linked = true;
        }
        for (const a of Array.from(node.querySelectorAll('a[href]'))) {
          nearby.add(pathOf(a));
          if (pathOf(a) === target) linked = true;
        }
        node = node.parentElement;
      }

      return {
        phraseFound: true,
        phraseText: norm(carrier.textContent ?? ''),
        linked,
        nearbyHrefs: Array.from(nearby).filter(Boolean),
      };
    },
    { source: phrase.source, flags: phrase.flags, target: targetPath },
  )) as { phraseFound: boolean; phraseText: string; linked: boolean; nearbyHrefs: string[] };
}

/** Resolve a design token to the rgb(...) form getComputedStyle reports. */
async function resolveToken(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('div');
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, token);
}

type Rule = { tag: string; side: string; width: number; style: string; color: string };

/**
 * Every dashed border found inside the smallest element that contains BOTH
 * column labels — i.e. inside the lyric-pair block and nowhere else on the
 * page. Used for the divider assertion.
 */
async function dashedRulesInPair(page: Page): Promise<{ blockFound: boolean; rules: Rule[] }> {
  return (await page.evaluate(
    ({ thisSrc, thisFlags, normSrc, normFlags }) => {
      const norm = (s: string) => (s ?? '').replace(/\s+/g, ' ').trim();
      const ownText = (el: Element): string =>
        norm(
          Array.from(el.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent ?? '')
            .join(''),
        );
      const findLabel = (src: string, flags: string) => {
        const re = new RegExp(src, flags);
        return (
          Array.from(document.querySelectorAll('*')).find((el) => {
            const t = ownText(el).replace(/:$/, '').trim();
            return t.length > 0 && re.test(t);
          }) ?? null
        );
      };

      const a = findLabel(thisSrc, thisFlags);
      const b = findLabel(normSrc, normFlags);
      if (!a || !b) return { blockFound: false, rules: [] };

      const ancestors = new Set<Element>();
      for (let n: Element | null = a; n; n = n.parentElement) ancestors.add(n);
      let block: Element | null = b;
      while (block && !ancestors.has(block)) block = block.parentElement;
      if (!block) return { blockFound: false, rules: [] };

      const rules: Rule[] = [];
      for (const el of [block, ...Array.from(block.querySelectorAll('*'))]) {
        const cs = getComputedStyle(el);
        for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
          const style = cs[`border${side}Style` as 'borderTopStyle'];
          if (style !== 'dashed') continue;
          rules.push({
            tag: el.tagName.toLowerCase(),
            side: side.toLowerCase(),
            width: parseFloat(cs[`border${side}Width` as 'borderTopWidth'] || '0'),
            style,
            color: cs[`border${side}Color` as 'borderTopColor'],
          });
        }
      }
      return { blockFound: true, rules };
    },
    {
      thisSrc: THIS_VERSION.source,
      thisFlags: THIS_VERSION.flags,
      normSrc: NORMAL_VERSION.source,
      normFlags: NORMAL_VERSION.flags,
    },
  )) as { blockFound: boolean; rules: Rule[] };
}

/** Horizontal / vertical overlap between two boxes, in px. */
function overlapX(a: Box, b: Box): number {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
}
function overlapY(a: Box, b: Box): number {
  return Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
}

/* -------------------------------------------------------------------------
 * Scenario 1 — the alternate version's page (FR-20, FR-13).
 * ---------------------------------------------------------------------- */

test.describe('Song versions — Scenario 1: an alternate version\'s page (FR-20, FR-13)', () => {
  test('both this version\'s lyrics and the parent\'s normal lyrics render', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const response = await page.goto(ALT_DIFFERENT.path);
    expect(response?.status(), `${ALT_DIFFERENT.path} did not return 200`).toBe(200);

    const text = await visibleText(page, 'main');
    expect(text, '<main> was not found — see assumption B').not.toContain('not-found');

    // The alternate's own lyrics — already rendered by INT8-019, asserted here
    // as the premise for the half that is new.
    expect(
      occurrences(text, ALT_DIFFERENT.ownLyric!),
      `${ALT_DIFFERENT.path} does not show its own lyrics ("${ALT_DIFFERENT.ownLyric}")`,
    ).toBe(1);

    // FR-20's core claim: the PARENT's normal lyrics are shown alongside them,
    // on the alternate's own page. This snippet occurs nowhere in the
    // alternate's lyrics (counted in the database), so it can only be
    // satisfied by genuinely rendering King Rat's lyrics here.
    expect(
      occurrences(text, ALT_DIFFERENT.parentLyric),
      `${ALT_DIFFERENT.path} does not show its parent's normal lyrics — FR-20 requires an alternate ` +
        `version's page to display its lyrics ALONGSIDE the parent's. Looked for the King Rat line ` +
        `"${ALT_DIFFERENT.parentLyric}", which appears nowhere in this song's own lyrics.`,
    ).toBe(1);
  });

  test('each lyric set sits under its own THIS VERSION / NORMAL VERSION label, with the right lyrics in each', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ALT_DIFFERENT.path);

    // design-system.md §3, "Lyric pair": the two columns are labelled
    // "THIS VERSION" and "NORMAL VERSION →". Both are pinned strings.
    const label = await columnLabels(page);
    expect(
      label.thisVersion.index,
      'no "THIS VERSION" column label — design-system.md §3 pins it for the Lyric pair component',
    ).toBeGreaterThan(-1);
    expect(
      label.normalVersion.index,
      'no "NORMAL VERSION" column label — design-system.md §3 pins it for the Lyric pair component',
    ).toBeGreaterThan(-1);
    expect(label.thisVersion.rendered, 'the "THIS VERSION" label is not rendered').toBe(true);
    expect(label.normalVersion.rendered, 'the "NORMAL VERSION" label is not rendered').toBe(true);

    // …and the columns are not merely labelled, they hold the correct halves.
    // Nothing here assumes which column comes first (assumption C): each label
    // is asked whether some scope around it holds its own lyrics and excludes
    // the other's.
    const thisCol = await columnHolds(
      page,
      THIS_VERSION,
      ALT_DIFFERENT.ownLyric!,
      ALT_DIFFERENT.parentLyric,
    );
    expect(
      thisCol.wantedSeen,
      `the "THIS VERSION" column does not contain this song's own lyrics ("${ALT_DIFFERENT.ownLyric}")`,
    ).toBe(true);
    expect(
      thisCol.isolated,
      `the "THIS VERSION" column also contains the PARENT's lyrics — the two lyric sets are not in ` +
        `separate columns (tightest scope containing this version's lyrics: <${thisCol.scopeTag}>)`,
    ).toBe(true);

    const normalCol = await columnHolds(
      page,
      NORMAL_VERSION,
      ALT_DIFFERENT.parentLyric,
      ALT_DIFFERENT.ownLyric!,
    );
    expect(
      normalCol.wantedSeen,
      `the "NORMAL VERSION" column does not contain the parent's lyrics ("${ALT_DIFFERENT.parentLyric}")`,
    ).toBe(true);
    expect(
      normalCol.isolated,
      `the "NORMAL VERSION" column also contains this version's own lyrics — the columns are not ` +
        `separate (tightest scope: <${normalCol.scopeTag}>)`,
    ).toBe(true);
  });

  test('the "alternate title/lyrics for → parent" cross-link points at the parent and navigates there', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ALT_DIFFERENT.path);

    // FR-13, second clause, and the hi-fi's own caption under the alternate's
    // title: 'alternate title/lyrics for → King Rat'.
    const cross = await phraseLinksTo(page, ALTERNATE_FOR, ALT_DIFFERENT.parent.path);
    expect(
      cross.phraseFound,
      `${ALT_DIFFERENT.path} does not show an "alternate title/lyrics for → parent" cross-reference ` +
        '(FR-13, and the wireframe\'s Variant A)',
    ).toBe(true);
    expect(
      cross.linked,
      `the "alternate title/lyrics for" cross-reference on ${ALT_DIFFERENT.path} is plain text, not a ` +
        `link to the parent (${ALT_DIFFERENT.parent.path}). Text found: "${cross.phraseText}". ` +
        `Hrefs near it: ${JSON.stringify(cross.nearbyHrefs)}. FR-13 requires the alternate's page to ` +
        'LINK to its parent, not merely name it.',
    ).toBe(true);

    // A real href is not yet a working link — follow it.
    const link = page
      .locator('main a')
      .filter({ hasText: /king rat/i })
      .first();
    const anyParentLink = page.locator(`main a[href$="${ALT_DIFFERENT.parent.path}"]`).first();
    const target = (await anyParentLink.count()) > 0 ? anyParentLink : link;
    await target.click();
    await page.waitForLoadState('domcontentloaded');

    expect(
      new URL(page.url()).pathname.replace(/\/+$/, ''),
      'following the parent cross-link did not land on the parent song page',
    ).toBe(ALT_DIFFERENT.parent.path);
    await expect(
      page.locator('h1'),
      'the page reached by the parent cross-link is not the parent song',
    ).toHaveText(new RegExp(`^\\s*${ALT_DIFFERENT.parent.title}\\s*$`, 'i'));
  });

  test('the lyric pair splits on the design system\'s dashed accent rule', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ALT_DIFFERENT.path);

    const accent = await resolveToken(page, '--color-line-accent');
    expect(
      accent,
      '--color-line-accent did not resolve on the page — tokens.css line 66 defines it (Spindle, ' +
        '#b9d3e3), and the 2026-07-26 decisions-log entry makes it the divider colour for both the ' +
        'song page\'s main/rail split and the lyric-pair split',
    ).toMatch(/^rgba?\(/);

    const { blockFound, rules } = await dashedRulesInPair(page);
    expect(
      blockFound,
      'could not find a block containing both the "THIS VERSION" and "NORMAL VERSION" labels — there ' +
        'is no lyric-pair component to inspect',
    ).toBe(true);

    // design-system.md §3: "The two columns split on a `2px dashed
    // var(--color-line-accent)` rule — the same divider treatment as the song
    // page's main/rail split, not a component-specific colour." Which element
    // and which side carries it is the implementer's choice (side-by-side puts
    // it left/right, stacked puts it top/bottom), so any side counts.
    const accentRules = rules.filter((r) => r.color === accent && r.width >= 1.5);
    expect(
      accentRules.length,
      `the lyric pair has no 2px dashed --color-line-accent (${accent}) divider between its columns. ` +
        `Dashed borders found inside the pair: ${JSON.stringify(rules)}`,
    ).toBeGreaterThan(0);
    expect(
      accentRules.some((r) => Math.abs(r.width - 2) < 0.75),
      `the lyric-pair divider is ${accentRules.map((r) => r.width).join('/')}px wide; design-system.md ` +
        '§3 specifies 2px',
    ).toBe(true);
  });

  test('the two lyric sets sit side by side at desktop width (design-system §3)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ALT_DIFFERENT.path);

    const mine = await snippetBox(page, ALT_DIFFERENT.ownLyric!);
    const theirs = await snippetBox(page, ALT_DIFFERENT.parentLyric);
    expect(mine.found, 'this version\'s lyrics are not on the page').toBe(true);
    expect(theirs.found, 'the parent\'s normal lyrics are not on the page').toBe(true);

    // design-system.md §3 gives the Lyric pair two variants: "side-by-side
    // (desktop) · stacked (mobile)". Geometry is asserted, not a layout
    // mechanism — grid, flex or float all satisfy this equally.
    expect(
      overlapX(mine, theirs),
      `at 1280px the two lyric sets overlap horizontally by ${Math.round(overlapX(mine, theirs))}px — ` +
        'they are stacked, not side by side. design-system.md §3 specifies side-by-side on desktop. ' +
        `Boxes: own=${JSON.stringify(mine)} parent=${JSON.stringify(theirs)}`,
    ).toBeLessThanOrEqual(4);
    expect(
      overlapY(mine, theirs),
      'at 1280px the two lyric sets do not sit on the same rows — they are not a side-by-side pair',
    ).toBeGreaterThan(0);
  });
});

/* -------------------------------------------------------------------------
 * FR-20 — the same-as-normal-version path.
 * ---------------------------------------------------------------------- */

test.describe('Song versions — FR-20: "[same as normal version]"', () => {
  test('the alternate column reads "[same as normal version]" and links to the parent', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const response = await page.goto(ALT_SAME.path);
    expect(response?.status(), `${ALT_SAME.path} did not return 200`).toBe(200);

    const text = await visibleText(page, 'main');
    expect(
      text,
      `${ALT_SAME.path} has field_lyrics_same_as_parent = 1 but shows no "[same as normal version]" ` +
        'placeholder — FR-20 requires the alternate column to read exactly that',
    ).toMatch(SAME_AS_NORMAL);
    expect(
      text,
      'the same-as-normal placeholder is rendered without its square brackets — FR-20 and ' +
        'design-system.md §3 both quote it as "[same as normal version]"',
    ).toMatch(SAME_AS_NORMAL_BRACKETED);

    // "(linking to the parent)" is part of FR-20's sentence, not decoration:
    // the placeholder is the reader's only route to the lyrics it stands in for.
    const placeholder = await phraseLinksTo(page, SAME_AS_NORMAL, ALT_SAME.parent.path);
    expect(placeholder.phraseFound, 'the placeholder text was not found in <main>').toBe(true);
    expect(
      placeholder.linked,
      `"${placeholder.phraseText}" is not a link to the parent (${ALT_SAME.parent.path}) — FR-20 says ` +
        `the alternate column MUST read "[same as normal version]" LINKING TO THE PARENT. Hrefs near ` +
        `the placeholder: ${JSON.stringify(placeholder.nearbyHrefs)}`,
    ).toBe(true);

    // …and it stands in the THIS VERSION column, in place of the lyrics —
    // not tacked on somewhere else while the lyrics are still repeated.
    const label = await columnLabels(page);
    expect(label.thisVersion.index, 'no "THIS VERSION" column label on the same-as-normal page').toBeGreaterThan(-1);
    expect(label.normalVersion.index, 'no "NORMAL VERSION" column label on the same-as-normal page').toBeGreaterThan(-1);

    const thisCol = await columnHolds(page, THIS_VERSION, '[same as normal version]', ALT_SAME.parentLyric);
    expect(
      thisCol.wantedSeen,
      'the "[same as normal version]" placeholder is not inside the THIS VERSION column',
    ).toBe(true);
    expect(
      thisCol.isolated,
      'the THIS VERSION column shows the placeholder AND the lyrics — FR-20 requires the placeholder ' +
        'INSTEAD OF repeating them',
    ).toBe(true);
  });

  test('the parent\'s normal lyrics are still readable, and appear exactly once', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ALT_SAME.path);

    const text = await visibleText(page, 'main');

    // Three failure modes, one assertion each way round:
    //   0 occurrences → the implementer hid both columns, or replaced the whole
    //     lyric area with the placeholder. The reader can no longer read the
    //     lyrics at all, which FR-20 never asks for.
    //   2 occurrences → the lyrics were repeated, which is exactly what FR-20's
    //     "instead of repeating the lyrics" forbids. (This fixture's own lyrics
    //     are byte-identical to its parent's, so a page that printed both
    //     columns verbatim lands here.)
    const count = occurrences(text, ALT_SAME.parentLyric);
    expect(
      count,
      `the normal-version lyric line "${ALT_SAME.parentLyric}" appears ${count} time(s) on ` +
        `${ALT_SAME.path}. It must appear exactly once: FR-20 requires the parent's normal lyrics to ` +
        'be shown (the placeholder replaces the ALTERNATE column, not both) and forbids repeating them.',
    ).toBe(1);

    // The single copy is the one in the NORMAL VERSION column.
    const normalCol = await columnHolds(page, NORMAL_VERSION, ALT_SAME.parentLyric, '[same as normal version]');
    expect(
      normalCol.wantedSeen,
      'the surviving copy of the lyrics is not inside the "NORMAL VERSION" column',
    ).toBe(true);
  });

  test('an alternate whose lyrics genuinely differ shows no same-as-normal placeholder', async ({
    page,
  }) => {
    // GREEN BY DESIGN TODAY (no placeholder exists anywhere yet) — the
    // negative half of FR-20, which only becomes falsifiable once the feature
    // ships: the placeholder is driven by field_lyrics_same_as_parent, not
    // printed on every alternate. This fixture has the flag at 0 and lyrics
    // that really do differ, so an implementer who renders the placeholder for
    // every song with a parent fails here.
    await page.goto(ALT_DIFFERENT.path);
    const text = await visibleText(page, 'main');
    expect(
      text,
      `${ALT_DIFFERENT.path} has field_lyrics_same_as_parent = 0 and its own distinct lyrics, but the ` +
        'page shows the "[same as normal version]" placeholder',
    ).not.toMatch(SAME_AS_NORMAL);
    expect(occurrences(text, ALT_DIFFERENT.ownLyric!), 'its own lyrics went missing').toBe(1);
  });
});

/* -------------------------------------------------------------------------
 * Scenario 2 — a parent lists its alternates (FR-13).
 * ---------------------------------------------------------------------- */

test.describe('Song versions — Scenario 2: a parent lists its alternates (FR-13)', () => {
  test('every alternate version is listed as a link on the parent\'s page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    for (const parent of PARENTS) {
      const response = await page.goto(parent.path);
      expect(response?.status(), `${parent.path} did not return 200`).toBe(200);

      const links = await songDetailLinks(page);
      const linked = new Set(links.map((l) => l.path));

      for (const child of parent.children) {
        expect(
          linked.has(child.path),
          `${parent.path} does not link to its alternate version "${child.title}" (${child.path}) — ` +
            `FR-13 requires a parent song's page to list ALL its alternate versions as links. ` +
            `Song links found in <main>: ${JSON.stringify([...linked])}`,
        ).toBe(true);

        const anchor = links.find((l) => l.path === child.path)!;
        expect(anchor.visible, `the link to ${child.path} is not rendered`).toBe(true);
        expect(
          anchor.text.length,
          `the link to ${child.path} has no link text — a nameless link is not a listing (and fails NFR-1)`,
        ).toBeGreaterThan(0);
      }

      // …and it lists ITS alternates, not an arbitrary set of songs. Anything
      // linked that is neither a child nor the parent itself would mean the
      // relationship is being resolved wrongly. Verified exhaustively: the
      // child lists above come from an entity query for every song referencing
      // this parent.
      const expected = new Set<string>([parent.path, ...parent.children.map((c) => c.path)]);
      const unexpected = [...linked].filter((p) => !expected.has(p));
      expect(
        unexpected,
        `${parent.path} links to song(s) that are not its alternate versions: ${JSON.stringify(unexpected)}`,
      ).toEqual([]);
    }
  });

  test('each listed alternate is a working link, not just a name', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const parent = PARENTS[0];
    for (const child of parent.children) {
      await page.goto(parent.path);
      const anchor = page.locator(`main a[href$="${child.path}"]`).first();
      await expect(
        anchor,
        `no anchor on ${parent.path} resolves to ${child.path} (FR-13)`,
      ).toHaveCount(1);
      await anchor.click();
      await page.waitForLoadState('domcontentloaded');

      expect(
        new URL(page.url()).pathname.replace(/\/+$/, ''),
        `following the "${child.title}" link from ${parent.path} did not land on its page`,
      ).toBe(child.path);
      await expect(page.locator('h1')).toHaveText(
        new RegExp(`^\\s*${child.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'),
      );
    }
  });

  test('a parent page does not itself render the alternate lyric pair', async ({ page }) => {
    // GREEN BY DESIGN TODAY (there is no lyric pair anywhere yet). It is the
    // guard against the obvious over-reach: rendering the pair for any song
    // touched by the version logic. FR-20 scopes the side-by-side view to a
    // song that HAS a parent; King Rat has none (verified: field_parent_song
    // is empty on node 3687).
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ALT_DIFFERENT.parent.path);

    const label = await columnLabels(page);
    expect(
      label.thisVersion.index,
      `${ALT_DIFFERENT.parent.path} is not an alternate version, but renders a "THIS VERSION" column`,
    ).toBe(-1);
    expect(
      label.normalVersion.index,
      `${ALT_DIFFERENT.parent.path} is not an alternate version, but renders a "NORMAL VERSION" column`,
    ).toBe(-1);

    const text = await visibleText(page, 'main');
    expect(text, 'a parent page shows the same-as-normal placeholder').not.toMatch(SAME_AS_NORMAL);
    expect(text, 'a parent page shows an "alternate title/lyrics for" cross-reference of its own').not.toMatch(
      ALTERNATE_FOR,
    );
    // And it does not print its alternates' lyrics — listing them as links is
    // all FR-13 asks for.
    expect(
      occurrences(text, ALT_DIFFERENT.ownLyric!),
      `${ALT_DIFFERENT.parent.path} reproduces its alternate's lyrics; FR-13 asks only for links`,
    ).toBe(0);
  });
});

/* -------------------------------------------------------------------------
 * Scenario 3 — mobile (NFR-2).
 * ---------------------------------------------------------------------- */

test.describe('Song versions — Scenario 3: mobile (NFR-2)', () => {
  test('at 320px the two lyric sets stack, both readable, with no horizontal overflow', async ({
    page,
  }) => {
    // 320px is NFR-2's contractual minimum width.
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(ALT_DIFFERENT.path);

    const text = await visibleText(page, 'main');
    expect(
      occurrences(text, ALT_DIFFERENT.ownLyric!),
      'this version\'s lyrics are gone at 320px',
    ).toBe(1);
    expect(
      occurrences(text, ALT_DIFFERENT.parentLyric),
      'the parent\'s normal lyrics are gone at 320px — the pair must stack, not drop a column',
    ).toBe(1);

    // Both columns still labelled, so the pairing is still legible.
    const label = await columnLabels(page);
    expect(label.thisVersion.index, 'no "THIS VERSION" label at 320px').toBeGreaterThan(-1);
    expect(label.normalVersion.index, 'no "NORMAL VERSION" label at 320px').toBeGreaterThan(-1);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(
      overflow,
      `${ALT_DIFFERENT.path} scrolls horizontally by ${overflow}px at 320px — two lyric columns must ` +
        'stack rather than push the document sideways (NFR-2)',
    ).toBeLessThanOrEqual(1);

    const mine = await snippetBox(page, ALT_DIFFERENT.ownLyric!);
    const theirs = await snippetBox(page, ALT_DIFFERENT.parentLyric);
    expect(mine.found && theirs.found, 'a lyric block could not be located at 320px').toBe(true);

    // "Stacked" as an observable outcome, not a CSS mechanism: the two blocks
    // occupy the SAME horizontal band (so each gets the full width) and
    // different vertical bands.
    const narrower = Math.min(mine.width, theirs.width);
    expect(
      overlapX(mine, theirs),
      `at 320px the lyric blocks are still side by side (own=${Math.round(mine.width)}px wide at ` +
        `x=${Math.round(mine.x)}, parent=${Math.round(theirs.width)}px at x=${Math.round(theirs.x)}). ` +
        'Scenario 3 requires them to stack.',
    ).toBeGreaterThan(narrower * 0.6);
    expect(
      overlapY(mine, theirs),
      'at 320px the two lyric blocks overlap vertically — they are not stacked one above the other',
    ).toBeLessThanOrEqual(4);

    // Readable, not squeezed: a stacked column gets essentially the full
    // content width, a surviving two-column split would get roughly half.
    for (const [name, box] of [['this version', mine], ['normal version', theirs]] as const) {
      expect(
        box.width,
        `at 320px the "${name}" lyric block is only ${Math.round(box.width)}px wide — the columns did ` +
          'not stack, so neither is readable',
      ).toBeGreaterThan(180);
    }
  });

  test('at 320px the same-as-normal alternate still shows the placeholder and the parent\'s lyrics', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(ALT_SAME.path);

    const text = await visibleText(page, 'main');
    expect(text, 'the "[same as normal version]" placeholder is gone at 320px').toMatch(SAME_AS_NORMAL);
    expect(
      occurrences(text, ALT_SAME.parentLyric),
      'the normal-version lyrics are not readable exactly once at 320px',
    ).toBe(1);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow, `${ALT_SAME.path} scrolls horizontally at 320px`).toBeLessThanOrEqual(1);
  });
});

/* -------------------------------------------------------------------------
 * Regression — a plain song must be untouched by any of this.
 * ---------------------------------------------------------------------- */

test.describe('Song versions — regression: a plain song is unaffected', () => {
  test('a song with no parent and no alternates renders no version chrome at all', async ({ page }) => {
    // GREEN BY DESIGN TODAY, and said so plainly: none of this chrome exists
    // yet, so this test cannot be red before the feature is built. It is here
    // because INT8-020 adds a whole new conditional block to a page that 490 of
    // the site's 492 songs render WITHOUT it — a section wrapper, a stray
    // heading or an unconditional "normal version" column on a parentless song
    // is the most likely way this ticket breaks something INT8-019 got right.
    // "Bukowski" was verified to have no parent and no children.
    await page.setViewportSize({ width: 1280, height: 900 });
    const response = await page.goto(PLAIN.path);
    expect(response?.status(), `${PLAIN.path} did not return 200`).toBe(200);

    const text = await visibleText(page, 'main');
    // Premise: we are on the right page and it still renders its content.
    expect(occurrences(text, PLAIN.lyric), `${PLAIN.path} does not render its lyrics`).toBe(1);

    const label = await columnLabels(page);
    expect(
      label.thisVersion.index,
      `${PLAIN.path} has no parent and no alternates, but renders a "THIS VERSION" column label`,
    ).toBe(-1);
    expect(
      label.normalVersion.index,
      `${PLAIN.path} has no parent and no alternates, but renders a "NORMAL VERSION" column label`,
    ).toBe(-1);

    expect(text, `${PLAIN.path} shows the same-as-normal placeholder`).not.toMatch(SAME_AS_NORMAL);
    expect(text, `${PLAIN.path} shows an "alternate title/lyrics for" cross-reference`).not.toMatch(
      ALTERNATE_FOR,
    );
    expect(text, `${PLAIN.path} mentions alternate versions`).not.toMatch(/alternate\s+version/i);

    // No cross-links into other songs: it has no parent to point at and no
    // alternates to list. ("Back to Songs" points at /songs, which is not a
    // detail path and is deliberately not matched here.)
    const links = await songDetailLinks(page);
    const others = links.map((l) => l.path).filter((p) => p !== PLAIN.path);
    expect(
      others,
      `${PLAIN.path} links to other song pages: ${JSON.stringify(others)} — a standard song has no ` +
        'version relationships to link',
    ).toEqual([]);

    // And no empty version container left behind (the FR-15 habit, applied to
    // the new block): nothing between the hero and the lyrics but the lyrics.
    const strayBlocks = await page.evaluate(() => {
      const main = document.querySelector('main') ?? document.body;
      const out: { tag: string; height: number }[] = [];
      for (const el of Array.from(main.querySelectorAll('*'))) {
        if ((el.textContent ?? '').replace(/\s+/g, ' ').trim()) continue;
        if (el.querySelector('img, iframe, video, svg, picture, source')) continue;
        // Only block-level CONTAINERS count. Lyrics are full of <br>, which is
        // textless and occupies a line box by design; a stray inline element is
        // not the defect this looks for — an empty wrapper is.
        const cs = getComputedStyle(el);
        if (cs.display === 'inline' || cs.display === 'none' || cs.display === 'contents') continue;
        if (['br', 'hr', 'img', 'input', 'wbr', 'source'].includes(el.tagName.toLowerCase())) continue;
        const r = el.getBoundingClientRect();
        if (r.height > 8) out.push({ tag: el.tagName.toLowerCase(), height: Math.round(r.height) });
      }
      return out;
    });
    expect(
      strayBlocks,
      `${PLAIN.path} renders empty, height-occupying blocks — an unconditional version wrapper left ` +
        'behind on a song that has no versions',
    ).toEqual([]);
  });
});

/* -------------------------------------------------------------------------
 * NFR-1 — accessibility of the new structure.
 * ---------------------------------------------------------------------- */

test.describe('Song versions — accessibility (NFR-1)', () => {
  // ALL THREE ARE GREEN BY DESIGN TODAY: the pages currently render as plain
  // INT8-019 song pages, which already pass Axe. They are here because this
  // ticket adds the first genuinely new content structure on this screen since
  // INT8-019 — a titled block with two labelled sub-columns and a
  // cross-reference link — and NFR-1 is not something to discover after the
  // fact. They go red the moment that structure is built badly.
  //
  // None of these fixtures has a `field_video` value (verified), so — unlike
  // song-page.spec.ts — no third-party iframe subtree needs excluding here.
  test('axe: no serious/critical violations on an alternate version page (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ALT_DIFFERENT.path);
    await expect(page.locator('h1')).toHaveCount(1);

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('axe: no serious/critical violations on an alternate version page at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(ALT_DIFFERENT.path);

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('axe: the version structure introduces no heading-order or landmark violations', async ({
    page,
  }) => {
    // Stricter than the impact filter above, on purpose. This ticket adds the
    // page's first genuinely new content structure since INT8-019 — a titled
    // block with two labelled sub-columns, plus a cross-reference link — and
    // the hi-fi draws its title as an <h3> under a page <h1>. axe grades
    // `heading-order` as "moderate", so the serious/critical filter would let a
    // skipped heading level through unseen. NFR-1 is WCAG 2.1 AA, which does
    // not have a "moderate is fine" clause, so these two rule families are
    // asserted at ANY impact.
    //
    // Axe's `region` rule is deliberately NOT in this filter. It already fires
    // site-wide on INT8-028's page-title hero ("<div class='hero
    // hero--page-title'>" is outside any landmark) on every page in the site,
    // including the plain song pages INT8-019 shipped green. That is a
    // pre-existing, whole-site finding with its own cause and nothing to do
    // with song versions; folding it in here would make this test fail for a
    // reason the implementer of THIS ticket cannot legitimately fix, and would
    // hide the two rules that genuinely are at risk.
    for (const path of [ALT_DIFFERENT.path, ALT_SAME.path, ALT_DIFFERENT.parent.path]) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      const structural = results.violations.filter(
        (v) => v.id === 'heading-order' || v.id.startsWith('landmark-'),
      );
      expect(structural, `${path}: ${JSON.stringify(structural, null, 2)}`).toEqual([]);
    }
  });
});
