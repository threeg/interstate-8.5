# SFK changelog

Changes to the Spec-First Kit, newest first. Each entry is the migration script `sfk-update-kit`
follows: it applies every entry newer than a project's `applied_version` (see `manifest.md`).

For each change, the **Apply** note tells the update skill how to bring it into an existing project:
*refresh* (overwrite the kit-owned file), *add* (insert a new section/heading into a living file),
*amend* (apply a wording/guidance change), or *interview* (ask the user, because content is needed).

A change may also carry a **Pre-copy** note. `Apply` happens *after* the user copies the new `.sfk/` +
`.claude/` over their project; **`Pre-copy` is an instruction to the human, *before* that copy** — used
when the copy would destroy something the project owns or filled in. Any entry with a `Pre-copy` note
must also have a section in the repo-root `UPGRADING.md`, because nobody reads a changelog until they
are told to.

---

## v1.3.1 — the delta pass gets its missing steps and its own gates

Four fixes to how a **later version** is planned, all from one project-feedback pass. Common root: the
delta pass was described as a *shorter* list, and an agent following that list literally produced a
milestone table with work that had nowhere to go and review gates that had been merged away. Nothing here
affects a first release, and no project content is overwritten — there is **no pre-copy step**.

- **Optional tooling step in the delta pass.** A later version can add dependencies, gates and build
  plumbing even though the repo is already scaffolded, and the delta pass had no step for it — so it
  landed as the leading tickets of the implementation milestone, putting a dependency addition or a gate
  change in the same review bucket as feature commits. There is now a **tooling deltas** step immediately
  before implementation, the scaffolding step's smaller successor: present **only** when the version adds
  a dependency, a gate or a build change, omitted entirely for pure feature work, and scoped to that
  plumbing alone. **A gate change belongs there, never inside a feature ticket.** Its tickets are worked
  one at a time like scaffolding's. **Apply:** refresh — `sfk-version`, `sfk-next-milestone`,
  `sfk-next-ticket`, `sfk-signoff`, `spec/README.md`.
- **Ticket generation and the two UI steps get their own gates back.** The delta pass merged wireframe
  deltas with design deltas, and the test-strategy delta with ticket generation; both merges cost a review
  gate. **Ticket generation is now always its own step** — on a delta version it means a fresh queue in
  dependency order, new epic ids, a new `BOARD.md` version section and re-milestoning carried-over
  tickets, and it is the one artefact regenerated from scratch every version, so sharing a gate with a
  test-strategy edit guarantees one of the two gets a shallow review. **Wireframe and design deltas stay
  separate** unless the version's UI work is *purely visual*; merged, a layout question gets settled
  inside what looks like a styling review. The "shorter delta pass" framing is dropped: a delta version
  reaching the first release's step count is not a sign anything went wrong, and steps are never merged to
  hit a target length. **Apply:** refresh — `sfk-version`, `spec/README.md`; **amend** —
  `spec/milestone-plan.md` *only if* it still carries the commented example delta table (split its
  test-strategy + ticket-generation row in two); a project's real, filled-in version tables are **not**
  touched, and the next table `sfk-version` lays down follows the new shape automatically.
- **Ticket generation waits for a fully signed-off spec.** It may not begin while any preceding spec
  milestone of that version is ⬜ or 🔶 — no provisional or draft queue, and no offer to start early —
  because a queue derived from an unapproved draft is thrown away the moment that draft moves. The old
  wording ("confirm its inputs are signed off") was soft enough to read as satisfied mid-flow.
  **Apply:** refresh — `sfk-next-milestone`, `spec/README.md`.
