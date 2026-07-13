---
id: INT8-023
title: Reconcile the INT8-001 record (and its BOARD title) from DDEV to Lando
type: task
status: todo
milestone: 9
batch: cleanup
layer: docs
depends_on: [INT8-001]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Our first ticket's write-up still describes the old DDEV setup we tried and dropped, even though the
project actually runs on Lando. This corrects the historical record so the ticket history tells the
truth.

## Background
The project's local dev tool is **Lando** (`.lando.yml`; DDEV was trialled and abandoned — WSL/mutagen,
~90% slower). Root `CLAUDE.md`, `spec/milestone-plan.md`, and the actual repo all reflect Lando, but
**INT8-001** was never reconciled after the switch. Its record is now inaccurate:

- Title and filename say "DDEV environment".
- Technical requirements / DoD reference `ddev config`, `ddev start`, `ddev composer install`,
  `ddev drush status`.
- The `## Notes` completion report claims artefacts that don't exist (`.ddev/config.yaml`,
  `.ddev/.gitignore`) — there is no `.ddev/` on disk, only `.lando.yml`.
- `BOARD.md` row 1 still titles it "Initialise repo + DDEV environment".

This is a **honesty-of-record** fix (sfk-verify point 7 / CONVENTIONS §5): the history should describe
what was actually built.

## Technical requirements
- Update `spec/tickets/INT8-001-init-repo-ddev.md`:
  - Retitle to Lando (frontmatter `title` + `## In plain English`/`## Background`/`## Technical
    requirements`/`## Definition of done` references).
  - Correct the `## Notes` completion report to the real artefacts (`.lando.yml`, the `drupal11`
    recipe, `legacy` MariaDB service, `web/modules/custom/` placeholder), and the sanity test to
    `lando start && lando composer install && lando drush status`.
  - Append a dated Notes line recording the DDEV→Lando switch and pointing to
    `[[feedback_lando_over_ddev]]` (the rationale: DDEV abandoned, WSL/mutagen ~90% slower).
- Update the ticket's **title in `BOARD.md`** row 1 to match (the board is a derived view — bring it in
  line, don't invent a new source).
- The **filename** (`INT8-001-init-repo-ddev.md`) may be left as-is (ids/filenames are permanent per
  CONVENTIONS §1.3) or renamed to `-lando`; if renamed, update the `BOARD.md`/epic references. Prefer
  leaving the filename and fixing the content, to honour the "ids are permanent" convention — decide in
  the ticket.

## Definition of done (acceptance criteria)
- [ ] INT8-001's title, body, and Notes describe Lando, not DDEV, and match the artefacts actually on
      disk.
- [ ] `BOARD.md` row 1 title reflects Lando.
- [ ] A Notes line records the switch with its rationale.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **docs-only.** Verified by reading the reconciled INT8-001 against
`.lando.yml` and root `CLAUDE.md` (no residual `ddev` references except the historical note of the
switch). Adds no requirement (`implements: []`).

## Notes
2026-07-12 — created by `sfk-verify` (scaffolding batch INT8-001…007).
