---
name: sfk-next-ticket
description: Advance the build queue by one ticket, during the scaffolding and implementation milestones. First finalizes the previously reviewed ticket if one is left in-review (marks it done and commits that), then implements the next ready todo ticket test-first where applicable and leaves it in-review for the user to review. Keeps the ticket, board, and tests honest in the work commit. Trigger on "next ticket", "work the next ticket", "implement the next ticket", or "keep building".
---

# sfk-next-ticket — implement one ticket

Use during the **building milestones — scaffolding, a later version's optional tooling deltas, and
implementation** (all are worked ticket by ticket, one at a time). One invocation **finalizes the previously reviewed ticket** (if one is left
`in-review`) and then **implements the next one**, leaving it `in-review`. Follow the ticket-workflow
rules in `spec/tickets/CLAUDE.md` and the definition of done in the root `CLAUDE.md`.

> **Review mode.** Read *Review mode* in the root `CLAUDE.md` (*Project & kit*). It changes **where the
> user reviews**, never what counts as approval. Default **`in-place`**: everything below is committed on
> the current branch and the ticket rests `in-review` there; the user reviews the diff in chat. If it is
> **`pr`**, each ticket is worked on **its own branch** and pushed as a **pull/merge request** — the open
> PR *is* the `in-review` state, and the user reviews on the forge. PR mode needs a git-safe runtime
> (never Cowork) and a forge remote; where either is absent, fall back to `in-place`. The `pr`-only steps
> are flagged **[PR mode]** below.
>
> **Approval is the same in both modes: the user invoking this skill (or `sfk-close-ticket`).** Asking for
> the next ticket *is* the approval of the previous one — the forge's Approve button is **not** used, and
> the merge is **plumbing, not the signal**. That matters because a user reviewing their own PR cannot
> submit an approving review at all, so a design that waited for one would deadlock. In `pr` mode you
> merge the previous ticket's PR as part of finalizing it, below.

## Procedure

1. **STOP — finalize the previously reviewed ticket before you do anything else.** Check
   `spec/tickets/BOARD.md` for a ticket already `in-review`. If one exists, you **must** close it out in
   **its own commit** before you touch the next ticket — do **not** start, edit, or stage the next
   ticket, and **never** bundle the closure into the next ticket's work or a later fix commit. The user
   asking for the next ticket **is** their approval: flip it to `done`, update its `BOARD.md` row, close
   its epic if it was the last open child, and commit **only** that change as
   `<PRJ>-NNN: mark done (reviewed)`. Confirm that commit exists, then continue. (Normally exactly one;
   finalize each if somehow more.) A finalize is status-only, so it carries **one** `Co-authored-by`
   trailer — the model performing it — not the pair; the pair belongs on the work commit that built the
   ticket.
   - **Exception — outstanding feedback.** If the user has given feedback on the in-review ticket rather
     than approving it, do **not** finalize: revise the ticket, re-commit under its id, leave it
     `in-review`, and stop. Feedback is handled before the queue advances.
   - **[PR mode] — you merge, as part of finalizing.** The user's invocation was the approval, so
     **squash-merge** the prior ticket's PR yourself (squash keeps one commit per ticket on the main line
     even after several `sfk-address-review` rounds), then mark the ticket `done` (+ `BOARD.md`, + close
     its epic if last child) and commit that status change. Do this **before** step 2 branches, so the
     next ticket branches off a main line that already contains its predecessor — that is what makes
     `depends_on` hold.
     - If the merge is **blocked** — a failing required check, a conflict, or branch protection demanding
       an approving review the user cannot give on their own PR — **stop and say exactly which**. Do not
       force it, do not start the next ticket, and do not mark anything `done`. A blocked merge is a real
       problem to solve, not a step to work around.
     - If the PR is **already merged** (the user merged it by hand), just do the status change.

