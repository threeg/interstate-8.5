---
id: INT8-005
title: Owned theme from starterkit + Tailwind v4 + tokens.css
type: task
status: done
milestone: 8
batch: scaffolding
layer: theme
depends_on: [INT8-002]
implements: []
tests_required: false
estimate: 3
---

## In plain English
Create our own site theme and wire up the styling system so the design's colours, fonts and spacing
come from one shared file — the foundation every page's look is built on.

## Background
Own the theme (FE proposal): starterkit-generated, SDC as the component layer, Tailwind v4 hand-wired
(CSS-first `@theme`, no SASS), design tokens as CSS custom properties.

## Technical requirements
- Generate an owned theme via the core **starterkit** generator (not a subtheme of Olivero, not a contrib base).
- Wire **Tailwind v4** (CSS-first `@theme`; Vite or the Tailwind CLI → compile into the theme → attach via `libraries.yml`). Plan the **safelist** for classes only present in config/CKEditor (FE proposal wrinkle).
- Import **`spec/design/tokens.css`** as the token layer; Tailwind `@theme` and SDC CSS read from it. **No hardcoded hex/px** in components.
- Set the theme as default (front end); base body/type from the tokens (Oswald/Lora/system-ui).
- SDC enabled; component directory scaffolded.

## Definition of done (acceptance criteria)
- [x] The owned theme is default; `lando npm run watch`/build compiles Tailwind + tokens.
- [x] A trivial SDC component renders using `var(--…)` tokens (proves the token pipeline).
- [x] `config/sync` updated (theme settings) and committed.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **build-plumbing / pure-styling.** Verified by the theme building and a
token-driven component rendering; behavioural/visual tests come with the components that use it
(INT8-015+).

## Notes
2026-07-12 — Scaffolded `web/themes/custom/interstate_85/` from scratch (core `generate-theme` script
incompatible with recommended-project vendor layout; manual scaffold is equivalent). Added a `node:22`
Lando service and `npm` tooling (dir: /app/web/themes/custom/interstate_85) to `.lando.yml`. Installed
Tailwind v4.3.2 (`tailwindcss` + `@tailwindcss/cli`). `css/app.css` imports `spec/design/tokens.css`
then `@import "tailwindcss"` with base typography wired to token variables. Compiled output committed
at `css/build/app.css` so fresh checkouts work without running npm. Proof-of-pipeline SDC component:
`components/site-badge/` renders the route-shield mark: transparent fill, `2.5px solid var(--color-accent-alt)`
border, `var(--radius-shield)` shape, `var(--font-display)` Oswald — all tokens, no raw hex/px. New
`--badge-w`, `--badge-h`, `--fs-badge` tokens added to `spec/design/tokens.css` for the component
dimensions (matching the desktop reference in the hi-fi). Theme set as default front-end (admin stays
Gin). **Sanity test:** `lando npm run build` → "Done in ~300ms"; visit the site front end and
confirm: site-branding block shows the polo-blue shield outline with "8" in Oswald, plus Lora body
text and the dark-canvas page background.

2026-07-28 — **Correction (INT8-034).** The claim above that the manual scaffold "is equivalent" to
the core `generate-theme` script was wrong. `base theme: false` was carried over correctly (that part
*is* equivalent), but the starterkit generator's defining behaviour is that it also **copies its ~84
templates into the theme** — the manual scaffold skipped that step, leaving `templates/` with only the
few hand-added overrides and everything else falling through to core's module-level templates. This
went unnoticed until INT8-031's investigation ran into a missing `menu-item--active-trail` hook.
INT8-034 restored the one template with genuine state-bearing markup (`templates/menu.html.twig`) and
recorded the full gap — measured, not assumed (77 of 84 templates differ in content from the module
fallback, 7 have no fallback at all) — in `spec/architecture/architecture.md` §2.5's provenance
paragraph, which is now the authoritative record. `base theme: false` itself remains correct and
unchanged.
