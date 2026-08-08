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

## 4a. Red-green evidence (every project)

> Seeded by the kit. This is the **only** definition-of-done item that cannot be re-derived later, so it is
> the only one where a missing record is a permanent loss rather than a chore. Keep this section even on a
> single-model project.

For each `tests_required: true` ticket in the batch, `## Notes` must carry the failing test's **name** and
its **verbatim** failure message, or a named permitted substitute (root `CLAUDE.md` › *Definition of done*).

- **The bar:** can a reader tell a real red-green from a plausible one **without re-running anything?**
  *"All the new tests passed on the first implementation attempt"* cannot — it is equally true of a test
  authored from the spec beforehand and of one written afterwards to fit working code.
- **Report absence; never ask for it to be filled in now.** The evidence cannot be reconstructed after the
  suite is green, so a quote added at audit time is a fabrication — and worse than the gap, because it is
  indistinguishable from a real one. Name the tickets that lack it and treat the pattern as the finding.
- **Expect this to fail more often than the trailer check**, and note the asymmetry when it does: the
  trailers are mechanical, this is prose, and *they fail independently*. A batch with clean trailers on
  every commit and evidence in only some tickets is the normal shape of the problem, not a contradiction.

## 4b. Authorship trailers (only if two models are configured)

> Seeded by the kit because every project configuring **independent test authorship** has the same exposure,
> and it is normally discovered late — at an audit, with the evidence already missing. Delete this section
> if the project runs a single model.

One command shows every commit in a range and its trailers, which is enough to spot a bare batch at a glance:

```
git log --format='%h|%s|%(trailers:key=Co-authored-by,valueonly)' <range>
```

- A ticket **work** commit for a `tests_required: true` ticket should list **two** models; a **finalize** or a
  single-model project's work commit, **one**. A commit with **none** is the finding.
- **Match on the model family, not an exact string.** Trailer display text legitimately varies by runtime
  (`Claude Opus 5` and `Claude Opus 5 (1M context)` can both appear in one repository), and a check that
  rejects a legitimate variant gets switched off — worse than no check.
- **Do not match against the contractual model identifiers** this project pins in its spec (e.g.
  `claude-opus-5`). Those are spec values, not trailer display text; conflating the two gives you a check
  that can never pass.

---

## 5. Extra checks for this project

> From the interview: anything additional you want the verifier to do every run — extra workload,
> project quirks, known traps, things that have bitten before. This is the section the kit cannot
> anticipate.

- `<…>`

## 6. Notes

> Dated record of changes to these instructions — what was added and why. Append as the project learns.

- **<DATE>** — created from the interview at the first `sfk-verify` run.
