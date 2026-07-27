---
id: INT8-027
title: Header nav hover/focus states, slogan visibility, and mobile-menu styling (design-sync corrections)
type: task
status: done
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-015]
implements: [FR-16, NFR-1]
tests_required: true
estimate: 2
---

## In plain English
The design file was updated with clearer pictures of things the header already needed — a hover state
that looks different from "current section", a visible keyboard-focus ring, and how the mobile menu
should really look — plus a correction that the site slogan should show on every header, not just the
homepage one. This ticket brings the already-built header up to date with that clearer picture.

## Background
`spec/design/interstate-8-design-refinement/project/Interstate-8 1B.dc.html` was refreshed on
2026-07-21 (design-system.md decisions log, 2026-07-21 entry) specifically to close gaps found while
building INT8-015. INT8-015 is already `done`; this ticket corrects its shipped
`site-header`/`block--system-branding-block` output against the clarified spec. No new component is
introduced — this is CSS/markup-only work on files INT8-015 already created.

## Technical requirements
Four independent fixes, all in `web/themes/custom/interstate_85/components/site-header/` and
`block--system-branding-block.html.twig`:

1. **Slogan visibility.** Currently `.site-branding__slogan` is hidden on `.site-header--solid`
   unconditionally. Per the corrected spec it must show on **both** header variants at ≥`--bp-nav`
   (760px), and hide only below that (the mobile ☰ bar has no room for it). Replace the
   `.site-header--solid .site-branding__slogan` rule with a `@media (max-width: 759px)` hide.
