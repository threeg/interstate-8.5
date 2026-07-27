---
id: INT8-019
title: Song page (view mode + Twig + video)
type: story
status: in-review
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-013, INT8-015, INT8-016]
implements: [FR-12, FR-14, FR-15, FR-17]
tests_required: true
estimate: 3
---

## In plain English
The page for a single song: its name, any quote, the lyrics, notes, and an inline video — nothing about
releases or live shows yet.

## User story
As a fan
I want to open a song and read its lyrics, notes and watch its video
so that I have the song's full record in one place.

## Acceptance criteria

**Scenario 1: standard song**
- Given a song with content
- When I open its page
- Then I see name, quote (if any), lyrics, notes, and the **embedded** video (FR-17)
- And the song's **type/group is not shown**, and no release/live/tab/studio data appears (FR-12, FR-14).

**Scenario 2: missing fields**
- Given a song with no quote / no video / no notes
- Then those sections are omitted cleanly — no empty headings (FR-15).

**Scenario 3: unknown song**
- When I request an unknown slug
- Then I get a 404.

## Technical approach
- A dedicated **view mode** + **Twig** override for `song`, rendered with the theme SDC (quote block,
  hero, video). Video embeds via the Remote-video media (oEmbed, FR-17).
- The "coming soon" right-rail stubs (releases / last-played / tour-stats) reserve space (FR-14 spirit;
  no real data). Type/group omitted (FR-12).
- Route `/songs/<slug>` (api-contract §2.2). Version side-by-side is **INT8-020**.
- **Page-title block to exclude, matching INT8-018:** the song hero's own overlaid title is meant to be
  the page's one `<h1>` (per `1B.dc.html`), same as the Songs landing. Add the song route's path(s) to
  `block.block.interstate_85_page_title`'s existing `request_path` visibility condition (currently just
  `/songs`) rather than introducing a second exclusion mechanism.
- **If INT8-028 has landed when this ticket is picked up, use its hero block — do not build a second
  hero mechanism.** INT8-028 moves the hero out of page templates into an `i8_page_hero` block placed in
  a new full-width `page_header` region. Where it exists, supply this page's hero by extending that
  block's visibility condition to the song route (or placing a second instance of the same plugin with
  the song hero photo), instead of embedding `interstate_85:hero` in the song page's own template.
  INT8-028 is deliberately **not** in this ticket's `depends_on`: ids are allocated in execution order
  and forward dependencies are a defect (CONVENTIONS §4.3). This is a sequencing recommendation only —
  this ticket remains buildable on its own if INT8-028 has not landed yet, but building INT8-028 first
  avoids writing hero-in-template code that INT8-028 would then delete.

## Design references
- Wireframe: spec/wireframes/03-song-page.md (standard variant, missing-fields)
- Design system: song page layout, video, quote block; `1B.dc.html` SONG PAGE (now includes a
  **SONG PAGE MOBILE** composition — the 2026-07-21 export refresh added a genuine 375px mockup where
  slice 1 previously only had desktop/tablet/extra-wide) plus the **SONG PAGE — MISSING FIELDS**
  precision panel (design-system.md §3, decisions log 2026-07-21) — confirms lyrics move up to sit
  directly under the title strip when quote/notes/video are all absent, no empty gap left behind

## Tests
- Playwright: renders name/quote/lyrics/notes/video; omits absent fields (FR-15); no type/release/live
  (FR-12/FR-14); 404 on bad slug. Axe (NFR-1); 320px (NFR-2).
- Fixtures: shared Songs fixture incl. an empty-fields song (§8).

## QA steps
- [x] Open a song → name, lyrics, notes, inline video; no "band tag", no releases/live.
- [x] Open a lyrics-only song → no empty video/notes headings.
- [x] Hit a bad URL → 404.

## Definition of done
- [x] Acceptance criteria met
- [x] Playwright + Axe tests added and passing; `lando playwright` green
- [x] Tokens-only styling; matches `1B.dc.html`
- [x] Ticket status + notes and BOARD.md row updated in the same commit

## Notes
2026-07-26 — implemented.

