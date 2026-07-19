---
id: INT8-008
title: Song type taxonomy (vocabulary + terms)
type: task
status: in-review
milestone: 9
batch: content-model
layer: content-model
depends_on: [INT8-003]
implements: [FR-9]
tests_required: false
estimate: 2
---

## In plain English
Create the "band/group" categories a song can belong to — Modest Mouse, Ugly Casanova, side projects,
covers — that the song list filters by.

## Background
Maps v2 `I8_SongType`. See `content-model.md` §3.

## Site-building steps (operator) — terse
1. Add vocabulary **`song_type`** ("Song type").
2. Add terms in v2 order (preserve `SongType_Order` as weight): **Modest Mouse, Ugly Casanova, Side Projects, Covers** (confirmed against the dump — see Notes).
3. Add `field_legacy_id` (Integer, indexed) to the term bundle; populate from `I8_SongType.PK_SongType_ID`.
4. `lando drush cex -y` → commit.

## Technical requirements
- Vocabulary machine name `song_type`; term weights preserve v2 ordering.
- Referenced by `field_song_type` (INT8-010); default landing filter is the *Modest Mouse* term (FR-9).
- `field_legacy_id` (Integer, indexed) on the term bundle, per the cross-cutting convention
  (architecture.md §3.3) — populated from `PK_SongType_ID` for every term.

## Definition of done (acceptance criteria)
- [x] `song_type` vocabulary + the working term set exist and are exported.
- [x] Exported config matches `content-model.md` §3; `lando drush cim` is a no-op.
- [x] `field_legacy_id` exists on the term bundle and is populated with the correct v2 PK on every term.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **config (site-building).** **Claude verifies** exported
`taxonomy.vocabulary.song_type` + terms against `content-model.md` §3. Term migration itself is
INT8-012.

## Notes
2026-07-12 — Enabled core `taxonomy` module (`lando drush pm:enable taxonomy -y`). Created the
`song_type` vocabulary and its four working-set terms via the entity API (`lando drush php:eval`,
`Vocabulary::create()`/`Term::create()`) — not hand-authored config — in v2 `SongType_Order`: Modest
Mouse (0), Ugly Casanova (1), Side projects (2), Covers (3). Exported config
(`lando drush cex -y`); `taxonomy.vocabulary.song_type.yml` matches `content-model.md` §3 exactly
(machine name, label); `lando drush cim -y` confirms no drift. Terms are content (not config) —
verified directly via `loadTree('song_type')`, order and names match. Default gate (`lando test`)
passes clean. **Sanity test:** `lando drush cim -y` → "There are no changes to import"; loading
`/admin/structure/taxonomy/manage/song_type/overview` lists the four terms in order.

2026-07-12 (revision, user feedback) — User flagged that these terms were manually created (not
migrated) and asked whether the v2 primary keys would be preserved. Investigation found a real spec
gap: `content-model.md` §3 never carried the cross-cutting `field_legacy_id` convention
(architecture.md §3.3, "every migrated content entity") that §2 gives Song — fixed in
`content-model.md` §3 + its decisions log first. Also found the `I8_SongType` dump spells the fourth
term **"Side Projects"** (capital P), not "Side projects" as originally drafted — corrected per this
ticket's own instruction to confirm against the dump. Added `field_legacy_id` (Integer, indexed) to
the `song_type` term bundle via the entity API and populated it from `I8_SongType.PK_SongType_ID`:
Modest Mouse→1, Ugly Casanova→2, Side Projects→4, Covers→3 (v2 PK order ≠ `SongType_Order`, which the
term *weights* already correctly follow: 0/1/2/3). Renamed term 3 to "Side Projects". Re-exported
config (`field.storage.taxonomy_term.field_legacy_id`, `field.field.taxonomy_term.song_type.field_legacy_id`);
`lando drush cim -y` confirms no drift; default gate re-run clean. **Why this matters for INT8-012:**
these terms were created outside the Migrate framework, so the migration's own map table has no record
of them — INT8-012 must reconcile against these 4 existing terms (e.g. `migrate_plus`'s `entity_lookup`
process plugin keyed on `field_legacy_id`, or an explicit skip-if-exists check) rather than blind-create,
or it will produce 4 duplicate terms. Flagging this now so INT8-012 is scoped correctly when it's
picked up. **Updated sanity test:** `lando drush php:eval` dumping
`loadTree('song_type')` + `field_legacy_id` shows Modest Mouse=1, Ugly Casanova=2, Side Projects=4,
Covers=3.
