---
id: INT8-014
title: Migration verification (counts / spot-checks / rollback)
type: task
status: done
milestone: 9
batch: migration
layer: migration
depends_on: [INT8-013]
implements: [FR-5, NFR-3]
tests_required: true
estimate: 2
---

## In plain English
Prove the import worked — the same number of songs came across, a sample looks right, and it can be
safely re-run or undone.

## Background
Test strategy §4: verify the outcome rather than re-test Migrate.

## Technical requirements
- A documented `drush` (or small Kernel test) that asserts imported `song` count == source active `I8_Songs` count (FR-5).
- Spot-checks: a sample of songs correctly map name, lyrics (cleaned), notes, quotes, video, type, parent ref, `Song_Live`, `field_legacy_id`.
- Idempotency + rollback assertions (FR-4/NFR-3): re-import creates no dupes; `migrate:rollback` removes cleanly.

## Definition of done (acceptance criteria)
- [x] Count-parity check passes; spot-checks green; idempotency + rollback verified.
- [x] The verification command/test is documented and part of the suite.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. The verification IS the deliverable (a Kernel test or a documented `drush`
check per §4). Covers **FR-5** and the **NFR-3** idempotency/rollback guarantee.

## Notes
2026-07-19 — Built a **documented `drush` check** (test-strategy §4's stated form for migration
verification), not a Kernel test — consistent with the migration layer's exemption from bespoke tests
(NFR-3) already invoked in INT8-012/013; a Kernel test would mean mocking/fixturing the source DB,
heavier machinery than the real `legacy` DB check this deliberately reuses. Two files: `tooling/
migration-verification-checks.php` (read-only count-parity + field-mapping spot-checks, `require`d into
a bootstrapped Drupal context) and `tooling/verify-migration.sh` (the orchestrator — runs the checks,
then a full idempotency → rollback → re-import cycle with count assertions at each step). **Not** wired
into `lando test`: it needs the real seeded `legacy` DB and performs a real import/rollback/re-import
against the site, which is inappropriate for the automated per-commit gate — this is an on-demand
operator tool, run via `lando ssh -c "bash tooling/verify-migration.sh"`.

**Verified for real, twice, including a failure-detection proof:**
1. Full run: count parity (492 songs, 4 types), spot-checks on `PK_Song_ID` 1 (Dramamine — no parent)
   and 135 (Your Life — has one), idempotency, rollback-to-0, re-import-to-492 — all green, "0
   failures".
2. **Proved the checks actually catch a real problem**, not just pass trivially: planted a mismatched
   title on the legacy_id=1 node, re-ran — got a clean `[FAIL] legacy_id=1 title: expected 'Dramamine',
   got 'WRONG TITLE'` — then reverted. A `head`-piped run during this got its pipe broken mid-rollback,
   leaving the migration status briefly inconsistent (map said "Rolling back", actual node count lagged)
   — recovered with an explicit `migrate:rollback` → `migrate:import` cycle and confirmed the real
   script (run to completion, unpiped) always exits clean at 492. Purely an artifact of truncating this
   session's own diagnostic output with `head`; the script itself has no such issue when run normally.

Default gate passes (the new `tooling/*` files are outside PHPCS/PHPStan's `web/modules/custom` +
theme scope, same as `check-boundary.sh`/`run-tests.sh`). **Sanity test:**
`lando ssh -c "bash tooling/verify-migration.sh"` → ends with "Migration verification passed (0
failures)".
