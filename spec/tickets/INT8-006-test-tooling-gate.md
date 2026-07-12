---
id: INT8-006
title: Test tooling + the default gate
type: task
status: todo
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
- **Playwright** + **@axe-core/playwright** project (against the DDEV URL), browser matrix per NFR-8.
- **Dependency-rule boundary check** (deptrac or a custom PHPUnit test): `content-model → services → theme`, `migration → content-model`, nothing imports `theme` (architecture §2.1, NFR-5).
- DDEV custom commands: **`ddev test`** (PHPUnit + PHPCS + PHPStan + boundary), **`ddev playwright`**, **`ddev test-all`**.
- **Pre-commit hook** runs `ddev test`.

## Definition of done (acceptance criteria)
- [ ] `ddev test` runs all four checks and passes on the empty skeleton (zero warnings).
- [ ] `ddev playwright` runs (empty/smoke) green; `ddev test-all` wired.
- [ ] The boundary check fails on a deliberate violation (proves it works), then reverted.
- [ ] Pre-commit hook installed and documented.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **this ticket IS the test infrastructure.** Verified by the gate running
green on the skeleton and the boundary check demonstrably failing on a planted violation. Implements
the enforcement side of **NFR-5**.
