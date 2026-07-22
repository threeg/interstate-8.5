---
id: INT8-027
title: Header nav hover/focus states, slogan visibility, and mobile-menu styling (design-sync corrections)
type: task
status: todo
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
- [ ] Slogan renders on the solid header at ≥760px in a Playwright check (previously asserted absent —
      that assertion inverts).
- [ ] Nav hover and current-section render with visibly different underline colours (solid: hover =
      Polo Blue, current = teal; transparent: hover = Ice, current = white) — new Playwright assertions
      alongside the existing hover/active tests in `page-shell.spec.ts`.
- [ ] Keyboard `Tab` to a nav link, the toggle button, and the branding link each show a visible focus
      ring; asserted via computed `outline`/`box-shadow` in Playwright.
- [ ] Mobile nav open panel matches the hi-fi's row/divider/left-border pattern at 320px.
- [ ] Tokens-only styling; no hardcoded hex/px.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. Extends `tests/playwright/tests/page-shell.spec.ts`: new assertions for
slogan-at-desktop, hover-vs-current colour divergence (both variants), focus-visible outline on the
three affected elements, and mobile-menu row/divider structure at 320px. Axe re-run to confirm the new
focus rings don't regress contrast (NFR-1).
