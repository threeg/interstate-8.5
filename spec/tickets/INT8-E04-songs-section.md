---
id: INT8-E04
title: Songs section (landing + song page)
type: epic
status: todo
milestone: 9
batch: theme
layer: theme
depends_on: []
implements: []
tests_required: false
estimate: 8
---

## In plain English
The part visitors actually use: browse the whole song catalogue with filters, and open any song to
read its lyrics, notes and video — including the side-by-side view for alternate versions.

## Summary
Delivers the two built screens on the migrated data and the theme foundation: the Songs landing (View
+ filters + ledger) and the Song page (content + video + version side-by-side), plus the Playwright +
Axe end-to-end capstone.

## Scope
- **In scope:** Songs landing, Song page (all three variants), the FR-8 sort mechanism, and the e2e/a11y
  capstone.
- **Out of scope:** release/setlist/tab/studio display (FR-14, later slices); the homepage.

## Success criteria
All children done; the landing and song page satisfy FR-6–FR-20 and pass the Playwright + Axe suite at
320px and desktop.

## Children
- INT8-018 — Songs landing (View + filters + ledger)
- INT8-019 — Song page (view mode + Twig + video)
- INT8-020 — Song versions (side-by-side lyrics + links)
- INT8-021 — E2E capstone (Playwright + Axe)

## References
- spec/wireframes/02-songs-landing.md, 03-song-page.md
- spec/requirements/requirements.md §4.2–§5 (FR-6–FR-20)
- spec/architecture/api-contract.md §2 (routes)
- spec/test-strategy/test-strategy.md §7 (FE testing)