**Independent test authorship, split across a session-limit interruption.** The failing Playwright
suite (`song-page.spec.ts`, 17 tests) was written by a separate model from the ticket, `requirements.md`
§4.3, `api-contract.md` §2.2, the wireframe and the hi-fi's SONG PAGE panels alone — no theme code was
read while authoring it. That subagent was killed by a session-limit error mid-write; it had finished
the file (1001 lines, complete) but never got to run or report it. Two literal NUL bytes had been left
in one string literal by the interruption, making the file binary; repaired to an escape-free
`String.fromCharCode(0)` equivalent with identical runtime value before anything was run. Confirmed 6 of
17 tests red for the right reason (the quote not in the design system's quote block, section labels not
uppercase Oswald, the "coming soon" rail entirely absent at both viewports) before implementing.

**Real-data facts the test author verified up front, worth recording because they shaped the fixtures:**
of 492 songs, 487 have lyrics, 247 have notes, only **2** have quotes, and **0** have `field_video`
(`node__field_video` is empty — expected per `requirements.md` §2.3: video entry is manual, pre-launch).
No single song has lyrics + quote + notes together, so Scenario 1's "standard song" is asserted across
two real nodes ("Float On" for the quote half, "Now You're Sleeping" for the notes half), with
"Bukowski" (lyrics only) as the MISSING FIELDS case.

**The route needed no new code at all.** `/songs/<slug>` is `entity.node.canonical`, which
`DefaultHtmlRouteProvider` wires to view mode `node.full` unconditionally
(`_entity_view: "{entity_type}.full"`) — confirmed by reading core rather than assumed. No config for
that mode existed yet (the site had only ever built `node.song.default`), so the page was quietly
rendering through the fallback. This ticket's whole implementation is: enable and build a real
`node.song.full` display (fields hidden, labels supplied by Twig instead) and a `node--song--full.html.
twig` override — both generated via the entity API (`tooling/build-song-page-display.php`, deleted after
running) and exported, never hand-authored.

**Field order is controlled by Twig, not display weight**, because the hi-fi puts the quote ABOVE the
lyrics and no single weight ordering can express that alongside the rest. `content.field_x|render|trim`
is the emptiness check throughout (not `node.field_x.isEmpty()`) — it asks "would this actually render
something", which also respects field access, and is the standard Drupal idiom for exactly this.

**The embedded video needed a second, leaner media view mode.** `field_video`'s entity-reference
formatter was pointed at the `remote_video` media type's own `default` display, which also shows a
created timestamp and a duplicate thumbnail image alongside the oEmbed iframe — fine for viewing a media
entity directly, wrong for an inline embed. Added `media.oembed_embed` (oEmbed field only, everything
else hidden) and pointed the node's video formatter at it. Core's own `OEmbedFormatter` already sets the
iframe's `title` attribute from the oEmbed resource's own title when one exists — no custom accessibility
code was needed for FR-17's iframe-title requirement.

**FR-17 verified for real, then reverted.** Since no song in the dataset has a video, the test's positive
branch (a real embed, strictly asserted) had never executed. Attached a throwaway `remote_video` media
item to "Float On" via `drush php:eval`, confirmed the strict branch passes (iframe visible, real
dimensions, real title), then deleted the media entity and cleared the field — the dataset is exactly as
found. This is verification, not seeded content; no permanent video was added, so FR-17 remains
built-but-unproven against the live dataset going forward, which is the correct and honest state per the
ticket's own data.

**A genuine NFR-1 defect was found and fixed in the SPEC, not just the code.** Axe failed on the "coming
soon" stub and on the pre-existing "MORE ABOUT THIS SONG" muted section label: both used
`--color-fg-disabled` (`#9aa4a1`), which measures **2.56:1** against white even at full opacity — already
short of NFR-1's 4.5:1 floor before the hi-fi's own further "opacity: .65 on the whole block" instruction
made it worse (**1.77:1**, confirmed by Axe). This was the hi-fi's literal, precisely-specified value, not
an implementation shortcut — so per the project's non-negotiable, `design-system.md` §3 and §5 were
corrected FIRST (both now specify `--color-fg-muted`, 5.56:1, with no container opacity; the bold weight
carries the "more dimmed" read instead), `tokens.css`'s comments on `--i8-ash`/`--color-fg-disabled` were
narrowed to their one remaining correct use (a genuinely disabled native form control, e.g. the filter
bar's selects, which axe-core's `color-contrast` rule does not evaluate the same way — confirmed by
reading its bundled source: no disabled/aria-disabled exemption exists there for plain elements, so this
was never a viable shortcut), and only then was the CSS changed to match. One test assertion
(`the "coming soon" stubs use the design system's disabled stub treatment`) had pinned the original
opacity value directly from the pre-correction spec; it was amended, with an explicit "AMENDED BY
IMPLEMENTER" comment naming the reason, to check the corrected colour instead — the dashed-border half of
that same test is untouched, and every other assertion in the suite is untouched.

