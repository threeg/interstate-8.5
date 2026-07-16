---
name: sfk-verify
description: Post-batch verification pass — audit completed work against the binding spec and review code quality, then propose cleanup tickets. Reads its project-specific gate commands and checks from spec/verify/verify.md, creating that file by interview on first run. Trigger on "verify", "review this batch", "run the verifier", or "spec-audit the recent work".
---

# sfk-verify — post-batch spec audit + quality review

Run after a batch of related tickets completes — before the gate the batch feeds into. Verification is
a first-class step: tests answer "is the code correct?"; this answers "does the code implement what the
spec *says*?" — a different question that tests alone do not cover.

> **This skill is neutral and kit-owned — never edit it.** It owns the *method* (what to check, below).
> The *specifics* — your gate commands, your stack-specific checks, your extra checks — live in
> **`spec/verify/verify.md`**, which is yours. That split is deliberate: kit updates improve the method
> for free without touching your content, and your content is never overwritten.

## Procedure

1. **Load your instructions — or create them.** Read `spec/verify/verify.md`.
   - **If it does not exist, create it now, by interview.** Copy
     `.sfk/templates/spec/verify/verify.md` out to `spec/verify/verify.md`, then **interview the user**
     before filling it: the real **gate commands**; the **contractual values** that must match the spec
     everywhere (model names, endpoints, thresholds, named constants — and where each is defined); any
     **stack-specific checks** a generic verifier would miss; and — ask explicitly — **anything extra
     they want the verifier to do every run** (extra workload, project quirks, traps that have bitten
     before). Fill the copy, commit it per the **Commit protocol** (root `CLAUDE.md`), then continue.
   - Every later run just reads the file. If the user mentions a new check, offer to add it to §5.

2. **Run the checks below**, using the commands and specifics from `spec/verify/verify.md`.

## What to check

1. **Spec audit (requirement by requirement).** For each `FR`/`NFR` the batch's tickets `implement`,
   open the requirements document and confirm the behaviour matches — exact thresholds, ordering,
   boundary conditions, error cases. Flag loose interpretations and missing edge cases, not just
   outright bugs.
2. **Contract conformance.** Where the batch touched the interface, confirm requests/responses match
   the interface contract exactly (shapes, status codes, error envelope).
3. **Architecture & dependency rule.** Confirm no layer imports something it may not (run the
   boundary-enforcement command from §1 of your instructions), and that the ticket `depends_on` graph
   still agrees with the import contracts.
4. **Code quality.** Look for duplication, dead code, needless complexity, and efficiency traps the
   tests would pass but a gate would later fail (e.g. an N+1 query, an unbounded loop, a missing index).
   Run the default gate and any heavier gate the batch affects.
5. **Honesty of the record.** Confirm each ticket's status, `## Notes` completion report, and `BOARD.md`
   row were updated in the same commit as the work — including that red-green was followed or the layer
   is a stated exemption.
6. **Contractual-value sweep.** Grep the code, the tests, **and** the docs for the contractual values
   listed in §3 of your instructions, and confirm each still matches the spec. A value that is correct
   in most places but drifted in one is exactly what the tests pass over; this is the check that catches
   it.
7. **The project's own extra checks** — everything in §4 and §5 of your instructions.

## What to produce

- A short findings list, each tagged **critical** (would fail a gate — promote into the main sequence
  before that gate) or **improvement** (work at discretion between batches).
- For accepted findings, draft **cleanup tickets** per `spec/tickets/CONVENTIONS.md` §6: ordinary
  `task` tickets, `batch: cleanup`, `implements: []`, numbered after the current highest id, placed in
  the Cleanup backlog table in `BOARD.md`. Do not auto-promote — flag candidates and let the user decide.

## Rules

- **Never edit `.sfk/`** — it is the kit's read-only source (templates, changelog, manifest).
- **Never edit this skill.** It is kit-owned and refreshed wholesale on a kit update. Project-specific
  content belongs in `spec/verify/verify.md`.
- Verification proposes tickets; it does not silently rewrite shipped code.
- A finding that reveals a genuine spec gap is a specification change (CONVENTIONS §5.5), recorded in
  `spec/` first — not a cleanup ticket.
- Never sign off a milestone here; that is the user's call via `sfk-signoff`.
- Audit committed work, **including tickets still `in-review`** — verification does not require them to
  be `done`, and it never finalizes a ticket. Closing a ticket is the review gate (`sfk-close-ticket`,
  `sfk-next-ticket`, or `sfk-signoff`), not the verifier's job.
