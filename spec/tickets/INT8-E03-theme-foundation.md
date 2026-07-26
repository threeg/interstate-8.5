---
id: INT8-E03
title: Theme foundation
type: epic
status: done
milestone: 9
batch: theme
layer: theme
depends_on: []
implements: []
tests_required: false
estimate: 5
---

## In plain English
Build the reusable visual furniture every page shares — the header, the footer, the buttons, links and
controls — so each screen looks like Interstate-8 and is built once, not re-invented per page.

## Summary
Delivers the shared theme layer from the signed-off design: header (transparent + solid), footer, the
shared SDC atoms/molecules, primary navigation and a minimal navigable front page. Built against
`tokens.css` and the canonical hi-fi (`Interstate-8 1B.dc.html`).

## Scope
- **In scope:** header/footer SDC, shared atoms/molecules (buttons, links, filter controls, hero,
  section labels), the full-width **page-header hero region + block** (route-aware; placed per page),
  primary nav, a minimal front page.
- **Out of scope:** the homepage composition (design-only this slice); the Songs-section screens (E04).

## Success criteria
All children done; header/footer/nav render per `1B.dc.html`, responsive to 320px, WCAG 2.1 AA (Axe
clean); components consume `tokens.css` (no hardcoded values).

## Children
- INT8-015 — Base layout + header + footer (SDC)
- INT8-016 — Shared atoms / molecules
- INT8-017 — Primary nav + front-page/route wiring
- INT8-027 — Header nav hover/focus states, slogan visibility, mobile-menu styling (design-sync corrections)
- INT8-028 — Page-title hero block in a full-width page-header region (random media background) (re-homed from E04; replaces the core page-title block site-wide except the homepage)
- INT8-031 — Keep the primary nav's current-section marking across the whole Songs section

> **2026-07-26 — closed.** INT8-027 and INT8-031 were both added to this epic after it was written
> (each raised during review of an earlier ticket) and are recorded here now so the child list is a
> complete record rather than the original plan. All six children are `done`.

## References
- spec/design/design-system.md §1 (build-from), §3 (components)
- spec/design/…/Interstate-8 1B.dc.html (canonical visual)
- spec/wireframes/overview.md §3 (shared layout)