**Layout decisions, recorded rather than left implicit.** The main/rail split reuses `--color-line` for
its dashed divider rather than inventing a token for the hi-fi's unnamed one-off blue (`#b9d3e3`), since
`design-system.md` §3 doesn't name that colour and adding a token for a single divider would violate
"never hardcode hex" from the other direction. The rail's 260px width is a literal layout dimension, the
same category as `song-ledger.css`'s existing `36px` rail column — not a design token. The "coming soon"
stub's 10px/13px text sizes are literal, matching how `design-system.md` §3 states them for this one
component specifically (unlike every other row, which cites token names).

**Verification.** Default gate green (58 PHPUnit, PHPCS, PHPStan, boundary check — this ticket is
theme/config only). Full Playwright suite **89/89 on chromium**, including all 17 song-page tests and
zero regressions elsewhere despite the shared-token colour change. Config exported
(`core.entity_view_mode.media.oembed_embed`, `core.entity_view_display.media.remote_video.oembed_embed`,
`core.entity_view_display.node.song.full`, and enabling `core.entity_view_mode.node.full`); `drush cim -y`
is a no-op. Firefox remains unrunnable in the `pw` container — a pre-existing environment gap, unchanged
by this work.

**Out of scope, confirmed untouched:** FR-13/FR-20 (alternate versions, side-by-side lyrics, parent/child
cross-links) — INT8-020; the "Back to Songs" link (FR-16, not in this ticket's `implements`, and not
exercised by any test in this suite).

