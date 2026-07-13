---
id: INT8-006
title: Test tooling + the default gate
type: task
status: in-review
milestone: 8
batch: scaffolding
layer: tooling
depends_on: [INT8-002, INT8-005]
implements: [NFR-5]
tests_required: false
estimate: 5
---

## In plain English
Set up the automatic safety checks that run on every change — so mistakes, style slips, deprecated code
and broken layering are caught before they pile up.

## Background
Wires the gate from the test strategy. This is the machinery that makes autonomous, ticket-by-ticket
implementation safe.

## Technical requirements
- **PHPUnit** configured for custom modules/theme (`web/modules/custom`, custom theme) — Unit/Kernel/Functional.
- **PHPCS** with `drupal/coder` (`Drupal` + `DrupalPractice`), **scoped to custom code only**.
- **PHPStan** with `mglaman/phpstan-drupal` + `phpstan/phpstan-deprecation-rules`, **custom code only**, modest level, deprecation rules on.
- **Playwright** + **@axe-core/playwright** project (against the Lando URL), browser matrix per NFR-8.
- **Dependency-rule boundary check** (deptrac or a custom PHPUnit test): `content-model → services → theme`, `migration → content-model`, nothing imports `theme` (architecture §2.1, NFR-5).
- Lando custom commands: **`lando test`** (PHPUnit + PHPCS + PHPStan + boundary), **`lando playwright`**, **`lando test-all`**.
- **Pre-commit hook** runs `lando test`.

## Definition of done (acceptance criteria)
- [x] `lando test` runs all four checks and passes on the empty skeleton (zero warnings).
- [x] `lando playwright` runs (empty/smoke) green; `lando test-all` wired.
- [x] The boundary check fails on a deliberate violation (proves it works), then reverted.
- [x] Pre-commit hook installed and documented.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **this ticket IS the test infrastructure.** Verified by the gate running
green on the skeleton and the boundary check demonstrably failing on a planted violation. Implements
the enforcement side of **NFR-5**.

## Notes
2026-07-12 — Wired the complete default gate: `lando test` runs PHPUnit 11 (custom modules/theme
only, zero tests on empty skeleton exits 0), PHPCS 3.x with Drupal + DrupalPractice standards,
PHPStan 2.x with mglaman/phpstan-drupal and deprecation-rules auto-registered via
phpstan/extension-installer (no manual `includes` needed), and `tooling/check-boundary.sh` which
greps for theme-namespace imports in custom modules. Boundary check proved by planting a `use
Drupal\interstate_85\...` in a temporary module file — detected correctly, reverted. `lando
playwright` uses a dedicated `pw` service (mcr.microsoft.com/playwright:v1.61.1-jammy) which
includes all browser deps; the `playwright` tooling does `npm install` then runs the smoke test.
Smoke test verified against all 5 browser targets (chromium, firefox, webkit, mobile-chrome,
mobile-safari) — all pass. Pre-commit hook installed: `git config core.hooksPath .githooks` (wired
in `composer.json` post-install-cmd). `lando test-all` = `lando test && lando playwright` (two
separate services; run both from the host). **Sanity test:** `lando test` → "All checks passed";
`lando playwright` → "5 passed".

## QA steps
1. `lando test` — should print four numbered steps and end with "All checks passed."
2. `lando playwright` — should print "5 passed (≈10s)"
3. Plant a violation (`echo "<?php\nuse Drupal\\interstate_85\\Foo;" > web/modules/custom/bad.php`),
   run `bash tooling/check-boundary.sh`, confirm "FAILED — 1 violation", then delete the file.