2. **Pick the next ticket.** From `spec/tickets/BOARD.md`, take the lowest-numbered `todo` ticket whose
   every `depends_on` id is `done` **and which no other unfinished ticket names in its `before:` list**
   (CONVENTIONS.md §4.6 — `before: [Y]` on X gates Y exactly as `depends_on: [X]` on Y would, and it is
   the one edge that may point *backwards*, so a lower-numbered ticket can be gated by a higher-numbered
   one). Never start a ticket whose dependencies are not done. If none are ready, say so and stop (after
   any finalize in step 1).
   - **Read the board top to bottom, not in id order.** A **promoted** row (§6.5) sits out of id
     sequence on purpose and carries `🔺 before <id>` in its `flag` cell. If a row's flag and the
     ticket's `before:` field disagree, or a flagged row sits *after* the ticket it must precede, stop
     and say so — the ordering record has been broken and picking the wrong ticket would honour the
     break.

3. **Load context.** Read the ticket file, the `## Notes` of its `depends_on` tickets, and the spec
   sections it references (`spec/requirements/requirements.md` for its `implements` ids,
   `spec/architecture/architecture.md`, `spec/architecture/api-contract.md`, the relevant
   wireframe). The ticket plus that spec should be enough — no conversational context required.

4. **Set `in-progress`** in the ticket and its `BOARD.md` row — the bare token in the ticket, `🔶
   in-progress` on the board (CONVENTIONS.md §2 gives all five icons; §5.4 the rule — the token is the
   value, the icon is decoration, and the board always carries both). **[PR mode]** first create and switch to
   the ticket's own branch (e.g. `<PRJ>-NNN-<slug>`) off an up-to-date main line, so all of this
   ticket's work lands there.

