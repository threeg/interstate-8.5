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
   >
   > **By that test, the other place a picker is earned is the findings queue** (*What to produce*). Each
   > finding resolves one of three ways the skill already enumerates — amend, open a register row, park —
   > with rejection being the user declining. That is a closed set, so it takes the same shape. Read this
   > note as naming **two** places, not as an argument against pickers generally.

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

   > **Every sweep carries a positive control, or it is not reported as clean.** Several checks below are
   > greps — contractual values (§B.6), register-id citations (§A.8), assumed values with no row. **A zero
   > result is not evidence of absence; very often it means the sweep did not run.** So run a second
   > pattern you *know* is present, and report its hit count beside the zero. If the control also returns
   > nothing, the sweep is broken: report that check as **not run**, never as clean.
   >
   > **The control must be the identical invocation, differing only in the pattern.** This is the part
   > that is easy to get wrong and it defeats the whole guard: a control run through a slightly different
   > command exercises a different code path and vouches for a sweep that never executed. Same tool, same
   > flags, same pathspec, same pipeline — change the pattern and nothing else.
   >
   > **Why a sweep fails silently** — the causes vary by machine, which is exactly why the control matters
   > more than any list of them: a file list passed as an unquoted variable arriving as one filename, a
   > `grep` that is not the implementation you assumed, `xargs` resolving a different binary than your
   > interactive shell, a pattern that does not match the corpus's actual form. All of them exit as though
   > the pattern genuinely matched nothing.
   >
   > **One cause is not environmental and every project hits it: pathspec globs.**
   > `git grep -- 'spec/**/*.md'` silently **skips every top-level file in `spec/`** — the index, the
   > method guide, the parking lot, the open-questions register, the id registry, the milestone plan —
   > because git's `**/` needs a real directory boundary. Those are precisely the files §A.7 and §A.8 are
   > about. Use **`git grep -- 'spec/*.md'`**, which reaches every depth: a git pathspec `*` **crosses
   > `/`**, unlike a shell glob. That difference is the whole bug, and it reads like the obvious way to
   > say *"every specification document"*.
   >
   > **A control proves the sweep *ran*. It does not prove the pattern was *right*.** These are different
   > failures and the control only catches the first. When you are searching for a **concept** rather than
   > a literal string — *"is there a rule about ordering?"*, *"is this value cited anywhere?"* — a control
   > returns hits, the sweep returns nothing, and both are working exactly as designed while you conclude
   > something false.
   >
   > **Two questions, two remedies. Do not apply the wrong one.**
   >
   > - **A *rule* sweep — "does a rule about X exist?"** Read the section that would hold it. **Do not grep
   >   for wording you have guessed.**
   > - **A *phrase* sweep — "where is this cited?"** There is no section to read: the thing you are looking
   >   for is scattered free text. So **enumerate the spellings** before you start, search
   >   **case-insensitively**, and carry the control as always. A compound noun that is *sometimes*
   >   hyphenated is the common trap — `cleanup backlog` / `cleanup-backlog`, and the same for `red-green`,
   >   `record-correction`, `open-questions`, `per-version`. Searching one spelling returns a plausible
   >   number of hits and silently omits the rest.
   >
   > That distinction has cost real work: a sweep for `cleanup backlog` found 21 references across 11 files
   > and **missed the one citation the exercise existed to find**, because that ticket wrote it hyphenated.
   > Adding the variant took it to 27 across 13.
   >
   > **For a rule sweep specifically:** A zero result there does not merely under-report — it licences
   > **inventing a rule that already exists**, which is worse than missing one. This has happened: a
   > project searched the kit for *"newest first"*, *"reverse"* and *"descending"*, never for **"latest
   > first"** — the phrase actually used — and filed a confident report that the kit had never specified
   > ordering. The rule had been there since v1.0.0.
   >
   > **This applies to sweeps over `.sfk/` as much as over the project.** Establishing what the *kit*
   > requires is the same hazard with a worse consequence, because the conclusion becomes a new convention.
   >
   > **If you delegate any sweep to a subagent, put this rule in its prompt.** Each one inherits the
   > hazard independently and cannot see the parent's method.

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
   **Numeric and named values are contractual between *binding* documents** — a mismatch there is never
   cosmetic.

   > **A design artefact is not a value source.** A wireframe binds layout and composition; a design system
   > binds appearance. A number *inside* one — a character count in a drawn field, a price in a mockup — is
   > usually **sample content**, and the spec changing it is not a defect in the drawing. Reporting it as
   > one costs a round trip on a non-issue, and worse, points at editing the artefact.
   >
   > **Read the project's own design-authority statement before reporting any design finding.** Mature
   > projects state which artefact binds which kind of fact; that statement decides this, not your own
   > re-derivation. If it binds layout, composition or appearance and the number is content, **it is not a
   > finding**. If the number is *visibly* misleading — an implementer could read it as the bound — say so
   > as an **improvement**, never a critical.
   >
   > **Never propose an edit to a generated artefact.** Before proposing any change, check whether the file
   > is hand-maintained or a tool export / build output. A manual edit to an export is overwritten by the
   > next one, so the honest options are a re-export or leaving it — and a re-export is a much larger ask
   > than an edit, which the user should be the one to weigh. This applies to any generated file, not only
   > design: an export, a lockfile, a build artefact, a generated client.
