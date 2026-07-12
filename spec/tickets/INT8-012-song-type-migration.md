---
id: INT8-012
title: Song type migration (I8_SongType → terms)
type: task
status: todo
milestone: 9
batch: migration
layer: migration
depends_on: [INT8-004, INT8-008]
implements: [FR-1]
tests_required: true
estimate: 2
---

## In plain English
Copy the song categories from the old database into the new site so songs can be filed under the right
group.

## Background
Ports the v3 SongType source plugin. `content-model.md` §8 mapping; architecture §4.1. Depends on the
legacy DB (INT8-004) and the vocabulary (INT8-008).

## Technical requirements
- Migrate config (migrate_plus) `song_type`: source = `I8_SongType` on the `legacy` connection; dest = `taxonomy_term:song_type`; map name + weight (`SongType_Order`); keyed on `PK_SongType_ID` for idempotency.
- Rollbackable (`drush migrate:rollback`).
- Lives under `migration/` (config + any source plugin); depends only on `content-model` (dependency rule).

## Definition of done (acceptance criteria)
- [ ] `drush migrate:import song_type` creates the terms; re-run is idempotent; rollback removes them.
- [ ] Term count = source `I8_SongType` count.
- [ ] Tests added per test strategy §4; passing in the default gate.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. Verification per test strategy §4: a `drush` count-parity check + spot-check;
idempotency/rollback confirmed. (No bespoke test of Migrate itself — NFR-3.)
