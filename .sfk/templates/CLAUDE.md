# CLAUDE.md — <PROJECT>

Standing instructions for working in this repository. Read this first, every session. This file is
auto-loaded at the repo root. The full method and the binding specification live in `spec/` (start
at `spec/README.md`); layer-specific guidance lives in `<code>/<layer>/CLAUDE.md` and
`spec/tickets/CLAUDE.md`, which load automatically when you touch those directories.

> This is the **root** instructions template — the project's own standing instructions, kept lean. It
> contains only what *every* session needs. Push layer-specific patterns into per-layer `CLAUDE.md`
> files (template: `spec/templates/layer-CLAUDE.md`). Replace every `<PLACEHOLDER>`.
>
> **Keeping it lean is a rule, not an aspiration — because length is the tax on being read.** This file is
> loaded at the start of *every* session, so anything in it competes for attention with everything else in
> it. Two habits keep it honest:
>
> - **Corrections are recorded in the archive beside the owning document, not here.** When a value duplicated
>   in this file is corrected, **fix the value** and log the *why* where the value is **defined**
>   (`spec/requirements/decisions.md`, `spec/architecture/decisions.md`, …  — every milestone folder has one,
>   beside its binding document). An inline *"this used
>   to say X"* note is loaded into every future session forever, to tell every future reader about a value
>   they never saw. The corrected text stands on its own.
> - **Anything temporary must name the condition that retires it.** A build-state snapshot ("⚠ partially
>   built — these commands don't exist yet"), a workaround, a caveat: state, in the block itself, what makes
>   it removable — *"delete when `<PRJ>-042` lands"*. Without that, it is indistinguishable from a permanent
>   rule the moment it goes stale. Same discipline the verifier applies to its own exceptions: an exception
>   with no expiry becomes an instruction to stop looking. Status belongs to `spec/milestone-plan.md` and
>   `BOARD.md`; a snapshot here is a convenience with an expiry date, never a second record.

## Project & kit

- **Project code:** `<PRJ>` — the ticket prefix (`<PRJ>-001`). Set by `sfk-init`.
- **Spec-First Kit version applied:** `1.4.7` — the *kit* version this project is on (set by
  `sfk-init`, raised by `sfk-update-kit`). This is **not** your software's release version (that
  is chosen by the project and tracked in `spec/milestone-plan.md`). The kit's own version,
  changelog and pristine templates live in `.sfk/` (read-only — never edit it by hand; skills
  copy templates *out* of it).
- **Models.** By default one model does everything. For **independent authorship** — whatever the
  implementer's work will later be *judged against* is written by a *different, stronger* model, so the
  bar isn't shaped to fit the work that has to clear it (grader ≠ graded) — name two:
  - `implementation: <model>` — the builder run day to day (e.g. the cheaper/faster one).
  - `tests: <model, or "same">` — writes the failing test from the ticket + spec, independently, and
    drafts any **ungated** ticket (below).
  `sfk-next-ticket` acts on the `tests` model for tests; `sfk-verify` for the cleanup tickets it files.
  `same` (or a single model) keeps the default single-model behaviour. Set by `sfk-init`.
  - **Ungated tickets get the same treatment, and only those.** A ticket's acceptance criteria are what
    the implementer's own work is checked against, so the reasoning that covers tests covers writing one.
    It applies where **no human gate** stands behind it: `sfk-verify`'s cleanup tickets, and any ad-hoc
    *"file this as a ticket"*. **Not** the ticket-generation milestone — you review and sign that off,
    which is a stronger check than model independence, and it is the expensive case besides.
