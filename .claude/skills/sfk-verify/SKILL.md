---
name: sfk-verify
description: Verification pass, in one of two modes. Spec mode reviews the specification against itself for drift, contradiction and leftovers, before ticket generation turns it into work. Code mode audits completed work against the binding spec and reviews code quality, then proposes cleanup tickets. Reads project-specific gate commands from spec/verify/verify.md in code mode only. Trigger on "verify", "run the verifier", "review this batch", "spec-audit the recent work", "review the spec", "check the spec for drift", or "verify the spec".
---

# sfk-verify — verification pass (spec mode or code mode)

Verification is a first-class step, and there are two distinct things worth verifying:

- **Spec mode** — *does the specification agree with itself?* Run at the end of the authoring milestones,
  **before ticket generation**, because that is where the spec becomes work: a contradiction that survives
  into tickets becomes code. The spec is authored across several milestones, each in its own session, so no
  context ever holds all of it at once — per-milestone sign-off cannot see cross-document drift by
  construction. This mode is what closes that gap.
- **Code mode** — *does the code implement what the spec says?* Run after a batch of related tickets, before
  the gate the batch feeds into. Tests answer "is the code correct?"; this answers a different question that
  tests alone do not cover.

> **This skill is neutral and kit-owned — never edit it.** It owns the *method* (what to check). In **code
> mode** the project's specifics — gate commands, stack-specific checks, extra checks — live in
> **`spec/verify/verify.md`**, which is yours. **Spec mode needs no configuration at all:** spec coherence
> is structural, so the checks are the same in every project.

## Procedure

1. **Determine the mode first — everything else depends on it.** `sfk-verify` runs **only at the user's
   explicit request**, never on your own initiative (see Rules). Establish which mode, in this order:
   - **An explicit argument wins** — `/sfk-verify spec` or `/sfk-verify code`, or the user simply saying
     which they want.
   - **Otherwise infer it from the milestone the current version is on**, read from the *Current position*
     in `spec/milestone-plan.md`: an **authoring** milestone (brief → requirements → architecture →
     wireframes → design → test strategy → ticket generation, or their delta equivalents) means **spec
     mode**; a **building** milestone (scaffolding, tooling deltas, implementation) means **code mode**.
   - **If that is unclear, ask** — one line, then wait.

   > **Do not decide by whether code exists.** From the second version onward there is *always* code, and
   > the spec still needs reviewing before that version's tickets are generated. The phase of the **current
   > version** is the signal; the age of the repository is not. Read it from `spec/milestone-plan.md` — never
   > probe `.git` to infer it (root `CLAUDE.md`, *Commit protocol*).

2. **Confirm the run as a single structured choice, then wait.** State three things — the **mode** you
   determined, the **model** that will run the audit, and **what you are about to audit** (the batch, or the
   spec milestones) — then put **one** question with a fixed option list rather than asking for free text:

   **1. Proceed** · **2. Change mode** (run the other one instead) · **3. Switch model first** · **4. Abort**

   Use the runtime's native option-picker where there is one; a numbered list reads identically in plain text.

   - **On the model:** name the model currently driving this session plainly. If the project configures a
     distinct grader model (root `CLAUDE.md` › *Project & kit* › *Models*, e.g. a stronger `tests` model),
     **recommend switching to it** — verification is a *grader* task, breadth-first review across many files,
     so running it under the cheaper `implementation` model is the wrong default, for the same "grader ≠
     graded" reason the tests model exists. You **cannot** switch it yourself, so option 3 means *the user
     changes it and re-invokes*; say that plainly rather than implying you will do it.
   - **Stating the mode is what makes a wrong inference cheap to correct** — option 2 exists precisely so
     correcting it costs a click rather than a sentence.

   This is **one** question, not an interview — the "not an interview" rule guards against a *series* of
   questions before any work starts, not against a single well-formed one. Do not start the checks in the
   same turn you announce them.

   > **Why a picker here and not everywhere.** Two of these four options are *corrections* — of an inferred
   > mode, or of a model you have just recommended against — and free text handles a correction worst, because
   > the user writes a sentence you must then interpret. A picker is earned by a **closed set of
   > mutually-exclusive actions**, which this is. It is *not* the right shape for the kit's other
   > announce-then-wait gates: the batch-boundary offer is a yes/no, and `sfk-signoff`'s register sweep is
   > "report and ask once, never block". Applying a picker to those would be ceremony. Judge by whether the
   > answers form a closed set, not by whether there is a wait.

