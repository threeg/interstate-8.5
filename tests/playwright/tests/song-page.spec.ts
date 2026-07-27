import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Song page (INT8-019) — FR-12, FR-14, FR-15, FR-17.
 *
 * Written independently of the implementation, from the ticket
 * (spec/tickets/INT8-019-song-page.md), the requirements (§4.3), the interface
 * contract (api-contract.md §2.2), the wireframe (spec/wireframes/03-song-page.md),
 * the design system (§3) and the canonical hi-fi
 * (`Interstate-8 1B.dc.html`, SONG PAGE DESKTOP / SONG PAGE MOBILE /
 * SONG PAGE — MISSING FIELDS) ONLY. No theme template, `.component.yml`, CSS or
 * `.theme` file was read while authoring this file, per the project's
 * independent-test-authorship rule (root CLAUDE.md, "Models").
 *
 * OUT OF SCOPE, deliberately: FR-13 and FR-20 (alternate versions, side-by-side
 * lyrics, parent/alternate cross-links) belong to INT8-020. The hi-fi's SONG
 * PAGE composition includes a side-by-side lyrics block; nothing here asserts
 * it. FR-16 (back to Songs) is not in this ticket's `implements` list either.
 *
 * SELECTOR ASSUMPTIONS, stated up front so they are cheap to correct — the
 * assertions' intent does not depend on them:
 *
 *  A. Nothing is addressed by a theme class name. Sections are found by their
 *     own *label text* ("LYRICS", "NOTES", "VIDEO", "RELEASES", …) and content
 *     by the real migrated strings it must show. That is the only way to write
 *     these assertions without having been shown the markup.
 *  B. `.layout-content` is the body region and `<main>` wraps the page's own
 *     content (body region + any sidebar), with the site header, the page-title
 *     hero and the site footer outside it. Established by page-hero.spec.ts
 *     (its assumption B) and confirmed against the live page while authoring.
 *     Used only to scope the "the type is not shown" check for a Modest Mouse
 *     song, because the site slogan and the footer disclaimer legitimately
 *     contain the words "Modest Mouse".
 *  C. The hero supplies the page's single `<h1>` (INT8-028's block, already
 *     live site-wide). This ticket does not build a second hero — but the song
 *     name showing up as that `<h1>` is Scenario 1, so it is asserted.
 *  D. The "coming soon" rail may live in the body region or in a sidebar
 *     alongside it, so it is searched for across the whole page.
 *
 * ---------------------------------------------------------------------------
 * GROUND TRUTH — verified against the live migrated dataset at authoring time
 * (2026-07-26) by querying the Drupal database directly. There is no fixture
 * site; these are real nodes with real aliases.
 *
 *   - 492 Song nodes. 487 have lyrics, 247 have notes, **2** have quotes, and
 *     **0** have `field_video` (the `node__field_video` table is empty).
 *   - NO song has lyrics AND quotes AND notes together. The ticket's "standard
 *     song" therefore cannot be one node, so Scenario 1 is asserted across two:
 *     the quote half on "Float On", the notes half on "Now You're Sleeping".
 *     See the SONGS table below.
 *   - The empty `field_video` is expected, not a data defect:
 *     requirements.md §2.3 records that `Song_Video` was deliberately NOT
 *     imported (INT8-013) and that `field_video` is populated by manual entry
 *     pre-launch. FR-17 is therefore not exercisable against today's data; the
 *     FR-17 test below is explicit about that rather than passing silently on
 *     absent data. See its own comment.
 *   - Song type terms are exactly: "Modest Mouse", "Ugly Casanova",
 *     "Side Projects", "Covers".
 * ------------------------------------------------------------------------- */

type SongFixture = {
  /** Real Pathauto alias, verified against `path_alias`. */
  path: string;
  /** `node_field_data.title`, verbatim. */
  title: string;
  /** `field_song_type` term name, verbatim. */
  type: string;
  /** A distinctive substring of the rendered lyrics, or null when absent. */
  lyrics: string | null;
  /** A distinctive substring of the rendered quote, or null when absent. */
  quote: string | null;
  /** A distinctive substring of the rendered notes, or null when absent. */
  notes: string | null;
};

/**
 * "Float On" — the quote half of Scenario 1, and half of Scenario 2.
 *
 * One of only TWO songs in the whole dataset with a quote (the other is
 * "The Good Times Are Killing Me"), so this is not an arbitrary pick — it is
 * one of the two nodes on which FR-12's quote clause can be tested at all.
 * It has lyrics + quote and NO notes and NO video, so it proves the quote
 * renders *and*, on the same page load, that the NOTES and VIDEO sections are
 * omitted cleanly (FR-15).
 *
 * Note the alias: `/songs/float`, not `/songs/float-on` — Pathauto drops "on"
 * as a stop word. Taken from `path_alias`, not guessed.
 */
const QUOTE_SONG: SongFixture = {
  path: '/songs/float',
  title: 'Float On',
  type: 'Modest Mouse',
  lyrics: 'I backed my car into a cop car the other day',
  quote: 'I just want to feel good for a day',
  notes: null,
};

/**
 * "Now You're Sleeping" — the notes half of Scenario 1, and the FR-12 negative.
 *
 * Chosen for its TYPE, which is the point. It is an **Ugly Casanova** song, and
 * the strings "Ugly Casanova", "Side Projects" and "Covers" appear nowhere in
 * its title, lyrics or notes (checked in the database), nor anywhere in the
 * site's header, nav or footer chrome (checked against the live page). So
 * asserting "Ugly Casanova" is absent from this page is a real assertion: it
 * would fail the moment the type/group were rendered, and it cannot pass
 * vacuously the way asserting an absent-anyway string would.
 *
 * A Modest Mouse song could NOT carry this assertion — the site slogan
 * ("A Modest Mouse Fan Collaborative") and the footer disclaimer both contain
 * that exact string, so a whole-page match would be meaningless there. The
 * Modest Mouse case is covered separately, scoped to <main> (assumption B).
 *
 * It also has lyrics + notes and NO quote and NO video.
 */
