---
id: INT8-007
title: Fill in sfk-verify for the stack
type: task
status: todo
milestone: 8
batch: scaffolding
layer: docs
depends_on: [INT8-006]
implements: []
tests_required: false
estimate: 2
---

## In plain English
Teach the project's post-work review skill the exact commands and checks for this Drupal stack, so
later batches can be audited against the spec automatically.

## Background
The `sfk-verify` skill is a template with placeholder commands; fill it with the real stack checks now
that the gate exists (INT8-006).

## Technical requirements
- Fill `.claude/skills/sfk-verify/SKILL.md` placeholders with: the `lando test` / `lando playwright` /
  `lando test-all` commands, the PHPCS/PHPStan/boundary invocations (custom-code scope), and the
  spec-audit steps (config exported vs `content-model.md`; FR/NFR traceability vs `BOARD.md`).
- Note the Drupal-specific review points: no hand-authored config YAML; deprecation-clean; tokens not
  hardcoded.

## Definition of done (acceptance criteria)
- [ ] `sfk-verify` reflects the real commands and Drupal review points; no placeholders remain.
- [ ] A dry run of the skill's checks against the current skeleton succeeds.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **docs / tooling.** Verified by the filled skill running its checks cleanly
on the skeleton.
