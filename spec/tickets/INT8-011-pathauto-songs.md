---
id: INT8-011
title: Pathauto pattern for songs
type: task
status: in-review
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
- [x] Song aliases generate as `/songs/<slug>`; exported and committed.
- [x] `lando drush cim` is a no-op.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **config (site-building).** **Claude verifies** the exported `pathauto.pattern`
against `api-contract.md` §2.2. End-to-end URL behaviour is asserted in the Playwright suite (INT8-019/021).

## Notes
2026-07-19 — Created the `song` Pathauto pattern (`canonical_entities:node`, pattern
`/songs/[node:title]`, selection condition `entity_bundle:node` scoped to bundle `song`) via the entity
API — the condition plugin id is `entity_bundle:node`, not `node_type` (first attempt errored;
`ConditionManager` listed the valid ids). Global Pathauto settings (already installed with INT8-003)
already have transliteration and lowercasing on, so nothing extra was needed there. Verified two ways
against the real running site, not just config inspection: (1) created a throwaway `song` node titled
"Ocean Breathes Salty" and confirmed the generated alias is exactly `/songs/ocean-breathes-salty`, then
deleted the node; (2) `curl`'d `/songs/no-such-song` against the Lando site and confirmed a real 404.
Exported config; `lando drush cim -y` no-op; default gate passes clean. **Sanity test:** `lando drush
cim -y` → "There are no changes to import"; creating a Song node produces a `/songs/<slug>` alias.
