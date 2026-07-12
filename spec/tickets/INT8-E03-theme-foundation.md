---
id: INT8-E03
title: Theme foundation
type: epic
status: todo
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
  section labels), primary nav, a minimal front page.
- **Out of scope:** the homepage composition (design-only this slice); the Songs-section screens (E04).

## Success criteria
All children done; header/footer/nav render per `1B.dc.html`, responsive to 320px, WCAG 2.1 AA (Axe
clean); components consume `tokens.css` (no hardcoded values).

## Children
- INT8-015 — Base layout + header + footer (SDC)
- INT8-016 — Shared atoms / molecules
- INT8-017 — Primary nav + front-page/route wiring

## References
- spec/design/design-system.md §1 (build-from), §3 (components)
- spec/design/…/Interstate-8 1B.dc.html (canonical visual)
- spec/wireframes/overview.md §3 (shared layout)
