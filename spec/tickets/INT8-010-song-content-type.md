---
id: INT8-010
title: Song content type + fields
type: task
status: in-review
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
- [x] `song` type + all fields exist per `content-model.md` §2 and are exported.
- [x] `lando drush cim` is a no-op; `field_legacy_id` is indexed.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **config (site-building).** **Claude verifies** the exported
`node.type.song` + `field.*` config field-by-field against `content-model.md` §2 (this is the NFR-6
config-vs-spec check). Behavioural coverage comes with the migration (013) and the screens (018–020).

## Notes
2026-07-12 — Created the `song` node type and all nine fields via the entity API, matching
`content-model.md` §2 exactly: `field_lyrics`/`field_notes`/`field_quotes` (Text formatted long,
Restricted HTML the intended value format — no format lock-in at field level since core has no such
setting; only `restricted_html`/`plain_text` exist so there's nothing else to pick), `field_video`
(entity ref → Media, bundle `remote_video`), `field_song_type` (entity ref → `song_type` term,
**required**), `field_parent_song` (entity ref → node `song`, self-reference),
`field_lyrics_same_as_parent` / `field_exclude_from_list` (Boolean), `field_legacy_id` (Integer,
**indexed**). Wired the default form display (all fields editable — `media_library_widget` for the
video, `options_select` for type) and default view display, applying **FR-12** (type/group hidden) and
hiding `field_legacy_id`/`field_parent_song`/`field_lyrics_same_as_parent` from raw default rendering
since they drive custom presentation logic in INT8-019/INT8-020 rather than being shown as plain
fields. Verified by rendering the actual node-add form — all nine fields present. Exported config;
`lando drush cim -y` confirms no drift; default gate passes clean. **Sanity test:** `lando drush cim -y`
→ "There are no changes to import"; `/node/add/song` shows all nine fields, `field_song_type` marked
required.

2026-07-12 (revision, user feedback) — User asked whether lyrics/notes/quotes were meant to be rich
text. They should be, and weren't yet: `restricted_html` (INT8-009) had no **text editor** attached, so
the widget was a bare textarea requiring hand-typed HTML. Enabled core `editor` + `ckeditor5` modules
and attached a CKEditor 5 toolbar (bold, italic, link) to `restricted_html` — matching the format's
allow-list exactly, so the editor's toolbar and the filter's allow-list can never drift apart. Updated
`content-model.md` §5 to document the editor as part of the format's spec (this closes the gap for
INT8-009 too, since the format itself was already `done`). Verified two ways: (1) the CKEditor5 plugin
validator (`$editor->getTypedData()->validate()`) reports **0 violations** against the format; (2) with
the account switcher set to **uid 1** (the actual admin session, not the anonymous context my first
check mistakenly used) the field's format widget defaults to `restricted_html` — confirmed the earlier
"only plain_text available" reading was an artifact of testing as anonymous, not a real permissions
gap for the site owner. **Known, deliberately out-of-scope limitation:** no non-uid-1 role has been
granted "use text format restricted_html" — fine today since the site has no separate editor role yet;
revisit when one is introduced. Exported config (`editor.editor.restricted_html`, `core.extension`);
`lando drush cim -y` no-op; default gate re-run clean.