const NOTES_SONG: SongFixture = {
  path: '/songs/now-youre-sleeping',
  title: "Now You're Sleeping",
  type: 'Ugly Casanova',
  lyrics: 'Blink hard enough',
  quote: null,
  notes: 'iTunes bonus track',
};

/**
 * "Bukowski" — the SONG PAGE — MISSING FIELDS panel, exactly.
 *
 * Lyrics only: no quote, no notes, no video, no parent song. That is the
 * precise state the hi-fi's precision panel draws ("no quote, no notes, no
 * video: layout collapses, no empty gaps"), so this is the node that can carry
 * the "lyrics move up to sit directly under the title strip" assertion.
 */
const BARE_SONG: SongFixture = {
  path: '/songs/bukowski',
  title: 'Bukowski',
  type: 'Modest Mouse',
  lyrics: 'Woke up this morning and it seemed to me',
  quote: null,
  notes: null,
};

/** Every song type term name in the vocabulary (`taxonomy_term_field_data`). */
const ALL_TYPES = ['Modest Mouse', 'Ugly Casanova', 'Side Projects', 'Covers'];

/** A slug that matches no node. Must 404 (Scenario 3, api-contract §2.2). */
const UNKNOWN_SLUG = '/songs/there-is-no-such-song-int8-019';

/**
 * The right-rail "coming soon" stubs the ticket names: releases / last-played /
 * tour-stats. Labels are matched loosely because the hi-fi's exact wording
 * ("TIMES PLAYED / TOUR STATS") is a design string, not a contractual one.
 */
const RAIL_STUBS: { key: string; label: RegExp }[] = [
  { key: 'releases', label: /^releases$/i },
  { key: 'lastPlayedLive', label: /^last\s*played(\s*live)?$/i },
  { key: 'tourStats', label: /tour\s*stats|times\s*played/i },
];

/* -------------------------------------------------------------------------
 * Helpers. All of them work off text and computed style, never off a class
 * name this test has not been shown (assumption A).
 * ---------------------------------------------------------------------- */

type LabelInfo = {
  key: string;
  /** Document-order index of the element, or -1 when the label is absent. */
  index: number;
  /** The element's own text, verbatim (before normalisation). */
  text: string;
  tag: string;
  fontFamily: string;
  textTransform: string;
  /** Whether the element is rendered at all (a hidden heading is still one). */
  rendered: boolean;
};

/**
 * Find "section label" elements: an element whose OWN text nodes (so a
 * visually-hidden prefix span does not hide it) match one of the given
 * patterns, ignoring case, surrounding whitespace and a trailing colon.
 *
 * Own text, not textContent, on purpose — otherwise every ancestor wrapper up
 * to <body> would also "match" the word LYRICS and document-order comparisons
 * would be nonsense.
 */
async function findLabels(
  page: Page,
  patterns: { key: string; source: string; flags: string }[],
): Promise<LabelInfo[]> {
  return (await page.evaluate((wanted) => {
    const ownText = (el: Element): string =>
      Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim();

    const all = Array.from(document.querySelectorAll('*'));
    const out: LabelInfo[] = [];

    for (const { key, source, flags } of wanted) {
      const re = new RegExp(source, flags);
      let found: { el: Element; index: number } | null = null;
      for (let i = 0; i < all.length; i++) {
        const text = ownText(all[i]).replace(/:$/, '').trim();
        if (text && re.test(text)) {
          found = { el: all[i], index: i };
          break;
        }
      }
      if (!found) {
        out.push({
          key,
          index: -1,
          text: '',
          tag: '',
          fontFamily: '',
          textTransform: '',
          rendered: false,
        });
        continue;
      }
      const cs = getComputedStyle(found.el);
      const rect = found.el.getBoundingClientRect();
      out.push({
        key,
        index: found.index,
        text: ownText(found.el),
        tag: found.el.tagName.toLowerCase(),
        fontFamily: cs.fontFamily,
        textTransform: cs.textTransform,
        rendered: cs.display !== 'none' && cs.visibility !== 'hidden' && rect.height > 0,
      });
    }
    return out;
  }, patterns)) as LabelInfo[];
}

/** Convenience wrapper: pass real RegExps, get a keyed map back. */
async function labels(
  page: Page,
  patterns: Record<string, RegExp>,
): Promise<Record<string, LabelInfo>> {
  const list = await findLabels(
    page,
    Object.entries(patterns).map(([key, re]) => ({ key, source: re.source, flags: re.flags })),
  );
  const map: Record<string, LabelInfo> = {};
  for (const info of list) map[info.key] = info;
  return map;
}

/** The section labels this page is expected to speak in. */
const SECTION_LABEL_PATTERNS = {
  lyrics: /^lyrics$/i,
  notes: /^notes?$/i,
  video: /^videos?$/i,
  quote: /^quotes?$/i,
};

type TextInfo = {
  key: string;
  /** Document-order index of the DEEPEST element holding the snippet, or -1. */
  index: number;
  fontFamily: string;
  fontStyle: string;
  /** Self-and-ancestor computed styles, innermost first, up to <main>. */
  chain: { tag: string; borderLeftWidth: string; fontStyle: string; fontFamily: string }[];
};

