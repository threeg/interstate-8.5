---
name: sfk-next-milestone
description: Work the next milestone in the spec-first process to a committed draft. Reads spec/milestone-plan.md, marks the next milestone In progress, runs its authoring interview or build, commits the draft deliverable, and iterates on the user's feedback. Does NOT mark the milestone complete — that is sfk-signoff. Trigger on "next milestone", "work the next milestone", "continue the project", or naming a step such as "start the requirements" or "start the test strategy".
---

# sfk-next-milestone — work one milestone to a committed draft

Use to work the next milestone the current version has laid down. Each milestone is its own session.
You produce and **commit** the deliverable as a draft and iterate with the user; you do **not** sign it
off — that is the separate `sfk-signoff` skill, which the user triggers.

> **`.sfk/` is read-only.** Copy any template you need *out* of `.sfk/templates/` to
> its working location and edit the copy — never edit inside `.sfk/`.

## Procedure

1. **Read `spec/milestone-plan.md`.** Find the *Current position* and the milestone table. Identify
   the next milestone: the one already `In progress` (🔶) but not yet signed off, or the next
   `Not started` (⬜) after the last completed one. Confirm its inputs (prior milestones) are signed off.

   > **Offer a spec review at the ticket-generation gate.** Once the gate below is satisfied and before you
   > generate any tickets, **offer to run `sfk-verify` in spec mode** — the pass that reads all the
   > authoring deliverables *together* and looks for drift, contradiction and leftovers. This is the moment
   > it pays for itself: the spec is about to become work, and a contradiction that survives into tickets
   > becomes code. It is also the only point where anything reads the whole spec at once — each milestone
   > was authored in its own session, so nothing else can catch a cross-document conflict. **Offer and
   > wait**; the user may decline, and a declined offer is not a reason to ask twice. This applies equally
   > to a delta version, where amend-in-place editing makes drift *more* likely, not less.

   > **Hard gate — ticket generation.** Never begin the ticket-generation milestone unless **every
   > preceding spec milestone in this version's table is `Complete` (✅)** — brief, requirements,
   > architecture & contract, wireframes, design system, test strategy (whichever that version has).
   > Tickets are derived from all of them, so generating a queue over a draft the user has not signed off
   > produces work that must be thrown away the moment the spec moves. If any of them is still ⬜ or 🔶,
   > **stop and name the ones outstanding** — do not generate tickets, do not generate "provisional" or
   > "draft" tickets, and do not offer to start early. The user's sign-off of the last spec milestone is
   > the only thing that opens this step. This holds for the first release and for a delta version alike.

2. **Mark it `In progress` (🔶)** and move the *Current position* line to it.