5. **Testability.** Every `NFR` has a measurable threshold, and every `FR` states observable behaviour with
   its boundaries and error cases. "Fast", "intuitive", "robust" are findings — they cannot fail a test.
6. **Terminology drift.** One concept under several names across documents (or one name meaning different
   things). Cheap to fix now; expensive once it is in code, tests and tickets.
7. **Leftovers.** Placeholder text still in a signed-off document; a `(to confirm)` marker that should be a
   row in `spec/open-questions.md`; a section left as template guidance; a `TODO` in a binding document.
8. **Register integrity — and it runs both ways.** Every `Q-n`/`S-n` cited in the spec exists in
   `spec/open-questions.md`, and every open row is still real. **This is a sweep — carry a positive
   control** (step 4): a citation census that silently matched nothing reads exactly like a register with
   no citations, and has been acted on as one. Every id family in use appears in `spec/id-registry.md`.
   Any assumed value with no row is a finding.
   - **The reverse direction: is each open row cited in the document it affects?** For every open row that
     names an **`Owning document`**, check that document's own text contains the row's id. A row can be
     perfectly recorded here and appear nowhere in the document a reader would actually meet it in —
     leaving an unconfirmed value looking settled to everyone except whoever wrote the register. The next
     reader is usually a fresh session with no memory of the conversation that opened it.
   - **Skip a row whose `Owning document` is blank** — the column is optional (see that file), so an
     unfilled cell is not a finding. Report it as *not checked*, never as passing.
9. **Ready for ticket generation.** Could a dependency-ordered ticket queue be derived from this spec as it
   stands, without asking a question the documents should already answer? Name what a ticket author would
   still have to guess.

### Spec mode's four limits

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
> **3. Check the artefact is hand-maintained before proposing a change to it.** Some things under `spec/`
> are **generated** — a design-tool export, a rendered mockup, a produced diagram. A manual edit to one is
> overwritten by the next export, so proposing an edit there is proposing work that will silently vanish.
> Say the artefact is generated, name what a re-export would cost, and let the user decide — including
> deciding not to.
>
> **4. Amending a signed-off document needs the user's explicit approval, and a decisions-log line.**
> Every document you are reviewing has already been approved. Present the finding and the proposed
> amendment, get a yes, then amend **in place** and record what changed and why in that document's
> `decisions.md` beside it. Never silently edit an approved deliverable. In the authoring phase you are in a
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
   - **And check the promoted ticket explains itself.** For each `🔺` row, does that ticket's own
     `## Background` say **why** it was promoted — which gate, and what would have failed? If not, report
     it. **This is the only cheap moment.** While the ticket is open the answer is recoverable; once it is
     `done` the reasoning survives only wherever it was written down at the time, and if that was a note
     beside the board it is in a *derived* document that a later tidy-up will treat as disposable. One
     project found historic promotions whose sole record was board prose, and one ticket that explicitly
     cited the board as the authority — so deleting that prose would have broken a live reference.
     Report; do not write the explanation yourself.
   - **Check that the red was quoted, not asserted.** For every `tests_required: true` ticket in the batch,
     `## Notes` must carry the failing test's name and its **verbatim** failure message (root `CLAUDE.md` ›
     *Definition of done*), or a named permitted substitute. A sentence like *"all tests passed on the first
     attempt"* is an **absence of evidence, and report it as one** — it is equally consistent with a test
     authored from the spec beforehand and one written afterwards to fit working code.

     This check cannot prove authorship *order*; nothing can, after the fact. What it does is make the
     absence **loud rather than silent**, which is the whole difference: in one observed batch the
     mechanically-checked authorship trailers were clean on all 43 commits while the unverifiable prose was
     missing from six of eight tickets. Do **not** ask for the evidence to be added now — it cannot be
     reconstructed, and a retrofitted quote is a fabrication. Report which tickets lack it, and treat the
     pattern as the finding.
   - **Check the authorship trailers, not just the prose.** Where the project configures a distinct `tests`
     model, a `tests_required: true` ticket's **work** commit should carry a `Co-authored-by` trailer for
     **both** models; a finalize carries one. **Prose and trailers fail independently** — faultless red-green
     notes sit happily beside a commit with no trailer at all, which is why this goes unnoticed without a
     deliberate check. Verify the trailers *mechanically* (see §4b of your instructions for the command), and
     match on the **model family**, never an exact string or the project's contractual model identifiers.
