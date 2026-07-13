---
id: INT8-010
title: Song content type + fields
type: task
status: todo
milestone: 9
batch: content-model
layer: content-model
depends_on: [INT8-008, INT8-009]
implements: [FR-2, FR-3, FR-12, NFR-6]
tests_required: false
estimate: 3
---

## In plain English
Build the "song" record itself and all its fields — title, lyrics, notes, quotes, video, type, its link
to a parent version, and the housekeeping flags — the shape every imported song fills.

## Background
The authoritative field list is `content-model.md` §2 (and the migration mapping §8).

## Site-building steps (operator) — terse
Create node type **`song`** with fields (machine names per `content-model.md` §2):
- `field_lyrics`, `field_notes`, `field_quotes` — Text (formatted, long), format **Restricted HTML**.
- `field_video` — entity ref → Media (Remote video), card. 1.
- `field_song_type` — entity ref → `song_type` term, **required**, card. 1.
- `field_parent_song` — entity ref → node `song`, card. 1 (self-ref; makes this an alternate version).
- `field_lyrics_same_as_parent` — Boolean.
- `field_exclude_from_list` — Boolean (v2 `Song_Live`; hides from the landing).
- `field_legacy_id` — Integer, **indexed** (v2 `PK_Song_ID`; cross-cutting legacy id).
Then `lando drush cex -y` → commit.

## Technical requirements
- Matches `content-model.md` §2 exactly (names, types, cardinality, required). Title is the node title.
- No release/setlist/tab/studio fields (deferred). Type/group is **not** shown on the page (FR-12) — a display concern for INT8-019.
- Config generated in the UI and **exported** — never hand-authored (NFR-6).

## Definition of done (acceptance criteria)
- [ ] `song` type + all fields exist per `content-model.md` §2 and are exported.
- [ ] `lando drush cim` is a no-op; `field_legacy_id` is indexed.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **config (site-building).** **Claude verifies** the exported
`node.type.song` + `field.*` config field-by-field against `content-model.md` §2 (this is the NFR-6
config-vs-spec check). Behavioural coverage comes with the migration (013) and the screens (018–020).