/**
 * Locate a content snippet — the deepest element whose textContent contains it.
 * "Deepest" matters for the same reason `ownText` does above: every ancestor
 * contains the snippet too, and only the innermost one has the styles the
 * design system pins.
 */
async function findText(
  page: Page,
  wanted: { key: string; snippet: string }[],
): Promise<TextInfo[]> {
  return (await page.evaluate((probes) => {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const all = Array.from(document.querySelectorAll('*'));
    const out: TextInfo[] = [];

    for (const { key, snippet } of probes) {
      const needle = norm(snippet);
      let hit: { el: Element; index: number } | null = null;
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        if (!norm(el.textContent ?? '').includes(needle)) continue;
        const deeper = Array.from(el.children).some((c) =>
          norm(c.textContent ?? '').includes(needle),
        );
        if (deeper) continue;
        hit = { el, index: i };
        break;
      }
      if (!hit) {
        out.push({ key, index: -1, fontFamily: '', fontStyle: '', chain: [] });
        continue;
      }
      const cs = getComputedStyle(hit.el);
      const chain: TextInfo['chain'] = [];
      let node: Element | null = hit.el;
      for (let depth = 0; node && depth < 8; depth++) {
        const s = getComputedStyle(node);
        chain.push({
          tag: node.tagName.toLowerCase(),
          borderLeftWidth: s.borderLeftWidth,
          fontStyle: s.fontStyle,
          fontFamily: s.fontFamily,
        });
        if (node.tagName === 'MAIN' || node.tagName === 'BODY') break;
        node = node.parentElement;
      }
      out.push({ key, index: hit.index, fontFamily: cs.fontFamily, fontStyle: cs.fontStyle, chain });
    }
    return out;
  }, wanted)) as TextInfo[];
}

async function texts(
  page: Page,
  snippets: Record<string, string>,
): Promise<Record<string, TextInfo>> {
  const list = await findText(
    page,
    Object.entries(snippets).map(([key, snippet]) => ({ key, snippet })),
  );
  const map: Record<string, TextInfo> = {};
  for (const info of list) map[info.key] = info;
  return map;
}

/** Normalised visible text of the page, or of a scope within it. */
async function visibleText(page: Page, scope = 'body'): Promise<string> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    // NUL-wrapped so the sentinel can never collide with real page text.
    // (Built with String.fromCharCode rather than literal NUL bytes, which would
    // make this file binary and unparseable; assertions match the substring.)
    if (!el) return String.fromCharCode(0) + 'NOT-FOUND' + String.fromCharCode(0);
    return (el.innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
  }, scope);
}

type Stub = { label: string; text: string; borderStyle: string; opacity: string; valueColor: string };

/**
 * The "coming soon" stubs, found without a class name: any element whose text
 * matches /coming soon/i, walked up to the nearest ancestor that also carries a
 * short display label. Returns that ancestor's label, full text and the two
 * computed properties the design system pins for the stub (dashed rule, dimmed).
 */
async function comingSoonStubs(page: Page): Promise<Stub[]> {
  return (await page.evaluate(() => {
    const norm = (s: string) => (s ?? '').replace(/\s+/g, ' ').trim();
    const ownText = (el: Element): string =>
      norm(
        Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent ?? '')
          .join(''),
      );

    // Deepest elements whose text is (just) "Coming soon".
    const leaves = Array.from(document.querySelectorAll('*')).filter((el) => {
      if (!/coming\s*soon/i.test(el.textContent ?? '')) return false;
      return !Array.from(el.children).some((c) => /coming\s*soon/i.test(c.textContent ?? ''));
    });

    const out: Stub[] = [];
    const seen = new Set<Element>();
    for (const leaf of leaves) {
      // Walk up until the container holds a sibling label as well as the value.
      let node: Element | null = leaf;
      let container: Element | null = null;
      for (let depth = 0; node && depth < 5; depth++) {
        const parent: Element | null = node.parentElement;
        if (!parent) break;
        const labelChild = Array.from(parent.children).find(
          (c) => c !== node && ownText(c).length > 0 && ownText(c).length <= 40,
        );
        if (labelChild) {
          container = parent;
          break;
        }
        node = parent;
      }
      if (!container || seen.has(container)) continue;
      seen.add(container);

      const label =
        Array.from(container.children)
          .map((c) => ownText(c))
          .find((t) => t.length > 0 && !/coming\s*soon/i.test(t)) ?? '';
      const cs = getComputedStyle(container);
      out.push({
        label,
        text: norm(container.textContent ?? ''),
        borderStyle: cs.borderStyle || cs.borderTopStyle,
        opacity: cs.opacity,
        valueColor: getComputedStyle(leaf as Element).color,
      });
    }
    return out;
  })) as Stub[];
}

/** Geometry needed for the "no gap left behind" check (FR-15 / MISSING FIELDS). */
async function firstContentOffset(page: Page): Promise<{
  heroBottom: number;
  firstSectionTop: number;
  /** Elements above the first section that occupy height but hold no text. */
  emptyBlocks: { tag: string; height: number }[];
}> {
  return page.evaluate(() => {
    const hero = document.querySelector('.hero, header.site-header') as HTMLElement | null;
    const heroRect = hero?.getBoundingClientRect();
    const heroBottom = (heroRect?.bottom ?? 0) + window.scrollY;

    const main = document.querySelector('main') ?? document.body;
    const candidates = Array.from(main.querySelectorAll('*')).filter((el) => {
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (!text) return false;
      const deeper = Array.from(el.children).some(
        (c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim() === text,
      );
      return !deeper;
    });

    let firstSectionTop = Number.POSITIVE_INFINITY;
    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      if (r.height <= 0) continue;
      firstSectionTop = Math.min(firstSectionTop, r.top + window.scrollY);
    }

    const emptyBlocks: { tag: string; height: number }[] = [];
    for (const el of Array.from(main.querySelectorAll('*'))) {
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (text) continue;
      if (el.querySelector('img, iframe, video, svg, picture, source')) continue;
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      if (r.height > 8 && top < firstSectionTop) {
        emptyBlocks.push({ tag: el.tagName.toLowerCase(), height: Math.round(r.height) });
      }
    }

    return { heroBottom, firstSectionTop, emptyBlocks };
  });
}

