---
id: INT8-016
title: Shared atoms / molecules
type: task
status: todo
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
- [ ] The listed atoms/molecules exist as SDC, styled from tokens, matching `1B.dc.html`.
- [ ] Each renders in isolation (SDC preview) with its states.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **pure-styling** (presentational components; no numbered-requirement
behaviour). Their behaviour is exercised where used — the filter controls in INT8-018, the quote/hero in
INT8-019 — under Playwright + Axe. Visual correctness verified against `1B.dc.html`.
