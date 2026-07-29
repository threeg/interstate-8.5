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
     test strategy → ticket generation): first **copy this milestone's template out** of
     `.sfk/templates/spec/<folder>/` into its working `spec/<folder>/` location (e.g.
     `architecture/architecture.md` and `architecture/api-contract.md`), then interview the user section
     by section and fill the **working** copy. For ticket generation the working `spec/tickets/*`
     already exist (copied out at init); derive the tickets and `BOARD.md` from the spec in dependency
     order. **Drain the parking lot:** for each `spec/TODO.md` entry this version selected at
     `sfk-version` — whose *decision owed* the spec milestones have now made — file its real ticket
     (carry the entry's *reuse* and *where it surfaced* into the ticket's Background) and **delete that
     entry from `spec/TODO.md` in the same commit** (zero residue). Leave any entry whose decision still
     isn't made parked, and note it.
     **Exception — a later version's version-brief milestone.** Its deliverable already exists:
     `sfk-version` drafted `spec/vX.Y.Z-brief.md` when it scoped the version. Do **not** copy a template
     over it and do **not** re-interview from scratch. Read the draft, walk the user through it, revise on
     their feedback, and take it to sign-off — the milestone is the **review and ratification** of that
     draft, which is why it was still ⬜.
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
- One milestone per session. You commit drafts and revisions; you never mark a milestone `Complete`.
- The spec is binding: do not reopen settled decisions from earlier milestones — if one is genuinely
  wrong, change the relevant `spec/` file first and note it.
- **Ticket generation waits for a fully signed-off spec.** It may not start while any preceding spec
  milestone of that version is ⬜ or 🔶 (see the hard gate in step 1) — no exceptions, no provisional
  queue.
- For implementation milestones, defer to `sfk-next-ticket` and `spec/tickets/CLAUDE.md`.
