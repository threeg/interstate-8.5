---
id: INT8-007
title: Fill in sfk-verify for the stack
type: task
status: done
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
- [x] `sfk-verify` reflects the real commands and Drupal review points; no placeholders remain.
- [x] A dry run of the skill's checks against the current skeleton succeeds.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **docs / tooling.** Verified by the filled skill running its checks cleanly
on the skeleton.

## Notes
2026-07-12 — Filled `.claude/skills/sfk-verify/SKILL.md` with the real stack: the `lando test`
command chain (PHPUnit + PHPCS + PHPStan + `tooling/check-boundary.sh`, all scoped to
`web/modules/custom` + the custom theme via `.phpcs.xml`/`phpstan.neon`), `lando playwright`, and the
fact that "`lando test-all`" is documentation for running `lando test` then `lando playwright`
sequentially — there is no single wired Lando command for it (per INT8-006's notes). Added the
spec-audit steps (content-model config vs `content-model.md`, FR/NFR traceability vs `BOARD.md`) and
the three Drupal-specific review points (no hand-authored config YAML, PHPStan deprecation-clean,
tokens not hardcoded). Removed the template's placeholder note. **Dry run:** `lando test` against the
current empty skeleton → "All checks passed" (PHPUnit: no tests executed; PHPCS/PHPStan/boundary:
clean). **Sanity test:** `lando test` prints "All checks passed."
