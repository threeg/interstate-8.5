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
- **Pre-commit hook** (`.githooks/pre-commit`) — **opt-in, and deliberately left unwired.** It runs the
  full `lando test`, which is far too slow to sit on every commit; INT8-006 wired it via a
  `composer.json` post-install step and that was removed five days later (`2d063b9`, 2026-07-12) for
  exactly that reason. **Do not wire it**, and do not read an unset `core.hooksPath` as a mistake to fix:

  ```
  git config core.hooksPath        # expected: empty. '.githooks' means someone opted in.
  ```

  **What this means for the verifier: nothing gates a commit automatically.** There is no CI in slice 1
  either (test-strategy §10), so the *only* thing standing between a red gate and a commit is the
  operator running `lando test` by hand before the ticket reaches `in-review` (root `CLAUDE.md`,
  *Definition of done*). Treat "the gate was run" as a claim to check against the ticket's `## Notes`,
  not as something the tooling guaranteed.

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

## 4b. Authorship trailers

> This project configures **independent test authorship** (root `CLAUDE.md`, *Models*), so every ticket
> commit should name the model(s) that produced it. Seeded by the kit at v1.4.1 because this exposure is
> normally discovered late — at an audit, with the evidence already missing.

One command shows every commit in a range and its trailers, which is enough to spot a bare batch at a glance:

```
git log --format='%h|%s|%(trailers:key=Co-authored-by,valueonly)' <range>
```

- A ticket **work** commit for a `tests_required: true` ticket should list **two** models (the independent
  test author *and* the implementer); a **finalize** — which is status-only — should list **one**. A commit
  with **none** is the finding.
- **Match on the model family, not an exact string.** Trailer display text legitimately varies by runtime
  (`Claude Opus 5` and `Claude Opus 5 (1M context)` can both appear in one repository), and a check that
  rejects a legitimate variant gets switched off — worse than no check.
- **Do not match against the contractual model identifiers** this project pins in the root `CLAUDE.md`
  (`claude-sonnet-5`, `claude-opus-4-8`). Those are spec values, not trailer display text; conflating the
  two gives you a check that can never pass.

---

## 5. Extra checks for this project

> Anything additional the verifier should do every run — project quirks, known traps, things that have
> bitten before.

- **Ticket `depends_on` graph agrees with the import contracts.** Confirm `spec/tickets/BOARD.md`'s
  dependency graph still matches the architecture layering (NFR-5).
- **Design source.** Theme component shapes must derive from the canonical hi-fi HTML
  (`spec/design/interstate-8-design-refinement/project/Interstate-8 1B.dc.html`), **never** the raw
  SVG/image assets — flag any component built off the wrong source. The full artefact-by-artefact rule is
  `spec/design/design-system.md` §1.1 (*Artefact authority*); check a ticket's `## Design authority`
  section cites it rather than naming "the mockup".
- **`before:` and the board's flag column agree.** For every ticket carrying a `before:` id, confirm its
  `BOARD.md` row sits above the ticket named and its `flag` cell says so (CONVENTIONS.md §4.6/§6.5). This
  is the one ordering constraint with no other way to fail loudly — a re-sort, a version-section move or a
  hand edit drops it while leaving the board looking perfectly ordinary.
- **`spec/contents.md` is complete.** Every `*.md` under `spec/` appears exactly once (ticket files
  excepted — `BOARD.md` is their index), and every entry still points at a file that exists.

## 6. Notes

> Dated record of changes to these instructions — what was added and why.

- **2026-08-01** — v1.4.3 kit update. Added §4b (authorship trailers, kit-seeded — this project runs two
  models), and three extra checks in §5: the `before:`/flag agreement audit, the `spec/contents.md`
  completeness check, and a pointer from the design-source check to the new `design-system.md` §1.1.
- **2026-08-01** — **Corrected §1's pre-commit claim, which had it backwards.** The bullet said the hook
  "runs `lando test` automatically". `core.hooksPath` was unset, and the first assumption — that this was
  an oversight — was wrong: the hook had been made **opt-in on purpose** in `2d063b9` (2026-07-12)
  because running the whole gate on every commit is too slow. Wiring it to match the document would have
  been fixing the wrong half. The bullet now records the decision, says explicitly not to wire it, and
  spells out the consequence for the verifier: with no hook and no CI, nothing gates a commit
  automatically, so "the gate was run" is a claim to check rather than a guarantee.
- **2026-07-15** — created during the v1.1.0 kit update. Migrated the gate commands and stack-specific
  checks out of the project's filled-in v1.0.x `sfk-verify` skill (backed up before the copy per the
  changelog `Pre-copy` note), when the skill was made neutral and kit-owned.
