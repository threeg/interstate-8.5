---
id: INT8-015
title: Base layout + header + footer (SDC)
type: task
status: todo
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-005]
implements: [FR-16, NFR-1, NFR-2]
tests_required: true
estimate: 3
---

## In plain English
Build the top and bottom of every page — the Interstate-8 header with navigation (see-through over the
homepage photo, solid everywhere else) and the footer — so the whole site shares one consistent frame.

## Background
Design-system §3 (Header/nav, Footer); canonical `Interstate-8 1B.dc.html` (HEADER · TRANSPARENT / ·
SOLID, FOOTER components); wireframes overview §3.

## Technical requirements
- **Header SDC** with two variants: **transparent** (over hero, homepage pre-scroll) and **solid**
  (scrolled + all secondary pages). Wordmark + "8" route-shield mark + primary nav; active-item accent.
- **Footer SDC** — secondary menu (About/Contact/Support/Legal/Privacy) + © + disclaimer.
- Page template wires header/footer around the main region; scroll → solidify behaviour (minimal JS /
  Drupal behaviour).
- Consume `tokens.css` (no hardcoded values); semantic landmarks, one `<h1>` per page, heading order,
  visible focus (NFR-1); responsive to 320px (NFR-2).

## Definition of done (acceptance criteria)
- [ ] Header (both states) + footer render per `1B.dc.html`; nav marks the current section (FR-16 framing).
- [ ] Playwright + Axe pass on a page shell at 320px + desktop (no serious/critical a11y violations).
- [ ] Tokens-only styling; no hardcoded hex/px.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. Playwright: header state switch + nav present + keyboard/focus; Axe on the
shell (NFR-1); responsive assertion at 320px (NFR-2). Test strategy §7.