**2026-07-26 — review round 2.** Four pieces of feedback, working from `https://interstate-8-5.lndo.site/songs/float`
(the site owner's chosen live example, to which they had added a real video and real notes). All four
were verified against the live page before touching anything, and #4 turned up a real regression.

1. **Lyrics lowercased via CSS.** `text-transform: lowercase` on `.song-detail__lyrics`, not a backend
   filter — deliberately: it leaves the stored field value untouched (search, copy-paste, and any future
   re-export still see the real casing), and it's trivially reversible. Notes/quote are unaffected — only
   the lyrics were asked for.
2. **Paragraph spacing between lyrics stanzas.** Tailwind's preflight zeroes every element's margin,
   including `<p>`, and no replacement rule had been added — stanzas ran together with no visible gap.
   Added `margin: 0 0 var(--space-3)` on `.song-detail__lyrics p` (approximating the hi-fi's own ~10px
   stanza spacing), with the last paragraph's bottom margin zeroed.
3. **Video aspect ratio.** The embed was rendering at its raw oEmbed-provider dimensions (606×150),
   not 16:9. Root cause, confirmed empirically rather than assumed: the oEmbed formatter emits real
   `width`/`height` HTML attributes, and the browser's UA stylesheet maps those to a low-specificity
   presentational `width`/`height` — just enough to pre-empt `aspect-ratio`'s auto-height calculation
   unless `height` is *explicitly* re-declared in author CSS. Added `height: auto;` next to the existing
   `aspect-ratio: 16/9`; measured 606×340.875 (exact 16:9) afterward.
4. **The "coming soon" rail moved into a real region + block, and a real regression was caught in the
   process.** Building this round's fix surfaced that `node--song--full.html.twig` had replaced core's
   entire `node.html.twig` rather than extending it — silently dropping the `<article>` wrapper, the
   `node--type-song`/`node--view-mode-full` classes, and the `title_prefix`/`title_suffix` hooks other
   modules attach through. Nothing in the test suite asserts the node's own wrapper element, so this had
   shipped unnoticed in round 1. Rebuilt to mirror core/starterkit's own structure (`<article
   {{ attributes }}>`, `title_prefix`/`title_suffix` preserved, content in a `content_attributes`-carrying
   wrapper), with only the field arrangement inside customised — confirmed live:
   `<article class="node node--type-song node--view-mode-full">` is back.

   The rail itself is now `i8_song_sidebar`, a plain block **plugin** (not `block_content`, unlike
   INT8-028's hero images) — the distinction matters and is recorded in the class's own docblock: there
   is no admin-editable content here at all, so a content entity would add a type with nothing to store.
   Composed straight from the existing SDC components via `#type => 'component'`
   (`Drupal\Core\Render\Element\ComponentElement`, core — no bespoke block template needed). Added a new
   `sidebar_second` region (`interstate_85.info.yml`), and gave `page.html.twig` a two-column
   `layout-content__row--with-rail` grid that activates only when `page.sidebar_second` actually has
   something in it — every other route keeps today's single-column layout untouched, verified live on
   `/songs`, `/user/login`. `sidebar_first` (already declared, populated nowhere on the site) was
   deliberately left exactly as it was rather than speculatively building the same treatment for a region
   nothing uses yet. The block is placed with an `entity_bundle:node` visibility condition scoped to
   `song`, generated via the entity API (`tooling/place-song-sidebar-block.php`, deleted after running)
   and exported.

   **One placement mistake, caught and fixed before export:** the block was first created before
   `sidebar_second` had been registered by a cache rebuild, so Drupal silently placed it in `header`
   instead of erroring; a second pass corrected the region. Also caught: the block's `status` was left
   `FALSE` by the initial `Block::create()` call and had to be explicitly enabled — the corrected
   one-shot script now sets `'status' => TRUE` directly, recorded so the mistake isn't repeated.

**Fixing #1 and #4 broke two existing test assertions, and a third needed widening — none from a defect
in the fix, each recorded rather than silently patched:**

- The FR-12 premise check that read `<main>`'s **rendered** text (`.innerText`, which reflects
  `text-transform`) against the fixture's stored mixed-case lyrics snippet no longer matched — the
  premise (are we on the right page?) doesn't care about case, so the comparison was made
  case-insensitive; FR-12's actual assertions (already case-insensitive regexes) are untouched.
- The FR-15 "no notes and no video" test used `QUOTE_SONG` ("Float On") specifically because it had
  neither at authoring time. The site owner's own edits for this review — a real video, real notes —
  made that no longer true, which is a desirable content change, not a bug. Swapped that one test's
  fixture to `BARE_SONG` ("Bukowski"), verified still lyrics-only.
- Both axe scans were written when `field_video` was empty across the whole dataset, so they had never
  actually reached a real embed. With "Float On" now carrying a real YouTube video, Axe (via CDP) reaches
  inside the iframe and reports violations in **YouTube's own player chrome** — third-party markup this
  project cannot fix. Both scans now `.exclude('.song-detail__video iframe')`; NFR-1 for the embed itself
  stays covered by the FR-17 test's iframe-title assertion, which does not exclude anything.

One pleasant side effect of the real data now existing: the FR-17 video test's strict positive branch
(real iframe, real dimensions, real title) now runs for real, permanently, rather than only via the
throwaway probe described in round 1's Notes — the round-1 statement that FR-17 stays
"built-but-unproven" is superseded by this.

**Verification.** Default gate green (58 PHPUnit, PHPCS — now 10 checks, one new class — PHPStan,
boundary). Full Playwright suite **89/89 on chromium**, all 17 song-page tests included. Config exported
(`interstate_85.info.yml`'s new region isn't itself config, but `block.block.interstate_85_songsidebar`
is); `drush cim -y` is a no-op.

**2026-07-26 — review round 2, follow-up on the sidebar restructure.** Three more issues from the same
review, all in `page.html.twig`/`app.css`, none touching the node template or the block itself.

1. **DOM order.** `sidebar_second` was rendering before `sidebar_first` — an artifact of `sidebar_second`
   living inside the new two-column row while `sidebar_first` stayed a separate sibling below it. Fixed
   by making both true siblings of `page.content` in one row, in reading order: first, then content,
   then second — so "first" now genuinely comes first in the markup.