3. **Run the step** and write the deliverable into its `spec/` folder:
   - **Authoring steps** (brief → requirements → architecture & contract → wireframes → design system →
     test strategy → ticket generation): **copy this milestone's template out** of
     `.sfk/templates/spec/<folder>/` into its working `spec/<folder>/` location (e.g.
     `architecture/architecture.md` and `architecture/api-contract.md`) — **only if that working document
     does not exist yet** — then interview the user section by section and fill the **working** copy.

     > **If the working document already exists, it is living and binding: never copy a template over it.**
     > Doing so would replace a signed-off specification with a placeholder skeleton, silently and before
     > the user sees anything. Instead **read it and amend it in place**, per the delta-pass model in
     > `spec/README.md`: new rules take **new** `FR`/`NFR` numbers, superseded ones are amended where they
     > stand and annotated (e.g. *"rewritten — vX.Y"*). Present the **diff** for review; do not re-interview
     > from scratch. This is the normal case for **every authoring milestone of a delta version**, and it
     > covers the version brief too — `sfk-version` already drafted `spec/vX.Y.Z-brief.md`, and this
     > milestone is its **review and ratification**, which is why it was still ⬜. The existence of the file
     > is the whole test; there are no other exceptions to reason about.

     For ticket generation the working `spec/tickets/*` already exist (copied out at init); derive the
     tickets and `BOARD.md` from the spec in dependency order. **Drain the parking lot:** for each
     `spec/TODO.md` entry this version selected at `sfk-version` — whose *decision owed* the spec
     milestones have now made — file its real ticket (carry the entry's *reuse* and *where it surfaced*
     into the ticket's Background) and, **in the same commit, remove that entry's body from
     `spec/TODO.md` and add its one-line tombstone to that file's *Resolved* table** — the id, **what it
     asked** (the decision that was owed, not a topic title), **the answer**, the ticket it became, and
     the date. The answer is the column that carries what nothing else will: a ticket states a decision
     as a premise and never records the question it settled, so say explicitly if the work **widened
     beyond the entry's scope**, if it **reversed an earlier decision**, or if **it was never an open
     decision at all** (the spec already required it). One line — the reasoning belongs to the ticket.
     Do **not** delete the id outright: a `TODO-n` is cited while it is open and those citations outlive
     the entry, so an erased id leaves a live citation pointing at nothing — and `sfk-todo` assigns the
     next id from the highest in the file, so it gets reused too. Leave any entry whose decision still
     isn't made parked, and note it.

     **At the architecture milestone, propose the layering and the stack — don't ask cold.** By this point
     the brief and the requirements exist, which is the whole reason the kit does not ask at init. Read them,
     then **put forward a recommendation**: a one-line dependency rule with what each layer may import, and
     a stack to match, each with **why this suits *these* requirements** — and name one or two credible
     alternatives with the trade-off you rejected them on, so the user is choosing rather than rubber-
     stamping. Say plainly where you are guessing, and open an `spec/open-questions.md` row for anything you
     cannot settle. Fill `spec/architecture/architecture.md` §2.1 with what the user agrees.
     **At that milestone's sign-off, copy the settled rule into the root `CLAUDE.md`** — its *Architecture
     dependency rule* section ships marked not-set — and keep the two **identical** thereafter. Fill *Stack*
     there too, as proposed. Leave *Commands* alone: it is written at **scaffolding**, when a runner exists.

     **At scaffolding, fill the root `CLAUDE.md` *Commands* section** from the ticket that wires the runner
     and gates up — the real commands, not intended ones — and confirm *Stack* still describes what was
     actually built. Both sections ship marked not-set with their shape in HTML comments; replace the
     marker, keep the section heading. Until they are filled, **never invent a command**: ask.

     **Record every value you cannot confirm, as you write it.** Authoring is where unknowns are minted:
     the moment you write a value into a `spec/` document that neither you nor the user can actually
     confirm, **open a row in `spec/open-questions.md`** (`Q-n` if someone outside the team must answer,
     `S-n` if it is ours) with the question in plain language and the assumption you are documenting. Do
     **not** leave a bare `*(to confirm)*` marker in the document — a marker has no id, no owner and no way
     to find every affected place later. Then carry on: an open question never blocks the milestone. Tell
     the user which rows you opened when you present the deliverable.

     **Every ticket that changes rendered output names its design authority.** At ticket generation, for
     each such ticket — including `Task`-shaped ones, which is what rendering work is in a project with no
     interactive UI — fill its `## Design authority` section: the artefact that **binds**, its section, and
     the values taken from it. "As per the mockup" is not an answer. If `spec/design/design-system.md`
     §1.1 (*Artefact authority*) is empty and the milestone produced more than one design artefact, **ask
     the user to settle the hierarchy** before queueing those tickets — an implementer who has to guess
     which artefact is authoritative will take values from whichever one is easiest to read.

     **If this milestone invents a new id family** (a prefix the spec did not use before — e.g. `C-n` for
     contract rules, `Q-n` for open client questions), **add its row to `spec/id-registry.md`** in the
     same commit: prefix, one-line meaning, the document that defines it, and this milestone as its
     minter. One row per family, never per id, and never the content of a rule. Nothing to do if the
     milestone invents no new prefix, which is the common case.
   - **Building steps** (scaffolding, or a later version's optional *tooling deltas* → implementation):
     mark the milestone in progress, then **work its tickets one at a time via `sfk-next-ticket`** — do
     **not** batch. This applies to **scaffolding and tooling deltas as much as implementation**: each
     scaffolding ticket (repo init, backend skeleton, frontend skeleton, test tooling + dependency-rule
     check) — and each tooling-delta ticket (one new dependency, one gate change) — is a different thing
     and is implemented, committed, and reviewed **separately**, exactly like an implementation ticket.
     Never batch-commit the skeletons, or a batch of dependency and gate changes, in one pass. Defer to
     `sfk-next-ticket` for all of them.

4. **Commit cadence — per the Commit protocol** (root `CLAUDE.md`).
   - For an **authoring** milestone (Cowork / hand-off), **do not surface `git` at all during drafting**,
     and **run no `git` yourself — not even read-only `status` / `log` / `diff`** (in the sandbox it can
     leave an uncleanable `.git/index.lock` that breaks the user's own commits; see the Commit protocol).
     An authoring milestone iterates through several feedback rounds before the user is happy, so a draft
     is not a checkpoint that needs committing — nagging for a check-in after each edit is noise. **Defer
     the whole commit to sign-off**, where `sfk-signoff` presents a *single* commit carrying the status
     change (step 2) and the finished deliverable together. Surface commit commands mid-way **only if the
     user explicitly asks** for a checkpoint.
   - For a **building** milestone, the commits happen per ticket via `sfk-next-ticket`, where the agent
     commits directly (one ticket per commit) — that per-ticket cadence is unchanged.

5. **Present and iterate.** Show the user the deliverable and ask for feedback. If they have changes,
   revise and show the result. In **authoring/Cowork**, keep iterating **without surfacing commits** (the
   single commit lands at sign-off; offer a mid-way commit only on request). In **building/Code** the
   agent commits per ticket as usual. Loop until the user is satisfied. The milestone stays `In progress`
   throughout.

6. **Hand off to sign-off.** When the user is happy, tell them the deliverable is ready and that
   `sfk-signoff` will mark the milestone complete and advance the plan. **Never** mark it `Complete`
   yourself.

## Rules

- **Never edit `.sfk/`** — copy a template out to its working location and edit the copy.
- **Never overwrite a working `spec/` document with a template.** A template is copied out **only** to
  create a file that does not exist. If the file exists it is the binding spec — amend it in place. This
  is the one mistake in this skill that destroys the user's work rather than merely misordering it.
- One milestone per session. You commit drafts and revisions; you never mark a milestone `Complete`.
- The spec is binding: do not reopen settled decisions from earlier milestones — if one is genuinely
  wrong, change the relevant `spec/` file first and note it.
- **Ticket generation waits for a fully signed-off spec.** It may not start while any preceding spec
  milestone of that version is ⬜ or 🔶 (see the hard gate in step 1) — no exceptions, no provisional
  queue.
- For implementation milestones, defer to `sfk-next-ticket` and `spec/tickets/CLAUDE.md`.
