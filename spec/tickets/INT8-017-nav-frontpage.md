---
id: INT8-017
title: Primary nav + front-page/route wiring
type: task
status: todo
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-015]
implements: [FR-16]
tests_required: true
estimate: 2
---

## In plain English
Wire up the site's main menu and give it a simple front page, so visitors can actually get to the Songs
section — without building the full homepage yet.

## Background
The homepage is **design-only** this slice (wireframes overview §1). This ticket provides a minimal
navigable front page and the primary menu so nav resolves (FR-16).

## Site-building steps (operator) — terse
1. Primary menu items for the intended IA (Home, Tour, Songs, Discography, Band, News); only **Home** and **Songs** resolve this slice — others may be present-but-unlinked or omitted (design shows them).
2. Set a **minimal front page** (a simple page/route) — not the full homepage composition.
3. `ddev drush cex -y` → commit (menu + site front page config).

## Technical requirements
- Nav rendered by the header SDC (INT8-015); active-section marking works.
- Home + Songs routes resolve; unknown routes 404. Minimal front page only.

## Definition of done (acceptance criteria)
- [ ] Primary nav resolves Home + Songs; front page loads; menu config exported.
- [ ] Playwright: nav from front page → `/songs` works; Axe clean on the front page.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. Playwright asserts nav → Songs (FR-16) + a11y on the front page. Menu/front-page
config is site-building — **Claude verifies** the exported config.
