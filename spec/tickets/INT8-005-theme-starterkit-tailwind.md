---
id: INT8-005
title: Owned theme from starterkit + Tailwind v4 + tokens.css
type: task
status: todo
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
- [ ] The owned theme is default; `lando npm run watch`/build compiles Tailwind + tokens.
- [ ] A trivial SDC component renders using `var(--…)` tokens (proves the token pipeline).
- [ ] `config/sync` updated (theme settings) and committed.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **build-plumbing / pure-styling.** Verified by the theme building and a
token-driven component rendering; behavioural/visual tests come with the components that use it
(INT8-015+).