- **Review mode:** `<in-place | pr>` — **where** a finished ticket is reviewed. It does not change what
  counts as approval. `in-place` (default): the work is committed and left `in-review` on the current
  branch; you review the diff in chat. `pr`: each ticket is worked on its own branch and pushed as a
  **pull/merge request**; the open PR *is* the `in-review` state and you review it on the forge
  (`sfk-address-review` pulls its comments back for revision). `pr` requires a git-safe runtime and a forge
  remote. Forge/CLI (if `pr`): `<e.g. github / gh>`. Set by `sfk-init`.
  - **Approval, in both modes, is you invoking `sfk-next-ticket` or `sfk-close-ticket`.** Those merge the
    PR as part of finalizing. The forge's **Approve button is not used** — you cannot approve your own PR,
    and nothing here waits for one.
  - **When reviewing a PR, submit a review — don't use the conversation box.** *Files changed → Start a
    review → line comments → Submit review → "Comment"*. A submitted review records the commit it was made
    against, which is what gives you **"changes since your last review"** next round, plus resolvable
    threads. A timeline comment gives neither.
  - **What `pr` mode is for:** a better review *surface* — durable line-anchored comments a skill can read
    back, checks running before merge, and an unmerged branch as a rollback boundary. **It does not give
    you a second reviewer:** the PR is authored by whoever's git identity the agent runs under, so you are
    still reviewing your own work. Genuine independence needs a different human, or the agent on its own
    account. If your branch protection **requires** an approving review, `pr` mode cannot work solo —
    nothing can merge.

## Audience (how to explain things)

Default to **plain language**: short sentences, no unexplained jargon, and the *"so what"* before the
mechanism. Assume a capable reader who may not share your specialism.

If a **`CLAUDE.local.md`** exists at the repo root, it declares **this person's** preferred register and
vocabulary — it is personal and gitignored, so each person working on the project can set their own, and
it loads after this file so it takes precedence. If there is none, work from the default above and offer
once to set one up.

> **This changes how you explain, never what you decide.** It must not affect scope, rigour, the order of
> the milestones, or any gate — and it must not soften a requirement's precision. The documents in `spec/`
> are **audience-neutral and identical for everyone**: `NFR-3` means what it says whoever is reading, and
> a ticket's `## In plain English` is written plainly for *all* readers, not for the person in the session.
> Adjust the conversation, not the artefacts.

## What this project is

> One short paragraph: what the product is and its single most important goal. If there is a
> meta-goal (e.g. "the process is as much a deliverable as the software"), state it here.

## Non-negotiables

> The handful of rules that are never broken. Examples to adapt:

- **<Language/locale>** for everything: spelling, prose, comments, commit messages.
- **All documentation is Markdown.**
- The documents in `spec/` are the **binding specification.** Do not reopen or reinterpret a
  settled decision — implement to the spec. If the spec is genuinely wrong, **stop before writing the code
  that depends on it**: put it to the user both ways — *change the spec, or change the code to match it?* —
  and if the spec changes, amend it (and the `decisions.md` beside it) **first**, then implement. Never silently
  diverge, and never implement first and reconcile the document afterwards. **Asked before the code exists,
  both answers cost the same and the choice is genuinely yours; asked afterwards, amending is the cheap
  option and sunk cost decides.** A ticket does not reach `in-review` with an amendment still owed. (The
  spec being *silent* is different — that is an open question: record it and carry on.)
- **Red-green is binding, not a preference.** For deterministic and contract-pinned work: write the
  failing test **first**, confirm it fails for the right reason, **then** implement. Never write the
  implementation first and back-fill tests. This is the default for all implementation work and is
  overridden only where `spec/test-strategy/test-strategy.md` explicitly names a layer as exempt.
- **Contractual values are not workarounds.** A model name, endpoint, threshold, or named constant
  fixed in `requirements.md` / `api-contract.md` is contractual. **Never** change it to work around an
  external or environmental error (an API 404, an auth failure, a missing key). When an external
  dependency errors: reproduce it directly (e.g. `curl`), check config / keys / endpoints, and if it is
  still unresolved **STOP and ask the user** — do not edit a spec'd value to make the error go away.
- **One ticket per commit; finalize before advancing.** Each ticket's work is one commit. When you
  start the next ticket, first mark the previously reviewed ticket `done` and commit **that alone**
  (`<PRJ>-NNN: mark done (reviewed)`). **Never** bundle one ticket's closure into another ticket's
  commit, and never work more than one ticket before its predecessor is committed and reviewed.
