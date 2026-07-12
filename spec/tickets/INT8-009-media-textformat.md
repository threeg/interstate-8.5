---
id: INT8-009
title: Remote-video media type + Restricted HTML text format
type: task
status: todo
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
3. `ddev drush cex -y` → commit.

## Technical requirements
- Remote-video media type present (used by `field_video`, INT8-010, FR-17).
- `restricted_html` format is the target for lyrics/notes/quotes; the migration cleanup writes to it (FR-21, INT8-013).

## Definition of done (acceptance criteria)
- [ ] Remote-video media type + `restricted_html` format exist and are exported.
- [ ] Exported config matches `content-model.md` §4–§5; `ddev drush cim` is a no-op.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **config (site-building).** **Claude verifies** the media type + text-format
config against `content-model.md` §4–§5. The FR-21 transform behaviour is unit-tested in INT8-013.
