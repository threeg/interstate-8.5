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

2. **Mark it `In progress` (🔶)** and move the *Current position* line to it.

3. **Run the step** and write the deliverable into its `spec/` folder:
   - **Authoring steps** (brief → requirements → architecture & contract → wireframes → design system →
     test strategy → ticket generation): first **copy this milestone's template out** of
     `.sfk/templates/spec/<folder>/` into its working `spec/<folder>/` location (e.g.
     `architecture/architecture.md` and `architecture/api-contract.md`), then interview the user section
     by section and fill the **working** copy. For ticket generation the working `spec/tickets/*`
     already exist (copied out at init); derive the tickets and `BOARD.md` from the spec in dependency
     order.
   - **Building steps** (scaffolding → implementation): mark the milestone in progress, then **work its
     tickets one at a time via `sfk-next-ticket`** — do **not** batch. This applies to **scaffolding as
     well as implementation**: each scaffolding ticket (repo init, backend skeleton, frontend skeleton,
     test tooling + dependency-rule check, filling in `sfk-verify` for the stack) is a different thing
     and is implemented, committed, and reviewed **separately**, exactly like an implementation ticket.
     Never batch-commit the skeletons in one pass. Defer to `sfk-next-ticket` for both.

4. **Commit the draft (WIP) — per the Commit protocol** (root `CLAUDE.md`). For an **authoring**
   milestone (Cowork) **do not run `git`**: present the exact commands to commit the status change
   (step 2) and the draft deliverable together (e.g. `process: <milestone> — draft for review`) and have
   the user run them. (For a **building** milestone the commits happen per ticket via `sfk-next-ticket`,
   where the agent commits directly.)

5. **Present and iterate.** Show the user the deliverable and ask for feedback. If they have changes,
   revise and **commit each revision** (`process: <milestone> — revise <what>`) per the Commit protocol
   (hand off in authoring/Cowork; agent commits in building/Code). Loop until the user is satisfied. The
   milestone stays `In progress` throughout.

6. **Hand off to sign-off.** When the user is happy, tell them the deliverable is ready and that
   `sfk-signoff` will mark the milestone complete and advance the plan. **Never** mark it `Complete`
   yourself.

## Rules

- **Never edit `.sfk/`** — copy a template out to its working location and edit the copy.
- One milestone per session. You commit drafts and revisions; you never mark a milestone `Complete`.
- The spec is binding: do not reopen settled decisions from earlier milestones — if one is genuinely
  wrong, change the relevant `spec/` file first and note it.
- For implementation milestones, defer to `sfk-next-ticket` and `spec/tickets/CLAUDE.md`.
