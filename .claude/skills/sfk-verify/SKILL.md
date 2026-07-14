---
name: sfk-verify
description: Post-batch verification pass — audit completed work against the binding spec and review code quality, then propose cleanup tickets. Trigger on "verify", "review this batch", "run the verifier", or "spec-audit the recent work".
---

# sfk-verify — post-batch spec audit + quality review

Run after a batch of related tickets completes — before the gate the batch feeds into. Verification is
a first-class step: tests answer "is the code correct?"; this answers "does the code implement what the
spec *says*?" — a different question that tests alone do not cover.

## Commands

- `lando test` — the default gate: PHPUnit (Unit/Kernel/Functional, `phpunit.xml`) + PHPCS
  (`Drupal` + `DrupalPractice`, `.phpcs.xml`, scoped to `web/modules/custom` +
  `web/themes/custom/interstate_85`) + PHPStan (`phpstan.neon`, same scope, deprecation rules on) +
  `tooling/check-boundary.sh` (dependency-rule boundary check). Wired via `tooling/run-tests.sh`; must
  pass with **zero warnings**.
- `lando playwright` — the Playwright + Axe FE suite (`tests/playwright/`), against the Lando site, via
  the dedicated `pw` service.
- **"`lando test-all`"** — there is no single wired command; run `lando test` then `lando playwright`
  from the host (two separate Lando services — see `INT8-006` notes).
- Boundary check standalone: `bash tooling/check-boundary.sh` — greps custom modules for
  `use Drupal\interstate_85\...` (theme-namespace imports); fails on any hit.
- Pre-commit hook (`.githooks/pre-commit`, wired via `git config core.hooksPath .githooks`) runs
  `lando test` automatically.

## What to check

1. **Spec audit (requirement by requirement).** For each `FR`/`NFR` the batch's tickets `implement`,
   open `spec/requirements/requirements.md` and confirm the behaviour matches — exact thresholds,
   ordering, boundary conditions, error cases. Flag loose interpretations and missing edge cases, not
   just outright bugs.
2. **Contract conformance.** Where the batch touched the interface, confirm requests/responses match
   `spec/architecture/api-contract.md` exactly (shapes, status codes, error envelope).
3. **Content-model conformance.** Where the batch touched `content-model` (config), confirm the
   exported config under `config/` matches `spec/architecture/content-model.md` field-for-field. Config
   is generated in the Drupal admin UI/API and exported — **never hand-authored**; if you find
   hand-edited config YAML, that is a critical finding, not a style note.
4. **Architecture & dependency rule.** Confirm no layer imports something it may not
   (`content-model → services → theme`, `migration → content-model`, nothing imports `theme` —
   architecture §2.1) — run `bash tooling/check-boundary.sh` (or `lando test`, which includes it) — and
   that the ticket `depends_on` graph in `spec/tickets/BOARD.md` still agrees with the import contracts.
5. **Code quality.** Look for duplication, dead code, needless complexity, and efficiency traps the
   tests would pass but a gate would later fail (e.g. an N+1 query, an unbounded loop, a missing index).
   Run `lando test` and, for any batch touching the theme or song screens, `lando playwright`.
6. **Drupal-specific review points:**
   - No hand-authored config YAML (point 3).
   - **Deprecation-clean** — PHPStan (`phpstan.neon`, deprecation rules) reports no deprecated-API
     usage in custom code; this is the on-mission guard against the PHP-EOL trap that ended v2.
   - **Tokens not hardcoded** — theme/SDC changes reference `spec/design/tokens.css` custom properties;
     flag any hardcoded hex/px values that should be tokens.
7. **Honesty of the record.** Confirm each ticket's status, `## Notes` completion report, and
   `BOARD.md` row were updated in the same commit as the work.
8. **Contractual-value sweep.** Grep the code, the tests, **and** the docs (`spec/`, wireframes,
   READMEs) for hardcoded contractual values — numeric thresholds from `requirements.md` (e.g. result
   counts, timeouts), interface shapes/field names from `api-contract.md`, content-type/field machine
   names, and design tokens — and confirm each still matches the spec. A value that is correct in most
   places but drifted in one is exactly what the tests pass over; this is the check that catches it.

## What to produce

- A short findings list, each tagged **critical** (would fail a gate — promote into the main sequence
  before that gate) or **improvement** (work at discretion between batches).
- For accepted findings, draft **cleanup tickets** per `spec/tickets/CONVENTIONS.md` §6: ordinary
  `task` tickets, `batch: cleanup`, `implements: []`, numbered after the current highest id, placed in
  the Cleanup backlog table in `BOARD.md`. Do not auto-promote — flag candidates and let the user decide.

## Rules

- **Never edit `.sfk/`** — it is the kit's read-only source (templates, changelog, manifest).
- Verification proposes tickets; it does not silently rewrite shipped code.
- A finding that reveals a genuine spec gap is a specification change (CONVENTIONS §5.5), recorded in
  `spec/` first — not a cleanup ticket.
- Never sign off a milestone here; that is the user's call via `sfk-signoff`.
- Audit committed work, **including tickets still `in-review`** — verification does not require them to
  be `done`, and it never finalizes a ticket. Closing a ticket is the review gate (`sfk-close-ticket`,
  `sfk-next-ticket`, or `sfk-signoff`), not the verifier's job.
