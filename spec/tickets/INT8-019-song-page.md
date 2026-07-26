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
