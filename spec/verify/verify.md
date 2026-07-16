# Interstate-8.5 — Verify Instructions

| | |
|---|---|
| **Document** | Verify instructions (the project-specific half of `sfk-verify`) |
| **Repository location** | `spec/verify/verify.md` |
| **Status** | Binding for the verifier |

> **Purpose.** `sfk-verify` is a **neutral, kit-owned skill**: it owns the *method* — what to check
> (spec audit, contract conformance, the dependency rule, code quality, honesty of the record, the
> contractual-value sweep). This file owns the *specifics* — **this project's** gate commands,
> stack-specific checks, and anything extra the verifier should do. The skill reads this file every run.
>
> **How this file came to exist.** It was migrated from the project's filled-in v1.0.x `sfk-verify`
> skill during the v1.1.0 kit update, when the skill was made neutral (see §6). Keep it current as the
> project learns.
>
> **Why the split.** The skill stays kit-owned so method improvements reach the project on every kit
> update without touching its content; this file stays the project's so its specifics are never
> overwritten.

---

## 1. Gate commands

> The real commands the verifier runs. Kept identical to the root `CLAUDE.md` *Commands* section and
> `spec/test-strategy/test-strategy.md` §2.2.

- **Default gate:** `lando test` — PHPUnit (Unit/Kernel/Functional, `phpunit.xml`) + PHPCS
  (`Drupal` + `DrupalPractice`, `.phpcs.xml`, scoped to `web/modules/custom` +
  `web/themes/custom/interstate_85`) + PHPStan (`phpstan.neon`, same scope, deprecation rules on) +
  `tooling/check-boundary.sh` (dependency-rule boundary check). Wired via `tooling/run-tests.sh`; must
  pass with **zero warnings**.
- **Heavier gate:** `lando playwright` — the Playwright + Axe FE suite (`tests/playwright/`), against
  the Lando site, via the dedicated `pw` service. Run it for any batch touching the theme or song
  screens.
- **"`lando test-all`"** — there is no single wired command; run `lando test` then `lando playwright`
  from the host (two separate Lando services — see `INT8-006` notes). Required at milestone completion.
- **Boundary check standalone:** `bash tooling/check-boundary.sh` — greps custom modules for
  `use Drupal\interstate_85\...` (theme-namespace imports); fails on any hit.
- **Coverage gate:** none in slice 1 — no numeric coverage gate (no pure-core layer; lazy adoption,
  test-strategy §2.3).
- **Pre-commit hook** (`.githooks/pre-commit`, wired via `git config core.hooksPath .githooks`) runs
  `lando test` automatically.

## 2. Where the binding spec lives

> The documents the audit reads.

- Requirements: `spec/requirements/requirements.md` (`FR`/`NFR`; numeric thresholds are contractual)
- Interface contract: `spec/architecture/api-contract.md`
- Architecture + dependency rule: `spec/architecture/architecture.md` (§2.1)
- Content model (config): `spec/architecture/content-model.md`
- Design system: `spec/design/design-system.md`; tokens: `spec/design/tokens.css`
- Wireframes: `spec/wireframes/`

## 3. Contractual values to sweep

> The specific hardcoded values that must match the spec everywhere they appear — code, tests **and**
> docs. A value correct in most places but drifted in one is exactly what the tests pass over.

| Value | Defined in | Notes |
|-------|------------|-------|
| Result-count / listing rules (complete list, **no pagination**; default type = Modest Mouse) | `requirements.md` FR-6–FR-9 | Must match everywhere: code, tests, docs. |
| Interface shapes / paths (`GET /songs`, `GET /songs/<slug>`; 404 for unknown slug) | `api-contract.md` | Request/response shapes, status codes, error envelope. |
| Content-type / field machine names (e.g. `field_exclude_from_list`, `field_legacy_id`, `Song_Live`) | `content-model.md` | Machine names must match the exported config field-for-field. |
| Design tokens | `spec/design/tokens.css` | Theme/SDC must reference the CSS custom properties — **never** hardcoded hex/px. |

## 4. Stack-specific checks

> Checks that only make sense for this Drupal stack — the things a generic verifier would miss.

- **No hand-authored config YAML.** Config is generated in the Drupal admin UI/API and exported, then
  diffed against `content-model.md` field-for-field. Hand-edited config YAML is a **critical** finding,
  not a style note.
- **Deprecation-clean.** PHPStan (`phpstan.neon`, deprecation rules) reports **no deprecated-API
  usage** in custom code — the on-mission guard against the PHP-EOL trap that ended v2.
- **Tokens not hardcoded.** Theme/SDC changes reference `spec/design/tokens.css` custom properties;
  flag any hardcoded hex/px values that should be tokens.
- **Dependency rule.** Run `bash tooling/check-boundary.sh` (or `lando test`, which includes it):
  `content-model → services → theme`, `migration → content-model`, nothing imports `theme`
  (architecture §2.1). Custom modules must not import the theme namespace (`Drupal\interstate_85\...`).

## 5. Extra checks for this project

> Anything additional the verifier should do every run — project quirks, known traps, things that have
> bitten before.

- **Ticket `depends_on` graph agrees with the import contracts.** Confirm `spec/tickets/BOARD.md`'s
  dependency graph still matches the architecture layering (NFR-5).
- **Design source.** Theme component shapes must derive from the canonical hi-fi HTML
  (`spec/design/interstate-8-design-refinement/project/Interstate-8 1B.dc.html`), **never** the raw
  SVG/image assets — flag any component built off the wrong source.

## 6. Notes

> Dated record of changes to these instructions — what was added and why.

- **2026-07-15** — created during the v1.1.0 kit update. Migrated the gate commands and stack-specific
  checks out of the project's filled-in v1.0.x `sfk-verify` skill (backed up before the copy per the
  changelog `Pre-copy` note), when the skill was made neutral and kit-owned.
