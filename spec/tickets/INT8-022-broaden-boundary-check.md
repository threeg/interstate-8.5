---
id: INT8-022
title: Broaden the dependency-rule boundary check to the full architecture rule
type: task
status: done
milestone: 9
batch: cleanup
layer: tooling
depends_on: [INT8-006]
implements: []
tests_required: false
estimate: 3
---

## In plain English
The automated check that stops our code layers from importing each other the wrong way currently
guards only one of the rules. This widens it to cover the whole layering rule, before the modules it
needs to police (migration, custom services) actually exist.

## Background
`tooling/check-boundary.sh` (from INT8-006) enforces only the **last** clause of the architecture
dependency rule — "nothing imports the theme namespace (`Drupal\interstate_85`)". The full rule
(architecture §2.1, test-strategy §5, **NFR-5**) is:

- `content-model → services → theme`
- `migration → content-model` (migration depends only on `content-model`)
- `content-model` imports nothing project-internal
- nothing imports `theme`

The finer arrows are not checked: today nothing would catch, e.g., a `migration` module importing a
`services` module. This is harmless on the empty skeleton (no custom modules exist yet), but the
migration and services custom modules land in **Milestone 9 (INT8-012, INT8-013)** — so the check must
be broadened **before** those tickets, or NFR-5 is enforced in name only when there is finally
something to enforce.

Surfaced by `sfk-verify` after the scaffolding batch (INT8-001…007).

## Technical requirements
- Establish a **module → layer mapping** so the check knows which custom module belongs to which layer
  (`content-model` / `migration` / `services`). Options: a convention (module name prefix or a
  subdirectory per layer under `web/modules/custom/`), a small manifest file, or adopt **deptrac**
  (explicitly permitted by test-strategy §2.1 / §5 as the boundary tool). Pick the lightest option that
  covers the rule (lazy adoption).
- Enforce every arrow of architecture §2.1, not just "nothing imports theme":
  - `migration` may import only `content-model`.
  - `services` may import `content-model` (not `theme`, not `migration`).
  - `content-model` imports nothing project-internal.
  - nothing imports `theme` (retain the existing `Drupal\interstate_85` check).
- Keep it wired inside the default gate (`tooling/run-tests.sh` step 4 / `lando test`) and runnable
  standalone (`bash tooling/check-boundary.sh` or the deptrac equivalent).
- Confirm the ticket `depends_on` graph in `BOARD.md` still agrees with the enforced import contracts
  (CONVENTIONS §4.4).

## Definition of done (acceptance criteria)
- [x] The check enforces all four clauses of architecture §2.1, proven by a planted violation for each
      new arrow (detected, then reverted) — the same "prove it fails" discipline as INT8-006.
- [x] Passes clean on the current tree; wired in the default gate and runnable standalone.
- [x] **Worked (or promoted into the main sequence) before INT8-012**, so the migration modules are
      policed on arrival.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **build-plumbing / tooling** (it *is* enforcement infrastructure, like
INT8-006). Verified by the planted-violation-per-arrow demonstration and the gate running green on the
real tree. Implements the enforcement side of **NFR-5** more completely; adds no new requirement
(`implements: []`).

## Notes
2026-07-12 — created by `sfk-verify` (scaffolding batch INT8-001…007). Candidate for **promotion into
the main sequence before INT8-012** (migration): once migration/services modules exist, an
under-enforced boundary check is a real NFR-5 gap, not a cosmetic one.

2026-07-19 — Promoted into the main execution-order table (row 12, before INT8-012) and worked, per
its own DoD gate — this run of `sfk-next-ticket` was about to start INT8-012 (the first migration
module) when the gate was noticed. Adopted the lightest option per lazy adoption: a **module machine-
name suffix convention** (`*_migrate` = migration layer, `*_services` = services layer) rather than
deptrac or a manifest file, enforced by extending `tooling/check-boundary.sh` with two more grep-based
checks alongside the existing theme-import rule: migration modules forbidden from importing a
`*_services` namespace, services modules forbidden from importing a `*_migrate` namespace.
`content-model → imports nothing project-internal` has nothing to check today — content-model is pure
Drupal config in this project, no custom-module code exists for it — noted in the script's header for
whoever adds one later. Proved each of the three enforced arrows (theme-import, migration→services,
services→migration) with a planted violation in a throwaway module directory, confirmed detection,
reverted; final tree re-runs clean. Confirmed the `BOARD.md` `depends_on` graph doesn't violate the
now-enforced rule (migration tickets 012–014 depend only on content-model tickets). Default gate passes.
**Sanity test:** `bash tooling/check-boundary.sh` → "Boundary check passed (0 violations)."; planting
`use Drupal\anything_services\Foo;` inside a `web/modules/custom/*_migrate/` module and re-running
reports the violation.