6. **Contractual-value sweep.** Grep the code, the tests, **and** the docs for the contractual values
   listed in §3 of your instructions, and confirm each still matches the spec. **Carry a positive control
   through the identical invocation** (step 4) — a clean sweep here is a claim of no drift, and it is
   worthless if the command never matched anything. A value that is correct
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

> **Numbering findings: they are labels for this pass, not ids.** Numbering them (`F1`, `F2`, …) makes the
> conversation workable, and the sequence **restarts every pass** — so a label only means anything inside
> the pass that produced it.
>
> **Never write one into a durable document.** Not into a ticket's `## Background`, not into `BOARD.md`, not
> into `spec/verify/verify.md`. Once a finding is accepted it **has** a permanent id — the cleanup ticket it
> became — and that is what a lasting reference cites; if it was rejected, restate the finding in words.
> Writing `F7` into a document creates a citation that resolves to nothing as soon as the next pass mints
> its own `F7`, and this has happened: two unrelated findings from two passes were both cited as bare `F7`
> in different documents, silently breaking `spec/id-registry.md`'s binding rule that **ids are permanent —
> never reused, never renumbered.**
>
> **A finding is ephemeral by design**, which is why it needs no id: it either becomes a ticket (which has
> one) or it is rejected. If a project genuinely wants durable finding ids, that is a **new id family** —
> stop and offer to add a row to `spec/id-registry.md` naming what it means, where it is defined and what
> scopes it, per that file's rule *"add a row when you invent a family, not when you invent an id"*. Do not
> start minting durable labels without one.

