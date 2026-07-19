---
id: INT8-009
title: Remote-video media type + Restricted HTML text format
type: task
status: in-review
milestone: 9
batch: content-model
layer: content-model
depends_on: [INT8-003]
implements: [FR-17, FR-21]
tests_required: false
estimate: 2
---

## In plain English
Set up how songs hold a music video (a pasted YouTube/Vimeo link that shows an inline player) and how
their lyrics/notes are stored cleanly and consistently.

## Background
`content-model.md` §4 (Remote video, oEmbed) and §5 (Restricted HTML — the FR-21 cleanup target).

## Site-building steps (operator) — terse
1. Confirm core **Media** "Remote video" type (oEmbed: YouTube, Vimeo) is available; add if needed.
2. Create text format **"Restricted HTML"** (machine `restricted_html`): allow `<p><br><em><strong><a>`; no image/script; convert-line-breaks/URL filters as suitable. This is the FR-21 destination.
3. `lando drush cex -y` → commit.

## Technical requirements
- Remote-video media type present (used by `field_video`, INT8-010, FR-17).
- `restricted_html` format is the target for lyrics/notes/quotes; the migration cleanup writes to it (FR-21, INT8-013).

## Definition of done (acceptance criteria)
- [x] Remote-video media type + `restricted_html` format exist and are exported.
- [x] Exported config matches `content-model.md` §4–§5; `lando drush cim` is a no-op.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **config (site-building).** **Claude verifies** the media type + text-format
config against `content-model.md` §4–§5. The FR-21 transform behaviour is unit-tested in INT8-013.

## Notes
2026-07-12 — Created the `remote_video` media type (source `oembed:video`, providers YouTube +
Vimeo — the two named in `content-model.md` §4) via the entity API. Learned from INT8-008: creating a
`MediaType` entity does **not** auto-create its source field the way the admin add-form does — had to
explicitly call `$source->createSourceField($type)`, save the field storage + field config, and set
`source_configuration.source_field`, then wire `field_media_oembed_video` into the media type's default
form display (`oembed_textfield` widget) and view display (`oembed` formatter) myself. Verified by
rendering an actual add-media form and confirming the field appears. Created the `restricted_html` text
format (`filter_html` restricting to `<p> <br> <em> <strong> <a href hreflang>`, no image/script tags,
per §5) plus `filter_autop` (line-break conversion) and `filter_url` (link-ify plain URLs) per the
ticket's own "convert-line-breaks/URL filters as suitable" instruction, and `filter_htmlcorrector` for
malformed markup — a standard "restricted" format composition. Exported config; `lando drush cim -y`
confirms no drift. Default gate passes clean. **Sanity test:** `lando drush cim -y` → "There are no
changes to import"; `/media/add/remote_video` shows the oEmbed URL field;
`/admin/config/content/formats/manage/restricted_html` shows the four filters enabled in the stated
order.