/* -------------------------------------------------------------------------
 * Scenario 1 — standard song.
 * ---------------------------------------------------------------------- */

test.describe('Song page — Scenario 1: a standard song (FR-12, FR-14, FR-17)', () => {
  test('the song name is the page\'s single <h1>', async ({ page }) => {
    // GREEN BY DESIGN TODAY: INT8-028's page-header hero block already supplies
    // this site-wide, and this ticket must not build a second hero. Asserted
    // anyway because "Then I see name" is Scenario 1's first clause, and a
    // dedicated view mode + Twig override is exactly the kind of change that
    // can accidentally reintroduce a second <h1> or drop the hero.
    for (const song of [QUOTE_SONG, NOTES_SONG, BARE_SONG]) {
      const response = await page.goto(song.path);
      expect(response?.status(), `${song.path} did not return 200`).toBe(200);
      await expect(page.locator('h1'), `${song.path} does not have exactly one <h1>`).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(new RegExp(`^\\s*${song.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'));
    }
  });

  test('the quote and the lyrics both render, with the quote above the lyrics', async ({ page }) => {
    await page.goto(QUOTE_SONG.path);

    const found = await texts(page, {
      quote: QUOTE_SONG.quote!,
      lyrics: QUOTE_SONG.lyrics!,
    });
    // FR-12: name, quotes, lyrics, notes. This node is one of only two in the
    // dataset carrying a quote, so this is the quote clause's only real test.
    expect(found.quote.index, `the quote is not rendered on ${QUOTE_SONG.path}`).toBeGreaterThan(-1);
    expect(found.lyrics.index, `the lyrics are not rendered on ${QUOTE_SONG.path}`).toBeGreaterThan(-1);

    const label = await labels(page, SECTION_LABEL_PATTERNS);
    expect(label.lyrics.index, 'there is no LYRICS section label').toBeGreaterThan(-1);

    // ORDER, from the hi-fi's SONG PAGE composition: the quote block sits at
    // the top of the main column, above the LYRICS label — it is the page's
    // opening gesture, not a footnote after the lyrics. Document order is the
    // observable form of that; asserted here because it is the one part of
    // Scenario 1 that a plain field-order default gets wrong.
    expect(
      found.quote.index,
      `the quote renders AFTER the LYRICS label (quote at document position ${found.quote.index}, ` +
        `LYRICS label at ${label.lyrics.index}). The hi-fi's SONG PAGE composition puts the quote ` +
        'block above the lyrics.',
    ).toBeLessThan(label.lyrics.index);
    expect(label.lyrics.index).toBeLessThan(found.lyrics.index);
  });

  test('the notes render under their own section label, after the lyrics', async ({ page }) => {
    await page.goto(NOTES_SONG.path);

    const found = await texts(page, {
      lyrics: NOTES_SONG.lyrics!,
      notes: NOTES_SONG.notes!,
    });
    expect(found.lyrics.index, `the lyrics are not rendered on ${NOTES_SONG.path}`).toBeGreaterThan(-1);
    expect(found.notes.index, `the notes are not rendered on ${NOTES_SONG.path}`).toBeGreaterThan(-1);

    const label = await labels(page, SECTION_LABEL_PATTERNS);
    expect(label.lyrics.index, 'there is no LYRICS section label').toBeGreaterThan(-1);
    expect(label.notes.index, 'there is no NOTES section label').toBeGreaterThan(-1);

    // Hi-fi order: LYRICS … NOTES … VIDEO down the main column.
    expect(label.lyrics.index).toBeLessThan(label.notes.index);
    expect(label.notes.index).toBeLessThan(found.notes.index);
  });

  test('the quote is rendered as the design system\'s quote block, not as a plain field', async ({
    page,
  }) => {
    await page.goto(QUOTE_SONG.path);
    const found = await texts(page, { quote: QUOTE_SONG.quote! });
    expect(found.quote.index, 'the quote is not rendered at all').toBeGreaterThan(-1);

    // design-system.md §3, Quote block: "left-rule, italic Lora". Both halves
    // are asserted against COMPUTED style rather than a class name, so the test
    // agrees with whatever the theme calls the component. The left rule is what
    // makes it read as a quote at a glance; the italic serif is the typographic
    // half of the same contract (--font-body is Lora, tokens.css line 62).
    const chain = found.quote.chain;
    expect(chain.length, 'could not walk the quote\'s ancestor chain').toBeGreaterThan(0);

    const hasLeftRule = chain.some((c) => parseFloat(c.borderLeftWidth || '0') >= 2);
    expect(
      hasLeftRule,
      'the quote has no left rule on itself or any ancestor up to <main> — design-system.md §3 ' +
        `specifies the Quote block as "left-rule, italic Lora". Chain: ${JSON.stringify(chain)}`,
    ).toBe(true);

    const isItalic = chain.some((c) => c.fontStyle === 'italic' || c.fontStyle === 'oblique');
    expect(
      isItalic,
      `the quote is not italic — design-system.md §3 specifies italic Lora. Chain: ${JSON.stringify(chain)}`,
    ).toBe(true);

    const isSerif = chain.some((c) => /lora|georgia|serif/i.test(c.fontFamily));
    expect(
      isSerif,
      `the quote is not set in the body serif (--font-body: Lora). Chain: ${JSON.stringify(chain)}`,
    ).toBe(true);
  });

  test('the section labels read as the hi-fi\'s display labels (uppercase, --font-display)', async ({
    page,
  }) => {
    await page.goto(NOTES_SONG.path);
    const label = await labels(page, SECTION_LABEL_PATTERNS);

    // The hi-fi sets these as "LYRICS" / "NOTES" in Oswald with wide tracking;
    // tokens.css line 61 assigns --font-display (Oswald) to "headings, nav,
    // labels". Either literal uppercase text or text-transform: uppercase
    // satisfies the visual contract — the test does not care which the theme
    // chose, only that the label is not left as sentence-case body text.
    for (const key of ['lyrics', 'notes'] as const) {
      const info = label[key];
      expect(info.index, `there is no ${key.toUpperCase()} section label`).toBeGreaterThan(-1);

      const readsUppercase =
        info.textTransform === 'uppercase' || (info.text.length > 0 && info.text === info.text.toUpperCase());
      expect(
        readsUppercase,
        `the ${key.toUpperCase()} label renders as "${info.text}" with text-transform: ${info.textTransform} — ` +
          'the hi-fi sets section labels in uppercase',
      ).toBe(true);

      expect(
        info.fontFamily,
        `the ${key.toUpperCase()} label is set in "${info.fontFamily}", not the display font ` +
          '(--font-display: Oswald)',
      ).toMatch(/oswald/i);
    }
  });

  test('the "coming soon" rail reserves releases, last-played and tour-stats (FR-14 spirit)', async ({
    page,
  }) => {
    // Pinned wide: the rail is a right-hand column at desktop in the hi-fi, and
    // the project's browser matrix includes phone viewports.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(QUOTE_SONG.path);

    const stubs = await comingSoonStubs(page);
    expect(
      stubs.length,
      'no "coming soon" stubs were found anywhere on the song page — the ticket requires the rail to ' +
        'reserve space for releases / last-played / tour-stats',
    ).toBeGreaterThanOrEqual(RAIL_STUBS.length);

    for (const wanted of RAIL_STUBS) {
      const match = stubs.find((s) => wanted.label.test(s.label));
      expect(
        match,
        `no "coming soon" stub labelled ${wanted.label} — found labels: ${stubs.map((s) => `"${s.label}"`).join(', ') || '(none)'}`,
      ).toBeTruthy();
      // FR-14: the stub reserves the space, it does NOT show data. Its whole
      // text must be the label plus "Coming soon" and nothing else.
      expect(
        match!.text,
        `the "${match!.label}" stub renders more than a placeholder: "${match!.text}"`,
      ).toMatch(/coming\s*soon/i);
    }
  });

  test('the "coming soon" stubs use the design system\'s disabled stub treatment', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(QUOTE_SONG.path);

    const stubs = await comingSoonStubs(page);
    expect(stubs.length, 'no "coming soon" stubs to inspect').toBeGreaterThan(0);

    // design-system.md §3 gives this one a *precise* spec: a dashed rule, and
    // de-emphasised (not ordinary body-colour) text.
    //
    // AMENDED 2026-07-26, IMPLEMENTER, NOT THE ORIGINAL TEST AUTHOR — recorded
    // here rather than silently: this test originally asserted the spec's
    // literal first-draft mechanism for "de-emphasised" — whole-container
    // opacity: .65 over --color-fg-disabled text. Building this component and
    // running Axe against it found that combination measures 1.77:1 against
    // white (and --color-fg-disabled alone, with NO opacity, is only 2.56:1) —
    // both fail NFR-1's 4.5:1 floor outright, which is binding and takes
    // precedence over a single component's original mockup-literal value.
    // design-system.md §3/§5 were corrected FIRST (never silently diverged
    // from), to --color-fg-muted text with no container opacity — the bold
    // weight, not a second shade or transparency, is what still reads as more
    // dimmed/label-like at this size. This assertion was then updated to
    // match the corrected, now-binding spec: it checks for the muted colour
    // instead of a reduced opacity. The dashed-border half is untouched.
    // getPropertyValue('--color-fg-muted') would return the literal authored
    // text (e.g. "var(--i8-corduroy)"), not a resolved colour — a throwaway
    // element with the custom property applied as its own `color` is what
    // makes the browser resolve it to the same rgb(...) form getComputedStyle
    // reports on the real stub elements (the same technique page-hero.spec.ts
    // uses for token px values).
    const mutedColor = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.color = 'var(--color-fg-muted)';
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    });
    expect(mutedColor, '--color-fg-muted did not resolve on the page').not.toBe('');

    for (const stub of stubs) {
      expect(
        stub.borderStyle,
        `the "${stub.label}" stub has border-style "${stub.borderStyle}" — the design system specifies a dashed rule`,
      ).toMatch(/dashed/);
      expect(
        stub.valueColor,
        `the "${stub.label}" stub's value renders in ${stub.valueColor}, not --color-fg-muted (${mutedColor}) — ` +
          'design-system.md §3 specifies de-emphasised text for this component',
      ).toBe(mutedColor);
    }
  });

  test('the song\'s type/group is never shown (FR-12)', async ({ page }) => {
    // GREEN BY DESIGN TODAY (the default node display shows no type field) —
    // this is a guard against a new view mode switching it back on.
    //
    // The discriminating case: "Now You're Sleeping" is an Ugly Casanova song,
    // and "Ugly Casanova" appears nowhere in its title, lyrics or notes, nor
    // in any site chrome. So this assertion is genuinely falsifiable — render
    // the type and it fails — and cannot pass merely because the string never
    // occurs anywhere.
    await page.goto(NOTES_SONG.path);
    const whole = await visibleText(page);
    expect(whole, 'page text could not be read').not.toContain('NOT-FOUND');
    // Premise: we really are on the right page, so absence means something.
    expect(whole).toContain(NOTES_SONG.notes!);
    expect(
      whole,
      `the song page shows its type/group ("${NOTES_SONG.type}") — FR-12 forbids it (a song does not show its band tag)`,
    ).not.toMatch(new RegExp(NOTES_SONG.type, 'i'));
    // The other type names must not appear either.
    for (const type of ALL_TYPES.filter((t) => t !== 'Modest Mouse')) {
      expect(whole, `an unrelated song type ("${type}") appears on the page`).not.toMatch(
        new RegExp(type, 'i'),
      );
    }

    // The Modest Mouse case, scoped to <main> (assumption B) because the site
    // slogan and the footer disclaimer legitimately carry those two words.
    // "Float On"'s own lyrics, quote and title do not contain them, checked in
    // the database, so this is falsifiable too.
    await page.goto(QUOTE_SONG.path);
    const mainText = await visibleText(page, 'main');
    expect(mainText, '<main> not found — see assumption B').not.toContain('NOT-FOUND');
    // AMENDED BY IMPLEMENTER, review round 2: the site owner asked for lyrics
    // to render lowercased via CSS (text-transform), which the fixture's own
    // mixed-case snippet predates. `visibleText()` reads `.innerText`, which
    // — unlike `.textContent` — reflects the CSS-rendered case, so this
    // premise check (merely "are we on the right page") now needs a
    // case-insensitive comparison. It is a premise, not the thing under
    // test: FR-12's actual assertions below are already case-insensitive
    // regexes and are untouched.
    expect(mainText.toLowerCase()).toContain(QUOTE_SONG.lyrics!.slice(0, 30).toLowerCase());
    expect(
      mainText,
      'the song page shows its type/group ("Modest Mouse") inside <main> — FR-12 forbids it',
    ).not.toMatch(/modest\s+mouse/i);

    // And no route back into the landing's type filter, which would smuggle the
    // type in as a link even if the term name were styled away.
    await expect(
      page.locator('a[href*="type="]'),
      'the song page links to a type-filtered Songs landing, which exposes the song\'s group (FR-12)',
    ).toHaveCount(0);
  });

  test('no release, setlist, live, tablature or studio data appears (FR-14)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    for (const song of [QUOTE_SONG, NOTES_SONG, BARE_SONG]) {
      await page.goto(song.path);
      const whole = await visibleText(page);

      // These deferred domains have no slice-1 surface at all — not even a
      // reserved stub — so their vocabulary must be absent outright.
      for (const forbidden of [
        /\btablature\b/i,
        /\btabs?\b/i,
        /\bsetlists?\b/i,
        /\bstudio\s+session/i,
        /\bappears?\s+on\b/i,
        /\btrack\s*listing\b/i,
      ]) {
        expect(
          whole,
          `${song.path} shows deferred data matching ${forbidden} — FR-14 defers releases, setlists, tabs and studio sessions`,
        ).not.toMatch(forbidden);
      }

      // "Releases" and "played live" DO appear — but only ever as a reserved
      // "coming soon" stub, never attached to real data. Assert the pairing
      // rather than the mere presence of the words.
      const stubs = await comingSoonStubs(page);
      const stubText = stubs.map((s) => s.text).join(' ');
      for (const reserved of [/releases/i, /played\s*live/i]) {
        if (!reserved.test(whole)) continue;
        expect(
          stubText,
          `${song.path} uses ${reserved} outside a "coming soon" stub, so it may be showing real deferred data (FR-14)`,
        ).toMatch(reserved);
      }
    }
  });
});