- **The version-brief milestone is a ratification gate, not re-authoring.** `sfk-version` writes
  `spec/vX.Y.Z-brief.md` and then lays down a *version brief* milestone as `Not started`, before handing
  off to the skill that produces deliverables — so the prescribed status and the honest-looking status
  disagreed, and a real run marked it `In progress` because the artefact existed. `sfk-version` now states
  it writes a **draft**, labels the row **"Version brief — review and ratify"**, and is barred from
  setting any status beyond ⬜ (only `sfk-next-milestone` marks 🔶). Its Rules also claimed it never
  authors a milestone's deliverable, which the brief contradicted; the brief is now the single named
  exception. `sfk-next-milestone` gains the matching exception — that milestone **reads and reviews the
  existing draft** instead of copying a template over it and re-interviewing. **Apply:** refresh —
  `sfk-version`, `sfk-next-milestone`; **amend** — `spec/milestone-plan.md` only if it still carries the
  commented example delta table (rename its brief row).

Maintainer-side (not shipped): `tools/check_kit.py` gains a 7th check pinning the delta-pass step list to
one canonical sequence across the skill that executes it and the guide that documents it — the two had
drifted, and the skill's reading silently wins at runtime.

---

## v1.3.0 — optional PR-review mode, plus friction fixes

An optional **review surface**: instead of reviewing an `in-review` commit in place, each ticket can be
worked on a **branch** and pushed as a **pull/merge request**, with your **merge** as the approval. Off
by default; `in-place` review is unchanged. It's the same `in-review` gate, on the forge. This release
also folds in friction fixes from a project-feedback pass.

- **Parking lot (`spec/TODO.md`) + `sfk-todo` capture skill.** A home for work you *know* is coming but
  can't ticket yet — its blocking **decision doesn't exist** ("the ticket is the prompt" needs a
  specifiable outcome). Anti-rot by design: every entry **names the decision owed**, the list is
  **harvested at `sfk-version`** (checklist → which does this version resolve?), and a selected item
  becomes a real ticket at **ticket generation** where its entry is **deleted in the same commit** (zero
  residue). It is committed and shared, so a BA can plan from it; it is **not** a second backlog
  (anything specifiable goes to `BOARD.md`). The new **`sfk-todo`** skill (11th) captures a one-liner
  mid-flow, always records the decision owed, and commits `spec/TODO.md` **on its own** (never folded
  into a ticket commit; hand-off in Cowork). **Apply:**
  - **add** — copy `.claude/skills/sfk-todo/` in (new skill; no project edits to it);
  - **add** — create `spec/TODO.md` from `.sfk/templates/spec/TODO.md` if absent (lay it down **empty**,
    replacing `<PROJECT>`); it is committed like any living doc;
  - **add** — insert the `spec/TODO.md` line into the root `CLAUDE.md` *Where things live*, and add
    `sfk-todo` to its `.claude/skills/sfk-*` roster line;
  - **refresh** — `sfk-version` (harvest step), `sfk-next-milestone` (drain-at-ticket-generation),
    `sfk-init` (lays down the empty parking lot), and the method guide.
- **`sfk-verify` is user-triggered only, and announces its model first.** Two fixes to the verifier's
  procedure: (1) it runs **only on the user's explicit request** — a batch boundary is an *offer*
  ("want me to run `sfk-verify`?"), never standing authorization; `sfk-next-ticket` step 8 is corrected
  to offer-and-wait rather than launch. (2) At the start of a run it **states which model** will audit
  and, if the project configures a distinct grader model (*Models*), **recommends switching to it** —
  verification is a grader task, so the cheap `implementation` model is the wrong default. One-line
  confirm, not an interview. **Apply:** refresh — `sfk-verify`, `sfk-next-ticket`.
- **Cowork: no `git` at all — including read-only `status`/`log`/`diff` (bug fix).** In a hand-off
  (Cowork) runtime, even read-only git refreshes the index and leaves a `.git/index.lock` the sandbox
  cannot unlink, which then blocks the *user's* own commits. The Commit protocol prohibition is hardened
  from "don't commit" to "run no git commands at all; never probe `.git` to infer state — read milestone
  and commit state only from `spec/milestone-plan.md` and the user." Reinforced in `sfk-signoff` and
  `sfk-next-milestone`. **Apply:** amend — the *Commit protocol* authoring bullet in the root `CLAUDE.md`
  (extend the prohibition to read-only git + the `index.lock` rationale; preserve user edits); refresh —
  `sfk-signoff`, `sfk-next-milestone`.
