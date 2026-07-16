# <PROJECT> — Verify Instructions

| | |
|---|---|
| **Document** | Verify instructions (the project-specific half of `sfk-verify`) |
| **Repository location** | `spec/verify/verify.md` |
| **Status** | Binding for the verifier |

> **Purpose.** `sfk-verify` is a **neutral, kit-owned skill**: it owns the *method* — what to check
> (spec audit, contract conformance, the dependency rule, code quality, honesty of the record, the
> contractual-value sweep). This file owns the *specifics* — **your** gate commands, **your**
> stack-specific checks, and anything extra you want the verifier to do. The skill reads this file every
> run.
>
> **How this file came to exist.** `sfk-verify` creates it on its **first run**, by copying this
> template out and **interviewing you** — at the first batch boundary you have real code, real gates and
> a real spec, so you actually know what the verifier should watch. Replace every `<PLACEHOLDER>`.
>
> **Why the split.** The skill stays kit-owned so method improvements reach you on every kit update
> without touching your content; this file stays yours so your specifics are never overwritten.

---

## 1. Gate commands

> The real commands the verifier runs. Keep these identical to the root `CLAUDE.md` *Commands* section.

- **Default gate:** `<make test>` — must pass with zero warnings.
- **Heavier gates:** `<make test-perf>` / `<make test-e2e>` / `<make test-<heavy>>` — run the one the
  batch affects.
- **Coverage gate (core-touching work):** `<command>`.
- **Dependency-rule / boundary check:** `<command>` (e.g. import-linter, dependency-cruiser).

## 2. Where the binding spec lives

> The documents the audit reads. Adjust if this project renamed or added any.

- Requirements: `spec/requirements/requirements.md`
- Interface contract: `spec/architecture/api-contract.md`
- Architecture + dependency rule: `spec/architecture/architecture.md`
- Design system (if any): `spec/design/design-system.md`
- Wireframes (if any): `spec/wireframes/`

## 3. Contractual values to sweep

> The specific hardcoded values that must match the spec everywhere they appear — the drift that tests
> pass straight over. List the ones this project actually has, and where they are defined.

| Value | Defined in | Notes |
|-------|------------|-------|
| `<e.g. DEFAULT_MODEL>` | `<requirements.md §x>` | `<must match everywhere: code, tests, docs>` |
| `<e.g. MAX_FILE_SIZE_BYTES>` | `<requirements.md §y>` | `<…>` |

## 4. Stack-specific checks

> Checks that only make sense for this stack — the things a generic verifier would miss.

- `<e.g. the pure core imports the standard library only — run the allowlist test>`
- `<e.g. no N+1 queries in the ORM layer>`
- `<…>`

## 5. Extra checks for this project

> From the interview: anything additional you want the verifier to do every run — extra workload,
> project quirks, known traps, things that have bitten before. This is the section the kit cannot
> anticipate.

- `<…>`

## 6. Notes

> Dated record of changes to these instructions — what was added and why. Append as the project learns.

- **<DATE>** — created from the interview at the first `sfk-verify` run.
