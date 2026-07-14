# SFK changelog

Changes to the Spec-First Kit, newest first. Each entry is the migration script `sfk-update-kit`
follows: it applies every entry newer than a project's `applied_version` (see `manifest.md`).

For each change, the **Apply** note tells the update skill how to bring it into an existing project:
*refresh* (overwrite the kit-owned file), *add* (insert a new section/heading into a living file),
*amend* (apply a wording/guidance change), or *interview* (ask the user, because content is needed).

---

## v1.0.1 — hardening from first dogfood

Fixes folded in from the first round of real project feedback (consumed per `FEEDBACK.md`). Recurring
theme: a loose agent skipped stated discipline, so the critical gates are now imperative and promoted
into the always-loaded root `CLAUDE.md`.

- **Commit protocol — authoring hands off `git`, building commits.** In Cowork the agent must not touch
  `.git` (a partial commit corrupted the index in a real run); building in Claude Code commits as
  before. **Apply:** add — insert the `## Commit protocol` section into the project's root `CLAUDE.md`
  after `## Commands` (interview if that section was customised); refresh the affected skills
  (`sfk-version`, `sfk-next-milestone`, `sfk-signoff`, `sfk-init`, `sfk-update-kit`).
- **New skill `sfk-close-ticket`** — finalize the current in-review ticket (→ `done`, own commit)
  without starting the next. **Apply:** add — copy `.claude/skills/sfk-close-ticket/` in; no project
  edits needed.
- **Ticket finalize discipline hardened** — `sfk-next-ticket` step 1 is an imperative STOP gate.
  **Apply:** refresh `sfk-next-ticket`; add the "one ticket per commit; finalize before advancing"
  non-negotiable to the root `CLAUDE.md`.
- **Scaffolding is worked ticket-by-ticket** like implementation (not batched). **Apply:** refresh
  `sfk-next-milestone`, `sfk-next-ticket`, `sfk-signoff`, `spec/README.md`.
- **`sfk-verify`: contractual-value sweep (check 6) + fill-in hardening.** **Apply:** amend — merge the
  new check and the fill-in note into the project's filled-in `sfk-verify` (per that skill's merge,
  step 6).
- **Non-negotiable: contractual values are not workarounds; escalate external errors.** **Apply:** add
  to the root `CLAUDE.md` non-negotiables; refresh `sfk-next-ticket`.
- **Commit hygiene** (stage deliberately, never `git add -A`) and **feedback-location** hardening.
  **Apply:** amend `spec/tickets/CLAUDE.md`; refresh `sfk-feedback`.
- **Wireframes: proactively offer interactive HTML mockups.** **Apply:** amend the wireframes template.

---

## v1.0.0 — initial release

Baseline. A project bootstrapped at v1.0.0 needs no migration.

The kit provides:

- The nine-step spec-first method and the milestone lifecycle (`spec/README.md`).
- The living spec templates under `spec/` (brief, requirements, architecture + api-contract,
  wireframes, design system, test-strategy), the milestone plan, and the ticket system (BOARD, CONVENTIONS,
  TICKET-TEMPLATE with an `## In plain English` section, tickets/CLAUDE.md).
- A lean root `CLAUDE.md` and the per-layer `CLAUDE.md` template.
- The workflow skills: `sfk-init`, `sfk-version`, `sfk-next-milestone`, `sfk-signoff`,
  `sfk-next-ticket`, `sfk-verify`, `sfk-update-kit`, `sfk-feedback`.
- The feedback loop: `sfk-feedback` writes to a gitignored `spec/.sfk-feedback/` (seeded by `spec/.gitignore`
  and the `.sfk/templates/feedback/` template); consumed on the SFK side per the repo-root `FEEDBACK.md`.
- Versioning machinery (`.sfk/`).

**Apply:** n/a (baseline).

<!-- Template for future entries:

## vX.Y.Z — <short title>

- <change one>. **Apply:** add — insert `## <heading>` into `spec/<file>` after `<anchor>`; leave its body for the user to fill (interview if they want it filled now).
- <change two>. **Apply:** refresh — overwrite `<kit-owned file>`.
- <change three>. **Apply:** amend — reword `<section>` in `spec/<file>` to match the new pristine template; preserve any user edits.
-->