- **Feedback template records its source project (audit trail only).** The feedback template gains a
  required `project:` frontmatter field (the source project's short code), filled by `sfk-feedback` on
  every item, so feedback arriving on the SFK side can be traced to its origin. It is explicitly **never**
  a triage input — feedback is accepted on its merits, not on who raised it. Replaces the old "provenance
  optional — omit if in doubt" guidance. **Apply:** refresh — `.sfk/templates/feedback/feedback.md`,
  `sfk-feedback`. (Maintainer-side `FEEDBACK.md` also notes the audit-only rule; not shipped.)
- **Authoring commit cadence: hand off at sign-off, not after every draft.** In a hand-off (Cowork)
  runtime, `sfk-next-milestone` no longer surfaces `git` commands during the authoring feedback loop —
  an authoring milestone iterates several rounds before it's ready, so per-draft commit prompts were
  noise. The whole milestone lands as a **single** commit at `sfk-signoff` (deliverable + status flip);
  mid-way checkpoints are available only on explicit request. Building milestones keep the per-ticket
  cadence. **Apply:** refresh — `sfk-next-milestone`, `sfk-signoff`; amend — the *Commit protocol*
  authoring bullet in the root `CLAUDE.md` (add the "surfaced at sign-off, not per draft" cadence note;
  preserve any user edits).
- **`Review mode` setting** in the root `CLAUDE.md` (*Project & kit*): `in-place` (default) or `pr`.
  **Apply:** add — insert the `Review mode` line into *Project & kit*; **interview** — *offer* `pr` mode
  (default `in-place`, so behaviour is unchanged unless chosen); if `pr`, detect the forge from the git
  remote and record its CLI. On an existing project this is an **offer**, not a forced change.
- **`sfk-next-ticket` gains `pr`-mode behaviour** — a branch per ticket, push + open a PR at `in-review`,
  and finalize by **detecting the merge** (the merge is the user's approval; the kit never merges).
  Degrades to `in-place` where unconfigured or unsupported (no remote / not git-safe). **Apply:** refresh.
- **New skill `sfk-address-review`** — pulls a ticket PR's review comments and revises on its branch;
  standalone, user-invoked, self-configures its forge command on first run. **Apply:** add — copy
  `.claude/skills/sfk-address-review/` in; no project edits.
- **`sfk-init` asks the review-mode question; `sfk-signoff` confirms a PR is merged before finalizing the
  last ticket in `pr` mode.** **Apply:** refresh — `sfk-init`, `sfk-signoff`.
- Method guide gains a *Review mode* note. **Apply:** refresh — the guide.

---

## v1.2.0 — independent test authorship (optional)

Optional **model split for tests vs code**: a test written by the same model that writes the code it
must pass is a weak check (shared blind spots; a misread requirement embodied in both). You can now have
a *different, stronger* model write the failing test — *grader ≠ graded* — before a cheaper model
implements to green. **Off by default; single-model behaviour is unchanged.**

- **A `Models` line in the root `CLAUDE.md` (*Project & kit*).** Records the `implementation` model and,
  optionally, a distinct `tests` model. **Apply:** add — insert the `Models` entry into the project's
  root `CLAUDE.md` *Project & kit* section; **interview** — ask whether the failing test should be
  written by a different, stronger model than the implementer, and if so record both models (default:
  one model, `tests: same`).
- **`sfk-next-ticket` writes the failing test with the `tests` model when one is configured** — in
  Claude Code, via a subagent pinned to that model, from the ticket + spec only, then implements to
  green in the driving session. Test-writer and implementer do not collaborate on a ticket; still one
  ticket, one commit; degrades to single-model where unconfigured or unsupported. **Apply:** refresh —
  `sfk-next-ticket`.
- **`sfk-init` asks the model question** and fills the `Models` line. **Apply:** refresh — `sfk-init`.
- Method guide gains an *Independent test authorship* note (Test discipline). **Apply:** refresh — the
  guide.

---

## v1.1.0 — two-folder payload, neutral verifier, copy-then-migrate updates

> ### ⚠ Pre-copy — back up your filled-in `sfk-verify` **before** copying this kit over your project
>
> In v1.0.x the `sfk-verify` **skill file itself held your content**: you filled its `PLACEHOLDER`s with
> your real gate commands and stack-specific checks at scaffolding. This version makes the skill
> **neutral** and moves those specifics into a new living doc, `spec/verify/verify.md`. The copy
> therefore **overwrites your filled-in skill** — before `sfk-update-kit` ever runs.
>
> ```
> cp .claude/skills/sfk-verify/SKILL.md ../sfk-verify-backup.md   # from your project root, before copying
> ```
>
> Already copied without a backup? **Don't commit** — it's still in git:
> `git show HEAD:.claude/skills/sfk-verify/SKILL.md > ../sfk-verify-backup.md`.
> Full instructions and recovery: repo-root **`UPGRADING.md`**.

- **The payload is now exactly two kit-owned folders: `.sfk/` and `.claude/`.** `spec/README.md` and
  `spec/.gitignore` moved into `.sfk/templates/` and are generated by `sfk-init`. Nothing a project owns
  is shipped any more, which is what makes the copy safe. **Apply:** refresh — the copy handles it; no
  project edits needed.

- **`sfk-verify` is now neutral and kit-owned.** The skill owns the *method* (what to check); the
  *specifics* — gate commands, contractual values, stack-specific and extra checks — live in
  `spec/verify/verify.md`, which the skill creates **by interview on its first run**. Scaffolding no
  longer "fills in the verifier".
  **This supersedes the v1.0.1 entry's `sfk-verify` Apply note** ("merge the new check into the
  project's filled-in `sfk-verify`"): there is no filled-in skill any more, and nothing to merge — the
  skill refreshes wholesale like every other.
  **Apply:** interview — create `spec/verify/verify.md` from `.sfk/templates/spec/verify/verify.md` and
  **extract the project's gate commands and stack-specific checks out of the backed-up (or
  git-recovered) v1.0.x `sfk-verify`** into it, interviewing for anything not recoverable. See the
  Pre-copy note above.

- **Updating is now copy-then-migrate.** The user copies the two kit-owned folders over the project
  (without committing); `sfk-update-kit` then applies this changelog's declared deltas to the files the
  project owns. No external kit, no temp folder, no delete step — and it works inside the Cowork sandbox,
  which can only see the project. **Apply:** refresh — `sfk-update-kit`.

- **New `Pre-copy` changelog note, and a repo-root `UPGRADING.md`.** `Apply` runs *after* the copy;
  `Pre-copy` is an instruction to the human *before* it, for when the copy would destroy something.
  **Apply:** refresh — the `.sfk/CHANGELOG.md` header.

- **Red-green TDD is binding, not optional guidance.** It is the default for all implementation work and
  may be overridden **only** by an explicit exemption recorded in the test strategy (named layer +
  rationale). Reaching `in-review` now requires that red-green was followed (or the layer is a stated
  exemption), said so in the completion report.
  **Apply:** add — the "Red-green is binding" non-negotiable to the root `CLAUDE.md`, and the red-green
  clause to its *Definition of done*; amend + interview — `spec/test-strategy/test-strategy.md` §1: state
  it binding and ask the user to name any exempt layers (or record "none"); refresh — `sfk-next-ticket`.

- **`sfk-feedback`: the template is binding.** Feedback files must be the template, filled — no custom
  structures or frontmatter; delete the guidance block, keep `## For the SFK maintainer` verbatim.
  **Apply:** refresh — `sfk-feedback`.

- **`sfk-signoff` tags the release.** On a version's **final** milestone it now creates the annotated tag
  from the version in the milestone plan and **offers** the push (never pushes unconditionally), guarded
  against a missing/ambiguous version, an existing tag, and a dirty tree. **Apply:** refresh —
  `sfk-signoff`.

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