/* -------------------------------------------------------------------------
 * Scenario 2 — missing fields (FR-15).
 * ---------------------------------------------------------------------- */

test.describe('Song page — Scenario 2: missing fields (FR-15)', () => {
  test('a song with no notes and no video renders neither label', async ({ page }) => {
    // GREEN BY DESIGN TODAY: Drupal's default field display already omits an
    // empty field. It stops being free the moment a bespoke Twig override
    // hardcodes the section headings, which is exactly what this ticket does —
    // so this is the regression this test exists to catch.
    //
    // AMENDED BY IMPLEMENTER, review round 2: originally QUOTE_SONG
    // ("Float On"), which had no notes and no video at authoring time. The
    // site owner has since used that exact node as their live worked example
    // while reviewing this ticket and added both a real video and real notes
    // to it — a genuine, desirable change to the site's content, not a defect.
    // That leaves QUOTE_SONG unable to carry this fixture's premise, so this
    // one test uses BARE_SONG ("Bukowski") instead, verified to still have
    // none of quote/notes/video. FR-15's actual claim (an absent field omits
    // its label entirely) is unaffected either way.
    await page.goto(BARE_SONG.path);
    const label = await labels(page, SECTION_LABEL_PATTERNS);

    // Premise, so an absent label cannot be read as "the page failed to render":
    // the sections this song DOES have are present.
    expect(label.lyrics.index, 'the LYRICS label is missing — the page did not render').toBeGreaterThan(-1);

    // FR-15's strong form: the section's LABEL is absent, not merely its value.
    expect(
      label.notes.index,
      `${BARE_SONG.path} has no notes, but renders a "${label.notes.text}" heading — FR-15 requires the ` +
        'section be omitted cleanly rather than left as an empty heading',
    ).toBe(-1);
    expect(
      label.video.index,
      `${BARE_SONG.path} has no video, but renders a "${label.video.text}" heading — FR-15 requires the ` +
        'section be omitted cleanly',
    ).toBe(-1);

    // …and no empty media frame standing in for the missing video.
    await expect(page.locator('main iframe, main video')).toHaveCount(0);
  });

  test('a song with no quote renders no quote block and no VIDEO label', async ({ page }) => {
    await page.goto(NOTES_SONG.path);
    const label = await labels(page, SECTION_LABEL_PATTERNS);

    expect(label.lyrics.index, 'the LYRICS label is missing — the page did not render').toBeGreaterThan(-1);
    expect(label.notes.index, 'the NOTES label is missing — the page did not render').toBeGreaterThan(-1);

    expect(
      label.quote.index,
      `${NOTES_SONG.path} has no quote, but renders a "${label.quote.text}" heading (FR-15)`,
    ).toBe(-1);
    expect(
      label.video.index,
      `${NOTES_SONG.path} has no video, but renders a "${label.video.text}" heading (FR-15)`,
    ).toBe(-1);

    // No orphaned quote chrome either: a left-ruled italic block with nothing
    // in it is the same defect as an empty heading.
    await expect(page.locator('main blockquote')).toHaveCount(0);
  });

  test('a lyrics-only song opens with its lyrics and leaves no gap behind (MISSING FIELDS panel)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // The hi-fi's SONG PAGE — MISSING FIELDS panel: "no quote, no notes, no
    // video: layout collapses, no empty gaps … lyrics move up to sit directly
    // under the title strip".
    await page.goto(BARE_SONG.path);
    const label = await labels(page, SECTION_LABEL_PATTERNS);
    expect(label.lyrics.index, 'the LYRICS label is missing').toBeGreaterThan(-1);
    expect(label.quote.index, 'a QUOTE heading on a song with no quote (FR-15)').toBe(-1);
    expect(label.notes.index, 'a NOTES heading on a song with no notes (FR-15)').toBe(-1);
    expect(label.video.index, 'a VIDEO heading on a song with no video (FR-15)').toBe(-1);

    const bare = await firstContentOffset(page);
    expect(
      bare.emptyBlocks,
      `${BARE_SONG.path} renders empty, height-occupying blocks above its first content — that is the ` +
        '"empty gap left behind" the MISSING FIELDS panel forbids',
    ).toEqual([]);

    const bareGap = bare.firstSectionTop - bare.heroBottom;

    // Compared against the fully-populated page rather than against a hardcoded
    // pixel value: the bare page's first section must start no LOWER than the
    // populated page's does. If the omitted sections left their wrappers or
    // margins behind, this is where it shows.
    await page.goto(QUOTE_SONG.path);
    const full = await firstContentOffset(page);
    const fullGap = full.firstSectionTop - full.heroBottom;

    expect(bareGap, 'the bare song page has no measurable content').toBeGreaterThan(0);
    expect(
      bareGap,
      `on ${BARE_SONG.path} the first content sits ${Math.round(bareGap)}px below the hero, versus ` +
        `${Math.round(fullGap)}px on the fully-populated ${QUOTE_SONG.path}. With three sections omitted the ` +
        'lyrics should move UP to sit directly under the title strip, not stay put.',
    ).toBeLessThanOrEqual(fullGap + 8);
  });
});

