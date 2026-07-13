---
id: INT8-021
title: E2E capstone (Playwright + Axe)
type: task
status: todo
milestone: 9
batch: theme
layer: tooling
depends_on: [INT8-018, INT8-019, INT8-020]
implements: [NFR-1, NFR-2, NFR-7, NFR-8]
tests_required: true
estimate: 3
---

## In plain English
One final pass that drives the finished Songs section like a real visitor across browsers and phone
sizes — proving it works end to end and is accessible — before we call the slice done.

## Background
Reconciles the assembled screens (test strategy §7/§9). The per-screen tickets carry their own tests;
this consolidates the journeys, the a11y sweep, and the browser/responsive matrix.

## Technical requirements
- Playwright **journeys**: front page → `/songs` → filter → open a song → open its alternate version.
- **Axe** on the landing and song page: no serious/critical WCAG 2.1 AA violations (NFR-1).
- **Responsive** run at **320px** and desktop (NFR-2); **browser matrix** per the Playwright project
  config (NFR-8).
- Wire into `lando playwright` / `lando test-all` (milestone-completion gate).

## Definition of done (acceptance criteria)
- [ ] The journey suite passes; Axe clean on both screens (NFR-1).
- [ ] 320px + desktop pass (NFR-2); the configured browser matrix runs (NFR-7/NFR-8).
- [ ] `lando test-all` green (default gate + Playwright).
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. This ticket **is** the e2e/a11y verification. Confirms the assembled slice
against NFR-1/2/7/8. Test strategy §7, §9.