5. **Implement — test-first, and that is binding.** Honour the architecture dependency rule. For
   deterministic and contract-pinned work: **write the failing test FIRST**, run it, **confirm it fails
   for the right reason**, and only **then** write the implementation. Do not write implementation
   first and back-fill tests — that is a process violation, not a shortcut, and it loses coverage you
   will not notice missing. Red-green is the default for **all** implementation work; it is overridden
   only where `spec/test-strategy/test-strategy.md` **explicitly names** that layer as exempt (§1).
   Characterisation tests for probabilistic/external layers. New or changed numbered-requirement
   behaviour ships with its tests **in the same commit**.

   **Independent test authorship (only if configured).** If the root `CLAUDE.md` *Project & kit* ›
   *Models* names a **`tests`** model distinct from the implementation model, the failing test must be
   written by that model, **independently of the implementation** — grader ≠ graded, so the test is not
   shaped to fit the code that must pass it. In Claude Code: at the test-first step, **spawn a subagent
   pinned to the `tests` model** and have it write the failing test(s) from the **ticket + the spec
   only** — no implementation sketch, no hints about how you intend to pass it. Bring the test back,
   confirm it is red for the right reason, then implement to green in **this** (implementation) session.
   The test-writer and the implementer must **not** collaborate on the same ticket — they hand off
   through the test and the spec, nothing else. It is still **one ticket, one commit**: the test is
   authored inside the ticket's work, not a separate commit. **Degrade gracefully:** if no distinct
   `tests` model is configured, or the runtime cannot pin a model to a subagent, write the test in this
   session as usual — at minimum, author it from the spec *before* sketching the implementation.

   > **Tell the test-writer to keep its header compact — and never to "match the house style".** A header
   > comment records **only what the ticket and the spec did not settle**: the decisions the test-writer had
   > to invent, and any it deliberately left unpinned. It must **not** restate the module's type surface
   > (already in the ticket and, once it exists, the implementation), and where a decision is simply *"mirror
   > what the sibling file does"* it gets a **one-line pointer**, never a re-derivation.
   >
   > This needs saying explicitly in the delegation prompt because the default drifts the wrong way and
   > **compounds**: a subagent shown a prior file as precedent imitates its density, so each file inherits
   > the last one's verbosity plus its own, with nothing pulling back down. Left alone, headers reach
   > hundreds of lines — and a header nobody reads has lost the one thing it was for.
   >
   > **What survives the trim is the valuable part**, so keep it deliberately: where the test-writer had to
   > invent a decision **because the spec left a gap**, that gap is usually an `S-n` row in
   > `spec/open-questions.md`, not just a comment. Open the row and cite it from the header. The header is
   > where those gaps get discovered; the register is where they get resolved.

   > **STOP if implementing reveals the spec is *wrong* — amend it before you write the code that depends
   > on it.** This is the one place the kit's central discipline is actually exercised, so it is a step, not
   > a principle to recall. The moment you find that a requirement, a contract shape or an architecture rule
   > contradicts what the ticket needs:
   >
   > 1. **Stop before writing the dependent code.** Do not implement against what you believe it *should*
   >    say and reconcile the document afterwards.
   > 2. **Put the choice to the user, both ways:** *should the spec change, or should the code match the
   >    spec as written?* You are looking at a **settled decision** they signed off, so the answer is theirs.
   > 3. **If the spec changes, amend it first** — the owning document, plus a line in its decisions log
   >    saying what changed and why — and reference it from the ticket. **Then** implement.
   >
   > **Order is the whole point, and reversing it removes the user's veto.** Ask before the code exists and
   > both answers cost the same. Ask after, and amending the spec is the cheap option while changing the code
   > looks expensive — so the decision is made by sunk cost rather than by the user. It also destroys the
   > evidence: afterwards nobody can tell whether the spec was a *decision* or a *rationalisation*, and
   > `sfk-verify` code mode becomes circular, auditing the code against a description of itself.
   >
   > **A ticket may not reach `in-review` with a spec amendment still owed** (root `CLAUDE.md`, *Definition
   > of done*). "I still need to do the spec amendments before closing out" means the order already went
   > wrong — say so plainly in the completion report rather than quietly catching up.
   >
   > Distinguish this from the case below: the spec being **silent** is an open question, and you carry on.
   > The spec being **wrong** stops you.

   **If the ticket needs a value the spec does not fix, record it and keep going.** Implementation is
   where a gap in the spec surfaces as a concrete blank. If neither you nor the user can confirm the value,
   **open a row in `spec/open-questions.md`** (`Q-n` if someone outside the team must answer it, `S-n` if
   it is ours), then implement against the documented assumption — an open question never blocks work.
   Three things make the answer cheap to apply later, and all three belong in **this** commit: the value is
   a **named constant**, a test **asserts** it, and both the constant and the ticket **cite the id**. Say in
   the completion report which rows you opened. Never bake an unconfirmed value in as a bare literal: that
   is the one failure this register exists to prevent, and it is normally found only once the value is
   already baked into committed fixtures.

6. **Run the gates.** The default gate must pass with zero warnings; run the heavier gate the ticket
   names (model / perf / e2e) where it applies; hold the core coverage gate for core-touching work.