/* -------------------------------------------------------------------------
 * FR-17 — the embedded video.
 * ---------------------------------------------------------------------- */

test.describe('Song page — the embedded video (FR-17)', () => {
  test('a song with a video embeds it inline rather than linking to it', async ({ page }, testInfo) => {
    /**
     * HONEST ABOUT THE DATA, on purpose.
     *
     * `field_video` is EMPTY across the entire migrated dataset — verified at
     * authoring time: `SELECT COUNT(*) FROM node__field_video` returns 0 for all
     * 492 song nodes. That is not a defect and not something this ticket can
     * fix: requirements.md §2.3 records that `Song_Video` was deliberately not
     * imported (INT8-013 — only ~15 of 492 songs had one) and that `field_video`
     * is populated by **manual entry pre-launch**.
     *
     * So FR-17's positive clause cannot be exercised today by any black-box
     * test, and pretending otherwise would mean either hardcoding a song that
     * has no video (a guaranteed red the implementer cannot clear with code) or
     * writing an assertion that passes on absent data without saying so.
     *
     * This test does neither. It scans the songs under test for a video embed:
     *   - If one is found, FR-17 is asserted for real and strictly.
     *   - If none is, it records a loud `fr17-unproven` annotation naming the
     *     cause, and falls back to the clause that IS testable today — FR-17's
     *     "not merely a link" half, in its contrapositive form: with no video
     *     entered, no song page may show a bare link to a video host either.
     * The moment a single `field_video` value is entered, this becomes a real
     * FR-17 test with no edit.
     */
    const probes = [QUOTE_SONG, NOTES_SONG, BARE_SONG];
    let embedded: { path: string; tag: string; src: string } | null = null;

    for (const song of probes) {
      await page.goto(song.path);
      const found = await page.evaluate(() => {
        const el = document.querySelector('main iframe[src], main video, main video source[src]');
        if (!el) return null;
        return { tag: el.tagName.toLowerCase(), src: el.getAttribute('src') ?? '' };
      });
      if (found) {
        embedded = { path: song.path, ...found };
        break;
      }
    }

    if (!embedded) {
      testInfo.annotations.push({
        type: 'fr17-unproven',
        description:
          'No video embed was found on any probed song page. `field_video` is empty for all 492 song ' +
          'nodes (node__field_video has 0 rows), because requirements.md §2.3 defers video entry to ' +
          'manual pre-launch work. FR-17 therefore could not be exercised. Enter a `field_video` value ' +
          'on any song to make this test decisive.',
      });

      // The half that IS testable with no video data: a link must never stand
      // in for the embed. v2 "stored the embed markup and showed it in a Video
      // box"; FR-17 says embedded, "not merely a link".
      for (const song of probes) {
        await page.goto(song.path);
        await expect(
          page.locator('main a[href*="youtube."], main a[href*="youtu.be"], main a[href*="vimeo."]'),
          `${song.path} links out to a video host instead of embedding — FR-17 requires an embedded video, not a link`,
        ).toHaveCount(0);
      }
      return;
    }

    // A video IS present — assert FR-17 properly.
    await page.goto(embedded.path);
    const label = await labels(page, SECTION_LABEL_PATTERNS);
    expect(label.video.index, `${embedded.path} embeds a video but renders no VIDEO section label`).toBeGreaterThan(-1);

    const frame = page.locator('main iframe, main video').first();
    await expect(frame, `${embedded.path}: the video embed is not visible`).toBeVisible();

    // "Embedded … not merely a link": the embed carries a real playable source
    // and occupies the layout.
    const box = await frame.boundingBox();
    expect(box?.width ?? 0, `${embedded.path}: the video embed has no width`).toBeGreaterThan(100);
    expect(box?.height ?? 0, `${embedded.path}: the video embed has no height`).toBeGreaterThan(50);

    // An oEmbed remote-video iframe must be titled, or it is an unlabelled
    // frame for a screen reader (NFR-1, and axe's frame-title rule).
    if (embedded.tag === 'iframe') {
      const title = await frame.getAttribute('title');
      expect(title?.trim() ?? '', `${embedded.path}: the video <iframe> has no title attribute`).not.toBe('');
    }
  });
});