- **Spec mode: a short summary, then the decisions as a queue.** Nothing is edited before the user says
  yes, and nothing becomes a ticket.

  **First, split every finding into one of two kinds — this is what removes most of the reading.**
  - **A correction with a determinable right side.** One document says six and three say seven: the
    direction is settled by the evidence, and only the amendment is left. **State the direction and the
    evidence, and apply on approval — do not put these in the queue.** On a mature spec these are often
    about half the criticals, and queueing them is pure ceremony.
  - **A decision.** The evidence does not settle it; the user has to choose. Only these are queued.

  **Then produce, in this order:**
  1. **A short summary** — what was audited, how many findings, the verdict on readiness for ticket
     generation, and the few that genuinely block it. Prose is right here.
  2. **The corrections**, grouped by owning document, for batch approval.
  3. **The decisions, one question at a time** — 2–4 named options, **your recommendation first and marked
     as such**, and each option carrying **its cost**, not just its label. Use the runtime's picker where
     there is one; a numbered list reads identically without.
  4. **Ask in rounds.** Some answers create follow-on questions the first round cannot know — in one pass,
     choosing live filtering over reload created a trap (a client-side filter sees only the rendered page,
     so a search for something on page 3 finds nothing) that surfaced only once the first answer was in. A
     second short round caught it before anything was written down.

  **The recommendation has to be real, or this is just a different widget for the same work.** A queue of
  neutral options moves the thinking back to the user, which is what it exists to prevent. Recommend, and
  expect to be overridden sometimes — that is the mechanism working.

  Close by stating plainly whether the spec is ready for ticket generation, and if not, what is outstanding.

  > **Why this and not a prose report.** On a mature spec — nine binding documents, ~7,000 lines, three
  > versions of amendments — one pass returned **55 findings, 20 of them critical**. Grouped prose is
  > accurate and unreadable at that size: the user has to separate what needs a choice from what does not,
  > reconstruct the options, and infer which one you favour. The findings are a **closed set per item**, so
  > they take a picker (step 2's note).

  > **The shape report — only when asked, and always in its own section.** A project may ask you to report
  > where its documents violate the *builder instructions only* rule (`spec/README.md`, *How versions
  > evolve*). **Do not fold this into the findings above.** A mature spec can yield hundreds of editorial
  > items, and mixed together they bury the handful of real contradictions — which are the reason spec mode
  > exists. Separate section, separate approval, or the pass loses its point.
  >
  > Sort what you find into three tiers and **say which tier each item is in**:
  > - **Mechanical** — superseded wording carrying any of the five markers (`requirements.md` §1.1:
  >   *rewritten / amended / extended / clarified / annotated*). It is delimited, so the fix
  >   **relocates** it to the `decisions.md` beside the owning document, verbatim, rather than rewriting anything.
  >   Safe to offer as a batch: nothing is lost, and the result is checkable.
  > - **Judgement** — prose that reads as narration and could be a rule or could go. **Report; never
  >   batch.** Each one is a *"is this a rule?"* call, and a wrong one silently deletes a constraint. These
  >   are ordinary reviewed project work, one at a time.
  > - **Leave alone** — **operational hazards** (a clean vulnerability audit that is not sufficient
  >   evidence, a parameter set that throws against a default limit, a syntax edge case that breaks a
  >   parser). Never propose removing one; if you are unsure whether something is a hazard or narration, it
  >   is a hazard.
  >
  > **Refuse the timing if it is wrong.** Not mid-batch, while open tickets cite text whose surroundings
  > would shift under them — say so and propose the start of the next delta pass instead.
- **Code mode:** the same shape applies — summarise, then put the **per-finding choices** (file it as a
  cleanup ticket / promote it / reject it) as a queue rather than prose, since that is a closed set too.
  For accepted findings, draft **cleanup tickets** per `spec/tickets/CONVENTIONS.md` §6:
  ordinary `task` tickets, `batch: cleanup`, `implements: []`, numbered after the current highest id, placed
  in the Cleanup backlog table in `BOARD.md`. Do not auto-promote — flag candidates and let the user decide.

  > **Hand the drafting to the `tests` model, where one is configured** (root `CLAUDE.md` › *Project &
  > kit* › *Models* names a `tests` model distinct from `implementation`). Spawn a subagent pinned to it
  > and have it write the ticket from **the finding and the spec alone** — no implementation sketch, no
  > hint of how you would fix it. Bring the ticket back and carry on here.
  >
  > **Why these tickets and not every ticket:** a ticket's acceptance criteria are what the implementer's
  > work is later checked against, so a model writing both can set itself a bar it finds easy — the same
  > grader ≠ graded reasoning the kit already applies to tests. Tickets from the *generation milestone*
  > don't need it, because you review and sign those off; **a cleanup ticket has no such gate** — it goes
  > straight to the backlog from a finding this session produced. That missing gate is the whole reason.
  >
  > The ticket's commit carries a `Co-authored-by` trailer for the model that drafted it, exactly as a
  > ticket's work commit records its test author. **Degrade gracefully:** with no distinct `tests` model,
  > or a runtime that cannot pin one to a subagent, draft it here as usual.

  > **A finding that a record is false is not automatically a ticket.** If it is **pure record drift** —
  > no code implicated, no decision owed — **apply the correction in this pass** and commit it as a
  > `process:` commit. Carry §5.5's retrospective half in the message: which tickets were worked against
  > the false version, and whether each one's work stands. That is the audit value the ticket format was
  > actually buying, and it survives fine outside a board row.
  >
  > **Why not a ticket:** a record-correction ticket carries a `before:` deadline that exists purely to
  > manage the gap the queue introduces — the batch keeps building against the false record while the
  > correction waits its turn. Correct it here and the gap never opens. Spec mode already works this way
  > for the same kind of finding; code mode inherited "always file a ticket" from its *normal* findings,
  > which are implementation-shaped and genuinely belong on the board.
  >
  > **File a *record-correction* ticket** (CONVENTIONS.md §6.7) **only when the correction cannot land
  > now** — it also touches code, or it needs a decision the user has to make. Then the gap is real, and
  > it is the one ticket kind with a **deadline**: worked before the next batch
  > starts, not at discretion. Name it as one, and put §5.5's retrospective half **inside** it: which
  > tickets were worked against the false version, and whether each one's work stands. Say so in your
  > report, and flag it if the user is about to start another batch with one open.
  >
  > **The reason it cannot wait:** while it sits, further tickets are written and closed against the record
  > it exists to fix. One such ticket became *unsatisfiable* while queued — the ticket it was written to
  > re-scope closed against its own false `## Background` first. Correcting the record without re-opening
  > that work would also have **hidden** the gap rather than closed it, because afterwards nothing marks a
  > `done` ticket as suspect.
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