3. **Load your instructions — code mode only.** Read `spec/verify/verify.md`.
   - **If it does not exist, create it now, by interview.** Copy
     `.sfk/templates/spec/verify/verify.md` out to `spec/verify/verify.md`, then **interview the user**
     before filling it: the real **gate commands**; the **contractual values** that must match the spec
     everywhere (model names, endpoints, thresholds, named constants — and where each is defined); any
     **stack-specific checks** a generic verifier would miss; and — ask explicitly — **anything extra
     they want the verifier to do every run** (extra workload, project quirks, traps that have bitten
     before). Fill the copy, commit it per the **Commit protocol** (root `CLAUDE.md`), then continue.
   - Every later run just reads the file. If the user mentions a new check, offer to add it to §5.
   - **In spec mode, skip this step entirely** — do **not** create `verify.md`, and do **not** interview.
     Spec mode is fully neutral, and a project reviewing its spec before the first line of code has no gate
     commands to give you yet.

4. **Run the checks for that mode** — §A for spec mode, §B for code mode, plus §C either way.

---

## §A — Spec-coherence checks (spec mode)

Read **all** the authoring deliverables together; that combined read is the entire point. Report findings
with the file and section on both sides of each one.

1. **Coverage, forwards.** Every `FR`/`NFR` has something that realises it: architecture support, a
   contract surface where one is implied, and a place in the test strategy. A requirement nothing realises
   is either unimplementable as written or was quietly dropped.
2. **Coverage, backwards.** Every contract surface, module and screen traces to a requirement. Anything
   that doesn't is scope nobody agreed — the more common direction of drift, and the harder to see.
3. **The brief still describes the spec.** Each goal in the brief has requirements delivering it, and the
   spec has not grown past the brief's scope or out-of-scope list. This is the *did we actually specify
   what we set out to build* check.
4. **Cross-document contradiction.** The same fact stated two ways: a threshold that differs between
   requirements and architecture prose, a field a wireframe shows that the contract doesn't provide, design
   tokens for components absent from the wireframes, a test-strategy layer the architecture doesn't have.
   **Numeric and named values are contractual** — a mismatch is never cosmetic.
5. **Testability.** Every `NFR` has a measurable threshold, and every `FR` states observable behaviour with
   its boundaries and error cases. "Fast", "intuitive", "robust" are findings — they cannot fail a test.
6. **Terminology drift.** One concept under several names across documents (or one name meaning different
   things). Cheap to fix now; expensive once it is in code, tests and tickets.
7. **Leftovers.** Placeholder text still in a signed-off document; a `(to confirm)` marker that should be a
   row in `spec/open-questions.md`; a section left as template guidance; a `TODO` in a binding document.
8. **Register integrity.** Every `Q-n`/`S-n` cited in the spec exists in `spec/open-questions.md`, and every
   open row is still real. Every id family in use appears in `spec/id-registry.md`. Any assumed value with
   no row is a finding.
9. **Ready for ticket generation.** Could a dependency-ordered ticket queue be derived from this spec as it
   stands, without asking a question the documents should already answer? Name what a ticket author would
   still have to guess.

### Spec mode's three limits

> **1. Report inconsistency and ambiguity — never dispute a settled decision.** *"Requirements say 25,
> architecture prose says 30"* is the job. *"25 seems low to me"* is not: it reopens a decision the user
> signed off, against the root `CLAUDE.md` non-negotiable. If you believe a decision is genuinely wrong,
> say so once, plainly, as a separate note — and do not fold it in with the findings.
>
> **2. Findings become spec amendments, never tickets.** There is no code to fix. Each finding resolves one
> of three ways: **amend** the owning document (the normal case), **open a row** in
> `spec/open-questions.md` if it needs information you don't have, or **park** it in `spec/TODO.md` if it
> needs a decision that does not exist yet. Never create a ticket from a spec-mode finding.
>
> **3. Amending a signed-off document needs the user's explicit approval, and a decisions-log line.**
> Every document you are reviewing has already been approved. Present the finding and the proposed
> amendment, get a yes, then amend **in place** and record what changed and why in that document's
> decisions log. Never silently edit an approved deliverable. In the authoring phase you are in a
> **hand-off** runtime: present the `git` commands, run none yourself (root `CLAUDE.md`).

---

## §B — Code checks (code mode)

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
   - **Check the ordering record mechanically.** For every ticket with a `before:` list (CONVENTIONS.md
     §4.6): its `BOARD.md` row must sit **above** every id it names, and its `flag` cell must mirror the
     field. Conversely, every `🔺` on the board must correspond to a real `before:`. This is worth a
     deliberate check because it is the one constraint with **no other way to fail loudly** — it lives in
     row position, and a re-sort, a version-section move, or a hand edit drops it leaving the board
     looking perfectly ordinary. Report a broken pair as a finding: a promoted ticket that has drifted
     below the gate it was promoted ahead of is a gate failure waiting to happen.
   - **Check the authorship trailers, not just the prose.** Where the project configures a distinct `tests`
     model, a `tests_required: true` ticket's **work** commit should carry a `Co-authored-by` trailer for
     **both** models; a finalize carries one. **Prose and trailers fail independently** — faultless red-green
     notes sit happily beside a commit with no trailer at all, which is why this goes unnoticed without a
     deliberate check. Verify the trailers *mechanically* (see §4b of your instructions for the command), and
     match on the **model family**, never an exact string or the project's contractual model identifiers.