- **When you and the user are both guessing, record it — don't ask first.** If proceeding needs a value
  that `spec/` does not fix, and neither of you can confirm it, **add a row to `spec/open-questions.md` as
  you go**: the question in plain language, and the assumption you are proceeding on. Say that you have
  done it; do not wait to be asked, and never leave a bare `(to confirm)` marker in a document instead.
  Then **carry on** — an open question never blocks work (see that file's rules). Recording what we don't
  know is always correct, so it needs no permission.
  **`spec/TODO.md` is the opposite:** parking *work* changes scope, so there you **offer** ("shall I park
  this?") and wait for the user — but do offer, rather than only acting when asked.
- **<Any hard runtime constraint>** (e.g. no network at runtime).

## Where things live

- `spec/README.md` — the method (the nine steps, the lifecycle, how the skills drive it).
- `spec/contents.md` — the index of **every** document in `spec/`, in milestone order, each section's binding master first and supporting files under it. The quickest way to find a spec document, and the only place the binding/supporting split is visible at a glance. Regenerated at milestone sign-off; navigation only, nothing here binds.
- `spec/milestone-plan.md` — the single source of truth for project status.
- `spec/brief/brief.md` — scope, goals, out-of-scope (binding).
- `spec/requirements/requirements.md` — the `FR-n` / `NFR-n` rules; numeric thresholds are contractual.
- `spec/architecture/architecture.md` — module layout, data model, the dependency rule, flows.
- `spec/architecture/api-contract.md` — authoritative interface shapes; where code and contract disagree, the contract wins.
- `spec/wireframes/` — the screens, states and navigation. (Omit for non-UI projects.)
- `spec/design/design-system.md` — tokens, components, visual states; the frontend's visual contract. (Omit if no visual design.)
- `spec/test-strategy/test-strategy.md` — frameworks, conventions, the definition of done.
- `spec/verify/verify.md` — the verifier's project-specific instructions (gate commands, contractual values to sweep, extra checks). `sfk-verify` is neutral and reads this; created by interview on its first run.
- `spec/TODO.md` — the parking lot: work known but not yet specifiable (its blocking decision doesn't exist). `sfk-todo` appends entries; `sfk-version` harvests them into a version; ticket generation replaces a resolved entry's body with a one-line tombstone in its *Resolved* table recording what it asked and what was decided — because a `TODO-n` is **cited while it is open** and those citations outlive the entry (and, as a consequence, the next id is never reused). Tombstones are never harvested or swept. Committed and shared; **not** a second backlog.
- `spec/open-questions.md` — the register of values we are building against but cannot confirm: `Q-n` for the client, `S-n` for ourselves. Recorded automatically as they arise (see *Non-negotiables*); an open question **never blocks work**. Section 1 is written in plain language so it can be sent to the client as it stands and returned with the Answer column filled in. **Not** the parking lot.
- `spec/id-registry.md` — the id family registry: what each id prefix (`FR-`, `NFR-`, and this project's own) means and which document defines it. A navigation aid, **not** binding — and never a copy of a rule's content. To find what a specific id *says*, search for it; see *Resolving an id* in `spec/README.md`.
- `spec/tickets/` — the work queue; ticket workflow rules in `spec/tickets/CLAUDE.md`.
- `.sfk/` — kit machinery (read-only): `manifest.md` (kit identity), `CHANGELOG.md`, and `templates/` (pristine sources the skills copy out). Never edit `.sfk/` by hand.
- `.claude/skills/sfk-*` — the workflow skills (`sfk-init`, `sfk-version`, `sfk-next-milestone`, `sfk-signoff`, `sfk-next-ticket`, `sfk-close-ticket`, `sfk-address-review`, `sfk-verify`, `sfk-todo`, `sfk-update-kit`, `sfk-feedback`).

> Each authoring milestone has its own folder under `spec/` (e.g. `spec/architecture/`). The
> named master file in it is binding; any other files in the folder are supporting context (reference
> docs, integration specs, inspiration) and are not binding.

## Architecture dependency rule (enforced, not aspirational)

*Not set yet — settled at the architecture milestone (step 3) and written here at its sign-off.*

> **Deliberately blank at init.** The layering is the architecture milestone's deliverable, decided from
> the brief and the requirements — not guessed on day one. No code exists before scaffolding (step 8), so
> there is nothing here for a rule to protect in the meantime, and a guessed rule would only have to be
> unpicked. `sfk-next-milestone` proposes a layering with its rationale, and fills this in once you sign it
> off. Once written, keep it **identical** to `spec/architecture/architecture.md` §2.1.

<!-- The shape this takes once settled — the one-line rule, then what each layer may import:

     `core → domain → services → interface`, with `storage` beneath `services`. Concretely:

     - `core/` imports the standard library only. Pure functions over immutable data.
     - `domain/` may import only `core`.
     - `services/` may import `core`, `domain`, `storage`.
     - `interface/` imports only `services` and its schemas. Nothing imports `interface`.
     - `storage/` imports nothing from `core`/`domain`/`services`/`interface`.

     This is enforced by <boundary-enforcement tool> and a standard-library allowlist test; breaking it
     fails <the default gate>. -->

## Stack

*Not set yet — proposed at the architecture milestone (step 3), confirmed at scaffolding (step 8).*

<!-- One paragraph once known: languages, frameworks, datastore, process topology. Keep in step with
     spec/architecture/architecture.md §6. -->

## Commands

*Not set yet — written at scaffolding (step 8), when the runner and the gates actually exist.*

> **Deliberately blank at init.** Naming a command runner before the stack is chosen invents a fact. The
> gate *names* firm up at the test-strategy milestone (step 6); the real commands land at scaffolding,
> which is also the first point anything can be run.

<!-- The shape this takes once the stack exists — the single command runner the agent should always use:

     - <make setup> — one-time, online: install pinned deps, fetch any models, build, install browsers.
     - <make run>   — the single command to start the app.
     - <make dev>   — development mode (reload + client dev server).

     Test targets (all offline after setup):

     - <make test> — THE DEFAULT GATE: unit + integration + the dependency-rule contracts + the core
       coverage gate. Run it on every ticket.
     - <make test-<heavy>> / <make test-perf> / <make test-e2e> — heavier gates, per ticket type.
     - <make test-all> — everything; required at milestone completion. -->

> Until the Commands section is filled, **do not invent a command**. If something needs running before
> scaffolding, ask.

## Commit protocol (who runs git)

Commits are gated by the **git-safety of the runtime**, which tracks the authoring/building split:

- **Authoring milestones (worked in Cowork): the agent hands off — it must run _no_ `git` at all.**
  Cowork mounts the repo into a sandbox where the agent cannot safely touch `.git`. This is **not** just
  a commit/write rule: **read-only `git status` / `git log` / `git diff` are prohibited too.** In the
  sandbox even a read-only invocation refreshes the index and leaves a `.git/index.lock` the agent
  **cannot unlink** (`Operation not permitted`); that stale lock then blocks *your* next `git add` /
  `commit` until you remove it by hand. Determine milestone and commit state **only** from
  `spec/milestone-plan.md` and from the user — **never probe `.git` to infer it.** The agent presents the
  exact `git add` / `git commit` commands and **you** run them. Committing the reviewed deliverable is
  your gate. The hand-off commit is surfaced **at sign-off** (one commit: deliverable + status flip),
  *not* after every draft or revision — an authoring milestone iterates before it's ready, so mid-loop
  commit prompts are noise. Ask if you want a mid-way checkpoint.
- **Building milestones (worked in Claude Code): the agent commits directly** — one ticket per commit,
  per `spec/tickets/CLAUDE.md`.

The rule follows *git-safety*, not the tool name: if you author in a git-safe runtime you may let the
agent commit; if you ever build in Cowork, switch that phase to hand-off. **When unsure, hand off** — it
is safe in every runtime.

## Definition of done (implementation tickets)

A ticket reaches **`in-review`** (ready for the user's review) when: `<make test>` passes **with zero
warnings**; **red-green was followed, and `## Notes` quotes the observed failure** — the test's name and
its failure message **verbatim** (see below), or the test strategy explicitly exempts that layer (say
which in the completion report); new/changed numbered-requirement behaviour has tests **in the same commit**; the core
coverage gate holds for core-touching work; the relevant heavier gate passes where the ticket says so;
**any spec amendment this ticket required was made *before* the code that depends on it, and is referenced
from the ticket**; and the ticket's status + `## Notes` and its `BOARD.md` row are updated in that commit. It becomes
**`done`** only after the user reviews it — `sfk-next-ticket` finalizes the previous `in-review` ticket on
its next run (asking for the next ticket is approval), or `sfk-close-ticket` finalizes it without starting
another, each in a small status-only commit (and in `pr` mode each merges the PR). **`sfk-signoff` does not
finalize tickets** — it refuses to run while one is open, so a building milestone ends with
`sfk-close-ticket` then `sfk-signoff`. Docs-only, pure-styling and build-plumbing tickets may set
`tests_required: false` and must state the exemption in the body.

> **Red-green needs the observed failure, not a claim that there was one.** Quote the test's name and the
> message it actually produced:
>
> > `rounds a computed 57.5 up`: `AssertionError: expected 57 to be 58`
>
> **The bar: a reader can tell a real red-green from a plausible one without re-running anything.**
> *"All the new tests passed on the first implementation attempt"* fails that bar — it is equally true of a
> test written from the spec before the implementer saw the problem and of one written afterwards to fit
> code that already worked. It costs one copy-paste you already have on screen.
>
> **Why this one item is held to evidence when the others are held to a statement:** every other line above
> describes something still on disk and auditable later — a gate can be re-run, a spec amendment re-read, a
> `BOARD.md` row re-checked. *"The failing test was written first, from the spec, before the implementer saw
> the problem"* is a fact about **a moment that leaves no trace**. It is either captured in this commit or
> gone permanently, and under independent test authorship it is exactly the property that authorship buys.
>
> **Permitted substitutes, when there is honestly no red to show.** State which applies and why, in one
> line — don't manufacture a failure to satisfy the form:
> - **A pure refactor** whose verification is the untouched existing suite (say so, and that it was green
>   before and after) plus any byte-identical golden/snapshot comparison.
> - **A guard whose absence cannot be expressed** in the type system or the test framework — name what you
>   tried and why it could not be made to fail.
> - **A layer the test strategy exempts** — cite the section.
>
> Anything else with `tests_required: true` needs the quoted failure.

End each ticket with a **completion report**. In the **chat response**, open with the ticket **id and
title** and its **`## In plain English`** line — so the reader sees which ticket landed and its
plain-language purpose first — then give: (1) a short plain-language **summary** of what was done;
(2) a one-line **sanity test** the user can run; and (3) for any ticket that touches the UI, **QA
steps** — the manual actions and their expected results. If the ticket **amended the spec**, say so and say
**when** — before the dependent code, as required, or after, which is a process deviation worth naming
rather than quietly correcting. In the **ticket file**, append the summary and
sanity test to `## Notes` and the QA steps to `## QA steps`; the id, title, and plain-English already
live in the ticket, so they are not repeated in `## Notes`.

## Milestone status lifecycle

Milestones move `Not started (⬜) → In progress (🔶) → Complete (✅)`.

- **When work on a milestone starts (via `sfk-next-milestone`), mark it `In progress` (🔶)** in
  `spec/milestone-plan.md` and move the *Current position* line to it.
- **Never mark a milestone `Complete` (✅) on your own initiative.** Completion requires **explicit
  sign-off from the user**, performed via the `sfk-signoff` skill — finishing the deliverable, passing
  the gates, and self-verification are not sufficient. Until sign-off, the milestone stays
  `In progress`, however done it looks.
- **`sfk-signoff`** is what flips a milestone to `Complete`, moves the *Current position* line to the
  next milestone, and commits that status change.