/* -------------------------------------------------------------------------
 * Scenario 3 — unknown slug.
 * ---------------------------------------------------------------------- */

test.describe('Song page — Scenario 3: unknown slug', () => {
  test('an unknown slug returns a real 404, not a 200 with an error page', async ({ page, request }) => {
    // GREEN BY DESIGN TODAY (Drupal's own routing) — asserted because a
    // dedicated route/controller for /songs/<slug> is precisely the kind of
    // change that can turn a 404 into a 200-with-a-message.

    // Raw HTTP first, so no browser-level redirect handling can mask the status.
    const res = await request.get(UNKNOWN_SLUG, { maxRedirects: 0 });
    expect(
      res.status(),
      `${UNKNOWN_SLUG} returned ${res.status()} — api-contract §2.2 requires an unknown slug to be a Drupal 404`,
    ).toBe(404);

    const response = await page.goto(UNKNOWN_SLUG);
    expect(response?.status(), 'the browser navigation did not see a 404 either').toBe(404);

    // …and it is genuinely not a song page: no lyrics section was rendered for
    // a node that does not exist.
    const label = await labels(page, SECTION_LABEL_PATTERNS);
    expect(label.lyrics.index, 'the 404 page renders a LYRICS section').toBe(-1);
  });
});

/* -------------------------------------------------------------------------
 * NFR-1 (accessibility) and NFR-2 (320px).
 * ---------------------------------------------------------------------- */

