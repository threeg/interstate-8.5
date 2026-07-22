---
id: INT8-016
title: Shared atoms / molecules
type: task
status: done
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-005]
implements: []
tests_required: false
estimate: 3
---

## In plain English
Make the small reusable building blocks — buttons, links, the filter controls, the photo hero, section
labels — once, so the song screens just assemble them.

## Background
Design-system §3 (Button/CTA, Link, Filter bar controls, Hero, section labels) + the token panel; the
canonical `1B.dc.html` COMPONENTS section. The 2026-07-21 design-export refresh (design-system.md
decisions log) added precise reference panels worth building straight from: **FILTER BAR — HOVER /
FOCUS / OPEN** (exact hover/focus colours for the Type select, Show/Hide toggle, APPLY button),
**"COMING SOON" STUB — precision reference** (exact border/opacity/label spec, reusable wherever a
not-yet-built field renders), and the universal **FOCUS RING** panel (governs every control this
ticket builds, not just nav — see design-system.md §4).

## Technical requirements
- SDC components with states from design-system §3: **Button/CTA** (primary teal, polo-blue CTA;
  default/hover/disabled), **Link** (accent + inline), **Select / segmented toggle** (default/focus/disabled),
  **Hero** (band + page-title variants), **section label**, **quote block**.
- All consume `tokens.css` (no hardcoded values). Labelled, keyboard-operable controls (NFR-1 groundwork).
- Documented in the theme's SDC library so INT8-018/019 assemble them.

## Definition of done (acceptance criteria)
- [x] The listed atoms/molecules exist as SDC, styled from tokens, matching `1B.dc.html`.
- [x] Each renders in isolation (SDC preview) with its states.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **pure-styling** (presentational components; no numbered-requirement
behaviour). Their behaviour is exercised where used — the filter controls in INT8-018, the quote/hero in
INT8-019 — under Playwright + Axe. Visual correctness verified against `1B.dc.html`.

## Notes
2026-07-21 — Built seven SDC components under
`web/themes/custom/interstate_85/components/`, covering the six listed atoms/molecules (Select and
Segmented toggle are separate components since they're structurally distinct controls):

- **`button`** — `primary` (teal), `cta` (polo-blue), `outline` (teal border/transparent fill — the
  SONGS LANDING · EMPTY state's "CLEAR FILTERS" is the only instance of this variant in the file).
  Renders `<a>` when `href` is set (and not disabled), else a real `<button>`.
- **`link`** — `action` (teal, underline on hover — "MORE →", "SHOW MORE →", the alternate-version
  parent cross-link) and `inline` (slate text, Corduroy-coloured underline — "setlist ref"-style
  in-prose links). True links embedded inside rendered rich text still use the theme's base `a` styles
  (INT8-015); this component is for discrete, templated links only.
- **`select-field`** / **`segmented-toggle`** — the Type filter select and the Alternate-titles
  Show/Hide toggle, states from the new FILTER BAR — HOVER/FOCUS/OPEN panel.
- **`hero`** — `band` (homepage-only, centred title — built ready but unexercised until the homepage
  ships, matching site-header's transparent-variant precedent from INT8-015) and `page-title`
  (secondary pages, bottom-left title). Image is a slot so the component doesn't care whether the
  caller passes a raw `<img>` or a Drupal responsive-image render array. Height is set by
  `--hero-height-band`/`--hero-height-page`; per-page heights vary across the hi-fi's own mockups
  (110–190px for page-title depending on breakpoint/screen), so callers override the custom property
  on the wrapping element rather than the component hardcoding one height per screen.
- **`section-label`** — `default` (regular weight, Corduroy — "LYRICS", "TYPE") and `muted` (bold, Ash
  grey — "MORE ABOUT THIS SONG", the coming-soon stub's field label); these two read different weights
  in the file itself, not just different colours.
- **`quote-block`** — the song-page pull quote; attribution is part of the quote slot's own text,
  matching every instance in the file (a single line ending "— Isaac Brock"), not a separate `<cite>`.

**New tokens** (`spec/design/tokens.css`, `design-system.md` §2): `--color-fg-disabled` (Ash `#9aa4a1` —
coming-soon stub / muted labels), `--color-field-hover` (Frost `#f4f8fa` — select hover fill),
`--color-toggle-hover` (Dove `#c7cbca` — unselected toggle option on hover), `--color-fg-quote`
(`#455250` — quote-block text), `--hero-height-band`/`--hero-height-page`. Also corrected a
pre-existing design-system.md inaccuracy while building `link`: the Link row's "inline text" underline
was logged as Pumice on 2026-07-11, but the DESIGN TOKENS panel's own swatch uses Corduroy `#5e6b68` —
fixed to match the source.

**Two states with no swatch anywhere in the file**, resolved by applying the file's own general rules
mechanically rather than inventing new colours: the `cta` button variant's hover (no "SUBMIT IT hover"
example exists) uses `filter: brightness(.88)` — the documented "~12% darker" rule from BUTTON STATES,
applied as a computed effect instead of a guessed hex; the `outline` button variant's hover (no
"CLEAR FILTERS hover" example exists) reuses `--color-tint`, the file's own established "hover = light
fill" idiom already used identically by the Song Ledger row's hover state.

**Verification** (`tests_required: false`, pure-styling exemption): compiled `lando npm run build`
clean; `lando drush cache:rebuild` confirmed SDC discovery of all seven components with no errors; each
rendered in isolation via a throwaway `drush php:eval` (`#type: component` render array per component,
covering every variant/state — button ×4, link ×2, select-field, segmented-toggle, hero ×2,
section-label ×2, quote-block), output inspected for correct markup/classes, not committed. Default
gate green (10 PHPUnit, PHPCS/PHPStan clean, boundary check 0 violations).

**Sanity test:** `lando drush cache:rebuild && lando npm run build` — both succeed with no errors,
confirming every component.yml/twig/css file is valid and discoverable.
