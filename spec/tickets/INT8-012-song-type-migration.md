---
id: INT8-012
title: Song type migration (I8_SongType → terms)
type: task
status: done
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
- [x] `drush migrate:import song_type` creates the terms; re-run is idempotent; rollback removes them
      — see Notes for the precise (and correct) rollback behaviour, which isn't literally "removes".
- [x] Term count = source `I8_SongType` count.
- [x] Tests added per test strategy §4; passing in the default gate.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. Verification per test strategy §4: a `drush` count-parity check + spot-check;
idempotency/rollback confirmed. (No bespoke test of Migrate itself — NFR-3.) **Exemption invoked:**
test-strategy §1.2/§4 explicitly names migration as verify-outcomes-not-framework — no PHPUnit test
was written; the "test" is the drush-driven verification recorded below, executed for real against the
actual `legacy` DB, not simulated.

## Notes
2026-07-19 — Created the `i8_migrate` custom module (`web/modules/custom/i8_migrate` — machine-name
suffix `_migrate` per INT8-022's just-landed convention; renamed from an initial `interstate_85_migrate`
per user feedback: `interstate_85_*` is reserved for the theme, custom modules are `i8_*`) shipping a
`migrate_plus` migration group (`i8`) and the `song_type` migration as default config
(`config/install/`). Source: migrate_plus's **`table`** plugin (not `sql` — that plugin id doesn't
exist; `table` is the generic SQL-table source, extends core `SqlBase`), `key: migrate` (the DB
connection wired in INT8-004), reading `I8_SongType` directly.

**The reconciliation problem flagged back in INT8-008/010 was real and is solved.** These 4 terms were
originally created outside the Migrate framework, so a naive migration would have created 4 duplicates
on top of them. Process `tid` uses `entity_lookup` (migrate_plus) keyed on `field_legacy_id` to find
the pre-existing term before falling back to creating one — verified this works on a **fresh site**
too (terms are content, not config, so `cim` alone wouldn't recreate them): the plugin returns `NULL`
when no match exists and the destination creates fresh, so this migration is correct for both this dev
environment and a from-scratch install. Confirmed **exactly 4 terms exist** after import (not 8) via a
direct entity query. Also fixed a smaller drift while reconciling: term weights are now the **verbatim**
v2 `SongType_Order` values (1/2/3/4) rather than INT8-008's locally-reindexed 0/1/2/3 — same resulting
sort order, but now matches `content-model.md` §3's "preserve `SongType_Order` as weight" literally.
Mapped `SongType_Active` → term `status` (published/unpublished) — discovered taxonomy terms implement
`EntityPublishedInterface` in D11, mirroring the `Song_Active` → node `status` precedent from INT8-004;
documented in `content-model.md` §8 (a real gap — the summary table never listed `PK_SongType_ID` →
`field_legacy_id` or the not-yet-existing `SongType_Active` mapping at all).

**Verified against the real `legacy` DB, all four DoD items run for real, not asserted:**
1. **Count parity:** `drush migrate:status` reports Total 4, matching `I8_SongType`'s row count
   (confirmed in INT8-004).
2. **Import + reconciliation:** `drush migrate:import song_type` → "4 created" (Migrate-map
   terminology — this is the *map's* first record of each row, not 4 new Drupal entities; a direct
   `entityQuery` confirmed the term count stayed at 4, tids 1–4, reusing the INT8-008 terms).
3. **Idempotency:** re-running `drush migrate:import song_type` → "Processed 0 items" (nothing changed
   to reprocess, `track_changes: true`); term count still 4.
4. **Rollback — investigated and documented, not just run.** `drush migrate:rollback song_type` reports
   "Rolled back 4 items" but the terms **remain** (still tid 1–4). This is not a bug: core's
   `EntityContentBase::updateEntity()` sets `rollback_action = ROLLBACK_PRESERVE` by default (verified
   by reading the core source) whenever a row takes the *update* path rather than *create* — Migrate
   API deliberately never deletes an entity it didn't create. Since these terms pre-existed the
   migration, rollback correctly clears the migration's own tracking (map entries) while preserving the
   real content. Re-ran `migrate:import` afterward to restore the imported state; final state verified
   clean (4 terms, correct weights/legacy-ids/published status).

Exported config (`migrate_plus.migration.song_type`, `migrate_plus.migration_group.i8`,
`core.extension`); `lando drush cim -y` no-op; default gate passes. **Sanity test:** `lando drush
migrate:status song_type` → Total 4 / Imported 4; re-running `migrate:import` reports "Processed 0
items".