2. **Nav hover ≠ current.** Split the combined `:hover, .is-active, [aria-current="page"]` rule so
   hover gets its own, distinct treatment (design-system.md §3, Header/nav row):
   - Solid: hover = `--color-accent` text (unchanged) + `--color-accent-alt` (Polo Blue) underline —
     current stays `--color-accent` text + `--color-accent` underline.
   - Transparent: hover = `--color-nav-hover-on-transparent` (new token, Ice `#cfe3ee`) text +
     `--color-accent-alt` underline — current stays unchanged white text + `--color-accent-alt`
     underline (no change to current's existing rule).
3. **Focus ring.** No focus-visible styling exists anywhere in the theme today. Add a `:focus-visible`
   rule for the nav links, the mobile toggle button, and the branding link using the new
   `--focus-ring-*` tokens (`tokens.css`): `2px solid var(--focus-ring-color)` (offset
   `var(--focus-ring-offset)`) on the solid header, `var(--focus-ring-color-on-dark)` on the
   transparent header.
4. **Mobile nav open panel.** Rework `.site-header__nav.is-open`'s markup/CSS from a gap-separated flex
   column to match the hi-fi's "HEADER · MOBILE — OPEN" panel: full-width rows (`padding: 14px 24px`),
   a `border-bottom: 1px solid` divider between rows, and the current item marked with a `3px solid`
   left-border accent instead of the desktop underline treatment (which doesn't read well as a
   full-width row).

## Definition of done (acceptance criteria)
- [x] Slogan renders on the solid header at ≥760px in a Playwright check (previously asserted absent —
      that assertion inverts).
- [x] Nav hover and current-section render with visibly different underline colours (solid: hover =
      Polo Blue, current = teal; transparent: hover = Ice, current = white) — new Playwright assertions
      alongside the existing hover/active tests in `page-shell.spec.ts`.
- [x] Keyboard `Tab` to a nav link, the toggle button, and the branding link each show a visible focus
      ring; asserted via computed `outline`/`box-shadow` in Playwright.
- [x] Mobile nav open panel matches the hi-fi's row/divider/left-border pattern at 320px.
- [x] Tokens-only styling; no hardcoded hex/px (two literal px values kept, documented — see Notes).
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. Extends `tests/playwright/tests/page-shell.spec.ts`: new assertions for
slogan-at-desktop, hover-vs-current colour divergence (both variants), focus-visible outline on the
three affected elements, and mobile-menu row/divider structure at 320px. Axe re-run to confirm the new
focus rings don't regress contrast (NFR-1).

## Notes
2026-07-25 — All four corrections applied to `site-header.css`; no new files, no markup change beyond
what the mobile-panel rework needed (still the same `site-header.twig`/`block--system-branding-block.html.twig`
from INT8-015).

**Independent test authorship.** The failing Playwright assertions (extending
`tests/playwright/tests/page-shell.spec.ts`) were written by a separate model from this ticket +
`design-system.md` §3/§4 + `requirements.md` (FR-16, NFR-1) only, before any CSS changed, per this
project's independent-authorship split. Given only the CURRENT (pre-fix) DOM/class names from INT8-015 —
not this ticket's planned fix — so the assertions target real selectors without being shaped to the
implementation. Confirmed red for the right reasons before implementing: the slogan locator found no
element, the hover/current underline colours were identical (`rgb(63, 124, 160)` on both), and mobile
rows measured 34px wide against an expected ≥258px (a gap-separated column, not full-width rows).
Deliberately **not covered**: the transparent header variant — no reachable route renders
`data-header-variant="transparent"` in this slice (the homepage hero is design-only), so its hover/
current/focus colours can't be honestly asserted against a live page; the CSS was still corrected per
spec (§2/§3 below), just not exercised by an automated test until a route renders it.

1. **Slogan visibility.** Replaced the unconditional `.site-header--solid .site-branding__slogan {
   display: none }` with nothing at the base level (shown by default on both variants) and a
   `.site-branding__slogan { display: none }` rule inside the existing `@media (max-width: 759px)`
   block. Also removed the `.site-header--transparent.is-scrolled` hide — the corrected spec is "every
   desktop/tablet width," which includes the solidified-on-scroll state.
   **A real, separate bug found underneath this one:** the slogan `<span>` never rendered at all,
   regardless of CSS — `block--system-branding-block.html.twig`'s `{% if site_slogan %}` guard was
   never true because `system.site.slogan` had never actually been set (`drush config:get system.site
   slogan` → `''`). Set it via `drush config:set system.site slogan "A Modest Mouse Fan Collaborative"
   -y` (matching every instance of the slogan text in `1B.dc.html`) and exported
   (`config/sync/system.site.yml`); `drush cim -y` confirms no drift. This is a config/content gap, not
   a CSS one — worth recording since "the CSS looked right" would not have been enough to close this
   ticket.
2. **Nav hover ≠ current.** Split the combined selector into two: `.site-header__nav
   a:not(.is-active):not([aria-current="page"]):hover` (Polo Blue underline, `--color-accent-alt`) and
   `.site-header__nav .is-active, .site-header__nav a[aria-current="page"]` (teal underline, unchanged).
   The `:not()` qualifiers make current always win over hover on the same link — hovering the page
   you're already on keeps its current styling rather than flickering to the hover treatment — rather
   than leaving that to selector-specificity/source-order coincidence. Mirrored for
   `.site-header--transparent` using the new `--color-nav-hover-on-transparent` (Ice) token already
   added to `tokens.css` in the design-sync phase.
3. **Focus ring.** Added `:focus-visible` rules for `.site-header__nav a`, `.site-header__toggle`, and
   `.site-branding__link` (the wordmark), using `--focus-ring-width`/`--focus-ring-color`/
   `--focus-ring-offset`, with a `--focus-ring-color-on-dark` override scoped to
   `.site-header--transparent:not(.is-scrolled)` so the ring reverts to the light-surface colour once
   the header solidifies on scroll. (The three affected elements already had SOME visible ring via
   browser user-agent defaults, since nothing had ever set `outline: none` — so the "does a ring exist"
   half of the acceptance criteria was technically already met; this still replaces the default with
   the spec's actual token-driven ring, which the DoD's own wording asks for explicitly.)
4. **Mobile nav open panel.** Reworked from a gap-separated flex column to the hi-fi's row/divider/
   left-border pattern: panel padding moved from the `<nav>` onto each `<li>` (`padding: 14px
   var(--space-6)`, full-width rows), `border-bottom: 1px solid var(--color-line)` between rows (omitted
   on the last), and the current item's row gets `border-left: 3px solid var(--color-accent)` (with
   `padding-left` reduced by the same 3px so content doesn't shift) via `li:has(.is-active),
   li:has(a[aria-current="page"])`, replacing the desktop's `border-bottom` underline, which is
   explicitly zeroed out on the `<a>` inside this media query. `:has()` is supported by every current
   browser in the project's matrix (NFR-8).
   **Two literal px values, not tokens** (`14px` row padding, `3px` border): both are copied verbatim
   from the hi-fi's own "HEADER · MOBILE — OPEN" panel spec; no existing spacing/border-width token
   lands on either value, and inventing one-off tokens for values that don't recur elsewhere would be
   ceremony, not clarity — same call already made for the song ledger's group-header spacing
   (INT8-018/029).

**A contrast regression caught by Axe, fixed before closing:** making the slogan visible on the solid
header exposed that `.site-branding__slogan` was still `color: var(--color-surface)` (white)
unconditionally — correct for the transparent header's dark photo background, but white-on-white
(effectively) on the solid header, failing Axe outright (1.32:1 measured, 4.5:1 required). Split into a
base rule using `--color-fg-muted` (proven-compliant elsewhere, e.g. the Songs landing filter labels)
and a `.site-header--transparent .site-branding__slogan` override keeping the original white +
text-shadow treatment, matching the existing `.site-branding__name` pattern one rule above it.

Default gate green (10 PHPUnit, PHPCS/PHPStan clean, boundary check 0 violations — CSS/config-only
change, no PHP touched). `lando playwright`: 128/128 passing on chromium, webkit, mobile-chrome and
mobile-safari (Firefox fails across every spec file in the suite, not just this one — the pre-existing
`pw`-service binary gap noted in INT8-018, unrelated to this ticket). Config exported
(`system.site.yml`); `lando drush cim -y` no-op.

2026-07-25 (revision, user feedback) — The slogan rendered in its natural case
("A Modest Mouse Fan Collaborative") rather than the all-caps treatment the hi-fi actually uses (its
markup types the string in caps directly, e.g. `A MODEST MOUSE FAN COLLABORATIVE`). Added
`text-transform: uppercase` to `.site-branding__slogan` — the underlying `system.site.slogan` config
value stays natural-case; this is a display transform only, the same split `.site-branding__name`/
`.site-header__nav` already use one rule above it. Extended the existing "wordmark and nav render
uppercase" Playwright test (now also asserting the slogan) rather than adding a parallel test, and
pinned it to a desktop viewport since the slogan is hidden below 760px. Default gate and
`lando playwright` re-run clean (128/128, same Firefox gap as before, unaffected).

**Summary:** the header now matches the refreshed hi-fi on all four points — the slogan shows
everywhere it should (and now has real text to show), hovering a nav item no longer looks identical to
being on that page, every keyboard-focusable header control shows a real focus ring, and the mobile
menu opens as a proper full-width list with a left-border current indicator instead of a loose column
of links.

**Sanity test:** `curl -s http://interstate-8-5.lndo.site/user/login | grep -c 'site-branding__slogan'`
→ `1`; `lando drush cim -y` → "There are no changes to import."

**2026-07-27 — correction (INT8-036).** The "Firefox gap" noted above was misdiagnosed: the real cause
was a dangling profile-lock symlink left by a process killed on 2026-07-20, not a missing binary or a
scaffolding-era gap (INT8-006 itself records Firefox passing). Fixed in INT8-036; the full matrix is now
545/545 with Firefox included.

## QA steps
- [x] Visit `/user/login` at desktop width — "A MODEST MOUSE FAN COLLABORATIVE" shows under the
      wordmark, in muted grey (not white-on-white).
- [x] Hover a primary-nav link that is *not* the current page — its underline turns Polo Blue while the
      text stays teal; this reads as clearly different from the current-page link's teal underline.
- [x] Tab through the header with the keyboard — the wordmark, each nav link, and (below 760px) the ☰
      toggle each show a visible focus ring as you land on them.
- [x] At 320px, open the ☰ menu — each item is a full-width row with a divider line below it (none
      below the last), and the current-page item has a left accent bar instead of an underline.
- [x] Resize to 320px — the slogan disappears from the mobile bar; resize back up — it reappears.
