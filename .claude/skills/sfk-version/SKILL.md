---
name: sfk-version
description: Start a new version of the project. Takes a version number and its goals, writes the version brief, and lays down that version's milestone table in spec/milestone-plan.md. Use after sfk-init for the first release, and again at the start of each later version. Trigger on "start a version", "new version", "begin v0.2.0", "plan the next version", or "start v1".
---

# sfk-version — start a version

Use to open a version: the first release right after `sfk-init`, and each later version once the
previous one has shipped. It defines *what* the version delivers and lays out the milestones to get
there; it does **not** work the milestones (that is `sfk-next-milestone`).

## Procedure

1. **Get the number and goals.** Ask the user for the version number and its
   goals — the capabilities or changes it should deliver. One round of questions to make the goals
   concrete.

2. **Harvest the parking lot.** If `spec/TODO.md` exists and has entries, **scan it and present the
   entries as a checklist**, then ask the user **which of them this version commits to resolving**. Each
   parked item names a *decision owed* — selecting it means this version will make that decision, so its
   owed question must flow through the spec milestones. For every item the user checks, **fold it into
   the version's goals** (step 3's brief), interviewing briefly **only** for the context a parked one-
   liner lacks. Do **not** delete entries here and do **not** turn them into tickets now — a parked item
   is unspecifiable until its decision is made in the spec milestones; it becomes a ticket (and its entry
   is deleted) at **ticket generation**. Unselected entries stay parked for a later version. Skip this
   step silently if there is no `spec/TODO.md` or it is empty.

3. **Write the version brief.**
   - **First release (whatever number the user gives):** the brief is the full project brief —
     interview-light here; the depth comes in Milestone 1. Record the version's goals and scope in
     `spec/brief/brief.md` (or a short `spec/<version>-brief.md`).
   - **Later versions:** write `spec/vX.Y.Z-brief.md` — a short brief that scopes the version as
     **requirement deltas** against the living spec (new `FR`/`NFR` numbers; amend-in-place for
     superseded ones), per the delta-pass model in `spec/README.md`. What you write here is a
     **draft**: it is ratified in the version-brief milestone, not by writing it (see step 4).

4. **Lay down the milestone table** in `spec/milestone-plan.md` for this version:
   - **First release:** the full nine steps — brief, requirements, architecture & contract, wireframes
     and design system (omit both if no UI), test strategy, ticket generation, scaffolding,
     implementation.
   - **Later versions:** the delta pass — the step list, in order:

     > brief → requirement deltas → architecture/contract deltas → wireframe deltas → design deltas →
     > test-strategy delta → ticket generation → tooling deltas (if any) → implementation

     This list is stated verbatim in the method guide (`spec/README.md`, *How versions evolve*) — keep
     the two identical. Wireframes and design are two steps; the optional tooling step and the two
     UI steps are the only ones that ever drop out. Which steps are conditional, and why they are not
     merged:
     - **Both UI steps drop out** for a non-UI version. Where the version *has* UI work, **merge
       wireframe deltas into design deltas only** if that work is purely visual — tokens, styling — with
       no structural change.
     - **Ticket generation is never folded into the test-strategy delta.** On a delta version it is not
       the smaller job it looks like: a fresh queue in dependency order, new epic ids, a new `BOARD.md`
       version section, and re-milestoning tickets carried over from the previous version. The ticket
       queue is the one artefact regenerated from scratch every version. Sharing a gate with a
       test-strategy edit guarantees one of the two gets a shallow review.
     - **Wireframes and design keep separate gates for the same reason they do in the first release** —
       structure first, then the visual contract. Merging them lets a layout question be decided
       implicitly inside what presents itself as a styling review. Merge only when there is genuinely no
       structural work.
     - The tooling step is the **scaffolding step's smaller successor**: include it *only* when the version
       introduces a new dependency, a new gate, or a build change, and omit it entirely for pure feature
       work. Scope it to that plumbing alone — it is not a second scaffolding pass. **A gate change belongs
       here, never inside a feature ticket**: a dependency addition or a gate fix reviewed alongside feature
       commits is exactly where a reviewer's attention is worst, and the feature work usually *depends* on
       the plumbing, which a milestone boundary sequences honestly.
     A delta pass is **shorter only where the version genuinely needs less** — several steps dropping to a
     paragraph each is normal, and a delta version reaching the same step count as the first release is
     not a sign anything went wrong. Never merge steps to hit a target length.
   Number the milestones continuing from the previous version; set all to `Not started` (⬜); set the
   *Current position* to the first one.

   > **The version-brief milestone stays `Not started` (⬜), even though you just wrote the brief.** What
   > step 3 produced is a **draft**; that milestone covers its **review and ratification**, which
   > `sfk-next-milestone` runs and the user signs off. So label the row **"Version brief — review and
   > ratify"** rather than plain "version brief", so the table does not appear to describe work already
   > done. Do **not** mark it `In progress` (🔶) on the grounds that the artefact already exists: the
   > `⬜ → 🔶` transition belongs to `sfk-next-milestone` alone (root `CLAUDE.md`, *Milestone status
   > lifecycle*), never to `sfk-version`. The draft existing is not progress — nobody has reviewed it.
   > This overlap is specific to the delta pass: on a first release the version brief and Milestone 1's
   > `spec/brief/brief.md` are different deliverables, so the question does not arise.

5. **Commit — per the Commit protocol** (root `CLAUDE.md`). This is an authoring step (Cowork), so
   **do not run `git` yourself**: present the exact `git add` / `git commit` commands for the brief and
   the milestone table and have the user run them. (Only in a git-safe building runtime may you commit
   directly.)

6. **Hand off.** Tell the user the version is scoped and the next step is `sfk-next-milestone` to work
   the first milestone. Do **not** start it yourself, and do **not** mark anything complete.

## Rules

- **No default version.** The project decides where its versioning starts (e.g. `v0.1.0` or
  `v1.0.0`). Never suggest or assume a default — use exactly the number the user provides.
- **Never edit `.sfk/`** — it is the kit's read-only source (templates, changelog, manifest).
- `sfk-version` defines scope and milestones only — it never authors a milestone's deliverable or
  writes code. The single exception is the version brief, and even there it produces only a **draft**;
  the matching milestone is where that draft is reviewed and ratified.
- **Never set a status beyond `Not started` (⬜).** Laying a table down is not starting work, and a draft
  already on disk is not progress. Only `sfk-next-milestone` marks 🔶, and only `sfk-signoff` marks ✅.
- Do not fork the spec per version: later versions evolve `spec/` in place via deltas; the version
  brief and the milestone batch are the only point-in-time artefacts.
- Run `sfk-version` again only once the current version's milestones are all signed off.
