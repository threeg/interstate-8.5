---
id: INT8-013
title: Songs migration (I8_Songs → nodes)
type: task
status: todo
milestone: 9
batch: migration
layer: migration
depends_on: [INT8-010, INT8-011, INT8-012]
implements: [FR-1, FR-2, FR-3, FR-4, FR-21]
tests_required: true
estimate: 5
---

## In plain English
Bring every song from the old site into the new one — names, lyrics, notes, quotes, videos, categories,
and the links between alternate versions — tidying up the old inconsistent formatting on the way in.

## Background
Ports/improves the v3 Songs source plugin. Mapping in `content-model.md` §8; flow in architecture §4.1.

## Technical requirements
- Migrate config `song`: source = `I8_Songs` (active) on `legacy`; dest = `node:song`; keyed on `PK_Song_ID` → `field_legacy_id` for idempotency (FR-4).
- Field map (`content-model.md` §8): title←`Song_Name`; lyrics/notes/quotes (Restricted HTML) with the **FR-21 cleanup** process plugin (strip legacy markup, preserve line/paragraph breaks); `field_song_type`←`FK_SongType_ID` (migration_lookup → INT8-012); `field_parent_song`←`FK_Song_ID` (self-ref, stub/second-pass); `field_lyrics_same_as_parent`←`Song_LyricsSameAsNormal`; `field_exclude_from_list`←`Song_Live`.
- **`field_video`** ← extract the video URL from the v2 `Song_Video` **embed markup** to build/reference a Remote-video media entity; rows that don't parse are **reported**, not dropped (content-model §4).
- Preserve the self-reference (FR-3) — run songs, then resolve `field_parent_song` (highwater/second migration or stubbing).
- `migration/` depends only on `content-model`.

## Definition of done (acceptance criteria)
- [ ] `drush migrate:import song` imports all active songs; re-run idempotent; rollback clean (FR-4).
- [ ] Fields map per §8; parent self-ref resolved (FR-3); rich text normalized (FR-21); video URLs extracted with unparseable rows reported.
- [ ] Unit test for the FR-21 transform + migration verification tests (per §4) pass in the default gate.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. **Unit test** on the FR-21 cleanup transform (deterministic, test-first). Import
verified in INT8-014 (counts/spot-checks). Fixtures per test strategy §8.