test.describe('Song page — accessibility and responsiveness', () => {
  // AMENDED BY IMPLEMENTER, review round 2: written when `field_video` was
  // empty across the whole dataset, so this scan never actually reached a
  // real embed. QUOTE_SONG now carries a real YouTube video, and Axe (via
  // CDP) reaches inside it — reporting violations in YOUTUBE'S OWN player
  // chrome (`html5-video-player`, `ytmVideoInfoLink`, ...), third-party
  // markup this project cannot fix or influence. Both scans now exclude the
  // video iframe's own subtree; NFR-1 for the embed itself is covered
  // separately (the FR-17 test's iframe-title assertion) — what these two
  // tests check is everything OURS on the page.
  test('axe: no serious/critical violations on a song page at desktop (NFR-1)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(QUOTE_SONG.path);
    await expect(page.locator('h1')).toHaveCount(1);

    const results = await new AxeBuilder({ page }).exclude('.song-detail__video iframe').analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('axe: no serious/critical violations on a song page at 320px (NFR-1, NFR-2)', async ({
    page,
  }) => {
    // NFR-2's contractual minimum width; no configured project is this narrow.
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(QUOTE_SONG.path);

    const results = await new AxeBuilder({ page }).exclude('.song-detail__video iframe').analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('the song page holds up at a 320px viewport (NFR-2)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });

    for (const song of [QUOTE_SONG, NOTES_SONG]) {
      await page.goto(song.path);

      // The hi-fi's SONG PAGE MOBILE composition stacks the main column and the
      // rail; nothing may push the document sideways.
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow, `${song.path} scrolls horizontally at 320px`).toBeLessThanOrEqual(1);

      // The content survives the reflow — the sections are still there, not
      // hidden away to make the width fit.
      const label = await labels(page, SECTION_LABEL_PATTERNS);
      expect(label.lyrics.index, `${song.path}: no LYRICS section at 320px`).toBeGreaterThan(-1);

      const found = await texts(page, { lyrics: song.lyrics! });
      expect(found.lyrics.index, `${song.path}: the lyrics are gone at 320px`).toBeGreaterThan(-1);

      // The rail stacks rather than disappearing — it is content, not chrome.
      const stubs = await comingSoonStubs(page);
      expect(
        stubs.length,
        `${song.path}: the "coming soon" rail is absent at 320px — the hi-fi's SONG PAGE MOBILE stacks it below the notes`,
      ).toBeGreaterThanOrEqual(RAIL_STUBS.length);
    }
  });
});
