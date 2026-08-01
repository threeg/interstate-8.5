---
id: INT8-042
title: Add a fast lint-only check alongside the default gate
type: task
status: todo
milestone: 9
batch: cleanup
layer: tooling
depends_on: [INT8-006]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Right now, checking a code-style fix means waiting for the whole test suite to run — a stray comment
typo costs the same few minutes as a real behaviour change. Add a quick check that skips the slow part,
so a style nit is caught in seconds instead of minutes.

## Background

`tooling/run-tests.sh` (INT8-006, the default gate behind `lando test`) runs four checks in sequence:
PHPUnit, PHPCS, PHPStan, the boundary check. PHPUnit dominates the wall-clock cost — currently ~5.5
minutes — while PHPCS + PHPStan + the boundary check together finish in a few seconds. There is
currently no way to re-run just the fast subset, so any iteration on a style or static-analysis finding
re-pays the full PHPUnit cost.

Surfaced concretely during INT8-042's predecessor work (INT8-038): three of four `lando test` runs in
that ticket were solely to re-check a PHPCS docblock/line-length nit and a PHPStan style preference —
each one a ~5.5-minute wait to confirm a one-line fix.

## Technical requirements

- Add `tooling/run-lint.sh`, running only the fast subset of the default gate — PHPCS, PHPStan, the
  boundary check (`tooling/check-boundary.sh`) — with the same config/flags `tooling/run-tests.sh`
  already uses for each, and the same "all must pass, zero warnings" contract.
- Wire it as a new Lando tooling command in `.lando.yml`, alongside the existing `test` entry (line 34):
  a `lint` entry on the `appserver` service running `bash /app/tooling/run-lint.sh`.
- `tooling/run-tests.sh` and `lando test` are unchanged — still the one command that runs all four
  checks, still the default gate the definition of done requires.
- Document `lando lint` in the root `CLAUDE.md` Commands section, stated explicitly as a fast local
  convenience that never substitutes for `lando test` in the definition of done.

## Definition of done (acceptance criteria)
- [ ] `tooling/run-lint.sh` exists and runs PHPCS + PHPStan + the boundary check, matching
      `tooling/run-tests.sh`'s config for each.
- [ ] `lando lint` is wired in `.lando.yml` and runs it.
- [ ] `lando test`'s behaviour and output are unchanged.
- [ ] Root `CLAUDE.md`'s Commands section documents `lando lint`, stating it does not replace
      `lando test` in the definition of done.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: false` — build-plumbing: a local dev-convenience script wrapping three already-tested
checks, with no behaviour of its own to unit test.

Verification: deliberately introduce a PHPCS violation (e.g. a docblock capitalisation error), confirm
`lando lint` catches it in well under a minute, fix it, confirm `lando lint` passes, then confirm
`lando test` still runs and passes all four checks unchanged.

## Notes
- 2026-08-01 — created, at the user's request after INT8-038 spent roughly 22 of its ~42 minutes on
  `lando test` re-runs triggered by single-line PHPCS/PHPStan fixes. Filed as a cleanup ticket against
  already-shipped tooling (INT8-006) rather than an ad hoc edit, to keep the one-ticket-at-a-time
  paper trail intact.