6. **Contractual-value sweep.** Grep the code, the tests, **and** the docs for the contractual values
   listed in §3 of your instructions, and confirm each still matches the spec. A value that is correct
   in most places but drifted in one is exactly what the tests pass over; this is the check that catches
   it.
   - **Unconfirmed values must cite their open question.** For each row in `spec/open-questions.md`,
     search its id (`Q-4`, `S-2`) across `spec/` and the code and confirm every place built on that
     assumption references it. Then look for the reverse: a value that *looks* assumed — a magic number or
     a literal with no spec section behind it — and no row anywhere. Report either as a finding; this is
     the miss that only an audit catches, and it is expensive because the assumption gets baked into
     fixtures. Report it — do **not** treat it as a gate failure, since identifying an assumed value needs
     judgement and a false positive here trains people to ignore the check.
7. **The project's own extra checks** — everything in §4 and §5 of your instructions.

---

## §C — Hygiene checks (both modes)

1. **The specification index is honest.** Two mechanical passes over `spec/contents.md`, both cheap and
   both objective: every `spec/**/*.md` appears exactly once (excluding `tickets/<PRJ>-*.md`, which
   `BOARD.md` indexes), and every entry still points at a file that exists. A missing row hides a document
   from everyone reading the spec; a stale row is a broken link that looks authoritative. Fix them in place
   rather than reporting them — this is bookkeeping, not a judgement call. Skip if the file doesn't exist.
2. **Sharpen the open-questions register.** Is any question now *sharper* than when it was written — has
   this milestone or batch taught you what you actually need? Rewrite it in place; a named ask gets answered
   in an afternoon where a vague one waits for a meeting. Has any become **more expensive to answer** than
   when it was opened? Note that in the register's notes log, so deferring stays an informed decision rather
   than an invisible one.

---

## What to produce

**Both modes:** a short findings list, each tagged **critical** or **improvement**, each naming the exact
file and section. If a check found nothing, say so — a silent check is indistinguishable from a skipped one.

- **Spec mode:** for each finding, the proposed **amendment** and which document owns it. Group them so the
  user can approve in batches. Nothing is edited before they say yes, and nothing becomes a ticket. Close by
  stating plainly whether the spec is ready for ticket generation, and if not, what is outstanding.
- **Code mode:** for accepted findings, draft **cleanup tickets** per `spec/tickets/CONVENTIONS.md` §6:
  ordinary `task` tickets, `batch: cleanup`, `implements: []`, numbered after the current highest id, placed
  in the Cleanup backlog table in `BOARD.md`. Do not auto-promote — flag candidates and let the user decide.
  **If the user promotes one, record it in all three places in one commit** (§6.5): set `before:` on the
  promoted ticket naming what it must precede, move its row into the main-sequence table above that
  ticket, and put `🔺 before <id>` in the row's `flag` cell. A cleanup ticket is numbered *after*
  everything it cleans up, so this edge can never be a `depends_on` (§4.6) — without `before:`, the only
  record of the constraint is row position, which no later reader or re-sort will preserve.

## Rules

- **User-triggered only — never self-invoke.** Run `sfk-verify` solely on the user's explicit request.
  Reaching a batch boundary, or the ticket-generation gate, is **not** standing authorization: *offer* it and
  **wait** for a yes. Stating intent and acting on it in the same turn is not asking.
- **State the mode you are running**, and never run both in one pass. If the user wants both, run twice.
- **Never edit `.sfk/`** — it is the kit's read-only source (templates, changelog, manifest).
- **Never edit this skill.** It is kit-owned and refreshed wholesale on a kit update. Project-specific
  content belongs in `spec/verify/verify.md` — and only code mode has any.
- Verification proposes changes; it does not silently rewrite shipped code, and it does not silently edit an
  approved spec document.
- A finding that reveals a genuine spec gap is a specification change (CONVENTIONS §5.5), recorded in
  `spec/` first — not a cleanup ticket. In spec mode, that is *every* finding.
- Never sign off a milestone here; that is the user's call via `sfk-signoff`.
- **Code mode:** audit committed work, **including tickets still `in-review`** — verification does not
  require them to be `done`, and it never finalizes a ticket. Closing a ticket is the review gate
  (`sfk-close-ticket`, `sfk-next-ticket`, or `sfk-signoff`), not the verifier's job.