2. **Asymmetric wrapping.** `page.content` had gained an extra `.layout-content__main` wrapper div that
   `sidebar_first` never had. Removed it — `page.content` prints bare again, exactly as it did before this
   region existed; only each sidebar's own `<aside>` landmark wraps anything, which was already how
   `sidebar_first` worked.
3. **The rail rendered detached from the main content, far down the page — a real bug, not a screenshot
   artifact.** Root cause: `page.sidebar_first` is truthy in Twig even with **no block placed in it** —
   Drupal still emits a render array (and, once printed, a bare `<div></div>`) for a declared, empty
   region, and a plain `{% if page.sidebar_first %}` treats that as content. This meant `<aside
   class="layout-sidebar-first">` had been rendering empty on **every page of the site** since the region
   was first declared (INT8-015) — harmless while invisible, but once the grid below had to count its
   children, it saw three grid items against two declared columns and auto-wrapped the third (the real
   rail) onto an implicit new row far below the tall main column. Fixed by testing actual rendered output
   instead of the region's raw truthiness: `page.sidebar_first|render|striptags|trim` — `|render|trim`
   alone was insufficient, because an empty region's output is literally `<div></div>` (non-whitespace
   characters `trim` alone won't remove); `striptags` is what reduces a truly empty region to nothing.
   Confirmed with real measurements, not assumption: `.quote-block` and `.song-sidebar` both now measure
   `top: 261` — the same row, genuinely aligned — where the rail had previously measured `top: 2797`.
   Also moved `padding-block` from `.song-detail` onto `.layout-content__row--with-rail` itself, so both
   columns share one top-offset declaration instead of only the main column having one (this alone still
   wouldn't have fixed the detached-row bug, but it is what "no margin like there was before" was
   additionally pointing at, and is the correct place for it now that the row genuinely holds both
   columns).

Verified with real screenshots at four widths (1024/980/1440/1920, plus 800/900/760) rather than trusting
the CSS math alone, since the previous round's reasoning about padding had missed the actual defect.
Default gate green; full Playwright suite **89/89 on chromium** (the empty-`<aside>` fix touches every
page on the site, not just the song page, and caused no regression anywhere).

**2026-07-26 — review round 3: the divider's colour and length.** Two more issues on the same
main/rail divider, both real, verified against the hi-fi source rather than assumed.

1. **Wrong colour.** Round 2 used `--color-line` (neutral grey), reasoning at the time that the hi-fi's
   actual divider colour (`#b9d3e3`) was an unnamed one-off not worth tokenising. Checking the hi-fi's
   raw HTML properly this time: `#b9d3e3` appears **three times** — the song page's main/rail split
   (twice, across the standard and MISSING FIELDS compositions) and the alternate-version lyric-pair
   split (INT8-020) — which is exactly the bar for a real, reusable token, not a one-off. Added
   `--i8-spindle` / `--color-line-accent` to `tokens.css` and `design-system.md` §2/§5 (a genuine
   token-extraction gap from Milestone 5, corrected now rather than perpetuated), and switched the
   divider to it. Checked its non-text contrast before adopting it (1.56:1 against white) against the
   already-shipped, already-Axe-clean `--color-line` (1.46:1, the filter bar's own border) — both sit
   below WCAG 1.4.11's 3:1 floor, consistent with treating a purely decorative panel divider as exempt,
   which is already this project's practice, not a new risk introduced here.
2. **Wrong length.** The divider (a `border-left` on the sidebar) stopped at the rail's own height
   instead of running the full column, because `.layout-content__row--with-rail` set
   `align-items: start` — which sizes each grid column to its own content height rather than the row's.
   Switched to grid's default (`stretch`), so the shorter column's box now matches the taller one's
   height and the border runs the full length. Verified by measuring both columns' real rendered
   heights (they now match) and with a full-page screenshot, not by CSS inspection alone.

Gate green; full Playwright suite 89/89 on chromium (this touches only the shared divider treatment;
no other page uses `.layout-content__row--with-rail` yet).