7. **Close for review, in one commit.** Set the ticket **`in-review`** (not `done` — that waits for the
   user's review), append a dated `## Notes` line with the **completion report** (plain-language summary
   + one-line sanity test; for UI tickets, fill `## QA steps`), and update the `BOARD.md` row to `👀
   in-review` — all in
   the same commit as the code and tests. Commit message: `<PRJ>-NNN: <short imperative>`. Do **not**
   set `done` and do **not** close the parent epic here — that happens when the ticket is finalized
   (step 1 of the next run, or `sfk-close-ticket` — including for a milestone's last ticket).

   > **Emit an authorship trailer for every model that built this ticket.** This step is the **only place in
   > the kit that knows both** which model authored the failing test and which implemented against it, so it
   > is the only place that can record it. End the work commit with a `Co-authored-by` trailer **per model**:
   > - **Independent test authorship configured** (root `CLAUDE.md` › *Models* names a `tests` model distinct
   >   from `implementation`) **and `tests_required: true`** → **two** trailers, the test author and the
   >   implementer. This is the machine-readable half of the red-green record.
   > - **Single-model project** (`tests: same`, or one model named) → **one**.
   > - **A ticket whose stated verification is the untouched existing suite** (a refactor, or
   >   `tests_required: false`) → the implementer's alone.
   >
   > **`## Notes` is the other half of that record, and neither substitutes for the other — they fail
   > independently.** Exemplary red-green prose sits happily beside a commit with no trailer at all, so a
   > reviewer reading the notes finds nothing missing. Do not treat writing one as covering the other, and do
   > not rely on the runtime's default: it supplies a trailer only for the model currently driving, if any,
   > which can never produce the pair.

   Then **print the completion report to the chat**, in this order: the ticket **id + title**, its
   **`## In plain English`** line (both echoed from the ticket), then the summary, the sanity test, and
   — for UI tickets — the QA steps. The id, title, and plain-English are chat-only; they already live in
   the ticket, so they are not written into `## Notes`. Tell the user it is ready for review, and that
   asking for the next ticket will finalize it (or giving feedback will revise it).

   **[PR mode].** After the ticket-branch commit, **push the branch and open a pull/merge request** —
   that open PR *is* the `in-review` state. Pushing is an outward action: only in a git-safe runtime,
   and **confirm with the user first** (per the *Commit protocol*); use the forge CLI named in *Review
   mode* (e.g. `gh pr create`). Fill the PR title/body from the ticket (id, title, plain-English,
   summary, sanity test). **Do not merge it now** — it is merged when the user approves by invoking this
   skill again, or `sfk-close-ticket` (step 1).

   Then tell the user how to review it, and **be specific about how**, because the obvious way loses
   something: on the forge, go to **Files changed → Start a review → leave line comments → Submit review
   → "Comment"**, rather than typing in the conversation box. A submitted review records the commit it was
   made against, which is what gives them *"changes since your last review"* on the next round and
   resolvable comment threads; a loose conversation comment gives neither. **"Comment" is the right state
   — not Approve:** a user cannot submit an approving review on their own PR, and this kit does not need
   one (approval is the invocation). Close by telling them the two ways forward: ask for the next ticket
   to approve and advance, or comment and run `sfk-address-review`.

8. **At batch boundaries, *offer* `sfk-verify` — do not launch it.** After a batch of related tickets,
   **suggest** running `sfk-verify` ("we've finished a related batch — want me to run `sfk-verify`?") and
   **wait for the user's explicit yes**. `sfk-verify` is user-triggered only; reaching a batch boundary is
   not standing authorization to run it, and stating intent then invoking it in the same turn is not
   asking. When the user confirms, it reviews for reuse/quality/efficiency and proposes cleanup tickets;
   promote any critical finding before the gate it would affect.

When the last `todo` ticket has been implemented, one ticket will remain `in-review`. Close it with
**`sfk-close-ticket`** — that is the approval, and in `pr` mode it merges the PR. **`sfk-signoff` will not
finalize it for you:** tickets are closed by the ticket skills, and sign-off refuses to run over an open
ticket (it also often runs in Cowork, where it may run no `git` at all, so it cannot merge). So the end of
a milestone is two steps: `sfk-close-ticket`, then `sfk-signoff`.

## Rules

- **Never edit `.sfk/`** — it is the kit's read-only source (templates, changelog, manifest).
- **Finalize before starting.** Every run first flips any `in-review` ticket to `done` (its own commit)
  unless the user has outstanding feedback on it.
- One ticket's *work* is one commit; its later `in-review → done` finalize is a separate small
  status-only commit for that same ticket. Never combine unrelated changes.
- A freshly implemented ticket rests at `in-review`; it becomes `done` only once reviewed (the next run
  or `sfk-signoff`).
- If implementing reveals the spec is wrong, change the relevant `spec/` file first and reference it
  — do not silently reinterpret a settled decision.
- **External/environmental errors are not licence to edit the spec.** If an external dependency errors
  (API 404, auth failure, missing key), reproduce and diagnose it (`curl`, config, keys) — **never**
  change a contractual value (model name, endpoint, threshold) to dodge it. If unresolved, STOP and ask
  the user.
