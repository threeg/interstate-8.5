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
2. Add terms in v2 order (preserve `SongType_Order` as weight): **Modest Mouse, Ugly Casanova, Side projects, Covers** (confirm the full set against the dump at migration).
3. `lando drush cex -y` → commit.

## Technical requirements
- Vocabulary machine name `song_type`; term weights preserve v2 ordering.
- Referenced by `field_song_type` (INT8-010); default landing filter is the *Modest Mouse* term (FR-9).

## Definition of done (acceptance criteria)
- [x] `song_type` vocabulary + the working term set exist and are exported.
- [x] Exported config matches `content-model.md` §3; `lando drush cim` is a no-op.
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
