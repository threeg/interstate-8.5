---
id: INT8-024
title: Pin lyrics/notes/quotes fields to the Restricted HTML format
type: task
status: todo
milestone: 9
batch: cleanup
layer: content-model
depends_on: [INT8-010]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Make the lyrics, notes and quotes fields only ever use our clean "Restricted HTML" editor, so nobody
can switch a song into a different, unfiltered text mode and lose the tidy formatting.

## Background
`content-model.md` §2 specifies `field_lyrics` / `field_notes` / `field_quotes` as **Restricted HTML**,
and §5 makes `restricted_html` their sole target (the CKEditor 5 editor from INT8-010 is attached only
to that format). But the exported field config leaves the format open:

```yaml
# field.field.node.song.field_lyrics.yml  (and _notes, _quotes)
settings:
  allowed_formats: {  }   # empty ⇒ every format the user can access is allowed
```

Empty `allowed_formats` means an editor could select `plain_text` (or any future format) and lose the
FR-21 allow-list **and** the WYSIWYG. INT8-010's note justified leaving it open with *"no format
lock-in at field level since core has no such setting"* — that is **incorrect**: `allowed_formats` is a
core text-field setting (Drupal ≥10.1) and is already present (empty) in the exported config. The
practical risk is low today (only `restricted_html`/`plain_text` exist), but the config does not match
the §2 intent.

Surfaced by `sfk-verify` after the content-model batch (INT8-008…010).

## Technical requirements
- In the Drupal UI (Manage fields → each field → *Allowed formats*), restrict `field_lyrics`,
  `field_notes`, `field_quotes` to **`restricted_html`** only. Generated in the UI + exported — never
  hand-authored (NFR-6).
- `lando drush cex -y`; the three `field.field.node.song.field_{lyrics,notes,quotes}.yml` should then
  carry `allowed_formats: [restricted_html]` (or the equivalent list form Drupal exports).
- Correct INT8-010's `## Notes`: strike the "core has no such setting" claim; record that the fields are
  now pinned to `restricted_html`.

## Definition of done (acceptance criteria)
- [ ] The three fields' exported config restricts `allowed_formats` to `restricted_html`.
- [ ] `lando drush cim -y` is a no-op after export; default gate green.
- [ ] The node-add form offers no format switcher on these fields (or only `restricted_html`).
- [ ] INT8-010's note corrected; ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **config (site-building).** **Claude verifies** the exported
`field.field.node.song.field_{lyrics,notes,quotes}` `allowed_formats` against `content-model.md` §2/§5.
Adds no requirement (`implements: []`).

## Notes
2026-07-12 — created by `sfk-verify` (content-model batch INT8-008…010).
