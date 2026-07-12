---
id: INT8-014
title: Migration verification (counts / spot-checks / rollback)
type: task
status: todo
milestone: 9
batch: migration
layer: migration
depends_on: [INT8-013]
implements: [FR-5, NFR-3]
tests_required: true
estimate: 2
---

## In plain English
Prove the import worked — the same number of songs came across, a sample looks right, and it can be
safely re-run or undone.

## Background
Test strategy §4: verify the outcome rather than re-test Migrate.

## Technical requirements
- A documented `drush` (or small Kernel test) that asserts imported `song` count == source active `I8_Songs` count (FR-5).
- Spot-checks: a sample of songs correctly map name, lyrics (cleaned), notes, quotes, video, type, parent ref, `Song_Live`, `field_legacy_id`.
- Idempotency + rollback assertions (FR-4/NFR-3): re-import creates no dupes; `migrate:rollback` removes cleanly.

## Definition of done (acceptance criteria)
- [ ] Count-parity check passes; spot-checks green; idempotency + rollback verified.
- [ ] The verification command/test is documented and part of the suite.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. The verification IS the deliverable (a Kernel test or a documented `drush`
check per §4). Covers **FR-5** and the **NFR-3** idempotency/rollback guarantee.
