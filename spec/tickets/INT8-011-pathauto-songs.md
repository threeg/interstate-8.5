---
id: INT8-011
title: Pathauto pattern for songs
type: task
status: todo
milestone: 9
batch: config
layer: config
depends_on: [INT8-010]
implements: [FR-16]
tests_required: false
estimate: 1
---

## In plain English
Give every song a tidy, readable web address like `/songs/ocean-breathes-salty` instead of a number.

## Background
`api-contract.md` §2.2 (song route `/songs/<slug>`); stack proposal (Pathauto + Redirect for the path
map). The legacy-URL redirects themselves are the **SEO slice** — this ticket only sets the new pattern.

## Site-building steps (operator) — terse
1. Pathauto pattern for `song` nodes: **`/songs/[node:title]`**.
2. Confirm the Songs landing lives at **`/songs`** (View path set in INT8-018).
3. `lando drush cex -y` → commit.

## Technical requirements
- Alias pattern `/songs/[node:title]`; transliteration/dedupe on. Unknown slug → 404 (api-contract §2.2).
- No legacy redirects here (SEO slice).

## Definition of done (acceptance criteria)
- [ ] Song aliases generate as `/songs/<slug>`; exported and committed.
- [ ] `lando drush cim` is a no-op.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **config (site-building).** **Claude verifies** the exported `pathauto.pattern`
against `api-contract.md` §2.2. End-to-end URL behaviour is asserted in the Playwright suite (INT8-019/021).
