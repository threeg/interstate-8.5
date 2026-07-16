# CLAUDE.md — Interstate-8.5

Standing instructions for working in this repository. Read this first, every session. This file is
auto-loaded at the repo root. The full method and the binding specification live in `spec/` (start
at `spec/README.md`); layer-specific guidance lives in `<code>/<layer>/CLAUDE.md` and
`spec/tickets/CLAUDE.md`, which load automatically when you touch those directories.

## Project & kit

- **Project code:** `INT8` — the ticket prefix (`INT8-001`). Set by `sfk-init`.
- **Spec-First Kit version applied:** `1.1.0` — the *kit* version this project is on (set by
  `sfk-init`, raised by `sfk-update-kit`). This is **not** the software's release version (that is
  chosen by the project and tracked in `spec/milestone-plan.md`). The kit's own version, changelog
  and pristine templates live in `.sfk/` (read-only — never edit it by hand; skills copy templates
  *out* of it).

## What this project is

Interstate-8.5 is a distinct new version in the Interstate-8.com project line — a long-running
Modest Mouse fan archive (setlist/tour-date archive indexed by song, discography including bootlegs
and side projects, news, and fan-contribution features). Its specific product goals for this version
are captured in `spec/brief/brief.md` via `sfk-version` → milestone 1 and are not yet fixed here. A
standing meta-goal carried from the wider effort: the spec-first method (SFK) is treated as a
deliverable in its own right — externalising the mental model onto disk so it survives multi-year
gaps and stays agent-legible — not merely as scaffolding.

## Non-negotiables

- **English** for everything: spelling, prose, comments, commit messages.
- **All documentation is Markdown.**
- The documents in `spec/` are the **binding specification.** Do not reopen or reinterpret a settled
  decision — implement to the spec. If the spec is genuinely wrong or missing, raise it and change
  the relevant `spec/` file first; never silently diverge.
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
  (`INT8-NNN: mark done (reviewed)`). **Never** bundle one ticket's closure into another ticket's
  commit, and never work more than one ticket before its predecessor is committed and reviewed.
- **Never hand-author Drupal config YAML.** Let Drupal generate its own config via the admin UI or
  API, then verify the exported config against the durable spec document on disk. Hand-writing config
  is error-prone (hallucination/consistency risk) and is not permitted.
- **Lazy adoption.** Add tooling only when a concrete trigger exists; avoid speculative complexity.
  Design stall — not excess ceremony — is the documented historical killer of this project.

## Where things live

- `spec/README.md` — the method (the nine steps, the lifecycle, how the skills drive it).
- `spec/milestone-plan.md` — the single source of truth for project status.
- `spec/brief/brief.md` — scope, goals, out-of-scope (binding).
- `spec/requirements/requirements.md` — the `FR-n` / `NFR-n` rules; numeric thresholds are contractual.
- `spec/architecture/architecture.md` — module layout, data model, the dependency rule, flows.
- `spec/architecture/api-contract.md` — authoritative interface shapes; where code and contract disagree, the contract wins.
- `spec/wireframes/` — the screens, states and navigation.
- `spec/design/design-system.md` — tokens, components, visual states; the frontend's visual contract. Its **§1 lists exactly where to build the FE from**: the token file `spec/design/tokens.css` (import it; never hardcode hex/px) and the canonical hi-fi `spec/design/interstate-8-design-refinement/project/Interstate-8 1B.dc.html` (match it).
- `spec/test-strategy/test-strategy.md` — frameworks, conventions, the definition of done.
- `spec/tickets/` — the work queue; ticket workflow rules in `spec/tickets/CLAUDE.md`.
- `.sfk/` — kit machinery (read-only): `manifest.md` (kit identity), `CHANGELOG.md`, and `templates/` (pristine sources the skills copy out). Never edit `.sfk/` by hand.
- `.claude/skills/sfk-*` — the workflow skills (`sfk-init`, `sfk-version`, `sfk-next-milestone`, `sfk-signoff`, `sfk-next-ticket`, `sfk-close-ticket`, `sfk-verify`, `sfk-update-kit`, `sfk-feedback`).

## Architecture dependency rule (enforced, not aspirational)

Provisional Drupal-oriented layering — finalised in the Architecture milestone (§2.1 of
`spec/architecture/architecture.md`), which this section is kept identical to.

`content-model → services → theme`, with `migration` populating the content model and `config`
capturing exported configuration. Concretely:

- `content-model/` — entity, field and content-type definitions (Drupal config). The data
  foundation; imports nothing project-internal.
- `migration/` — Migrate API source plugins that populate the content model from the v2 MySQL dump.
  Depends only on `content-model`.
- `services/` — custom-module logic (e.g. discography inclusion rules anchored to core members,
  setlist-by-song indexing, Search API integration). May depend on `content-model`.
- `theme/` — the presentation layer: SDC components, Twig templates, Tailwind. Consumes rendered
  content; **nothing imports `theme`.**
- `config/`, `tooling/`, `docs/` — cross-cutting support.

Breaking the rule fails the default gate. The concrete enforcement mechanism (a boundary check) is
wired in during the scaffolding milestone.

## Stack

Drupal 11 on PHP, local development via **Lando**. Front end: an owned starterkit-generated theme with
**SDC** as the component layer and **Tailwind v4** hand-wired without SASS (design tokens as CSS
custom properties); Layout Builder scoped narrowly. Search via **Search API** with a database backend
to start. Data comes in through the **Migrate API** (v2 MySQL dump as the sole source of truth).
Keep this paragraph in step with `spec/architecture/architecture.md` §6.

## Commands

- `lando start` — bring the environment up (one-time / per-session).
- `lando composer install` — install pinned PHP deps (one-time, online).
- `lando drush uli` — open the running site (generates a one-time login URL).
- `lando npm run watch` — theme dev mode (Tailwind rebuild + reload) once the theme is scaffolded.

Test targets:

- `lando test` — **the default gate**: PHPUnit + **PHPCS** (`Drupal`/`DrupalPractice`) + **PHPStan**
  (deprecation rules) + the dependency-rule boundary check. PHPCS/PHPStan are **scoped to custom code
  only** (`web/modules/custom` + the custom theme) — **never core/contrib**. Must pass on every ticket
  and at the pre-commit hook. (PHPStan's deprecation gate is the on-mission guard against the PHP-EOL
  trap that ended v2.)
- `lando playwright` — the Playwright + Axe front-end suite (theme / song-screen tickets).
- `lando test-all` — everything (the default gate **+ Playwright**); required at milestone completion.
  **Not a single wired command:** the gate runs on the `appserver` service and Playwright on the
  separate `pw` compose service, so run `lando test` **then** `lando playwright` from the host (decided
  in INT8-006; see `spec/test-strategy/test-strategy.md` §2.2).

## Commit protocol (who runs git)

Commits are gated by the **git-safety of the runtime**, which tracks the authoring/building split:

- **Authoring milestones (worked in Cowork): the agent hands off — it must never run `git`.** Cowork
  mounts the repo into a sandbox where the agent cannot safely touch `.git` (a partial commit can
  corrupt `.git/index`). The agent presents the exact `git add` / `git commit` commands and **you** run
  them. Committing the reviewed deliverable is your gate.
- **Building milestones (worked in Claude Code): the agent commits directly** — one ticket per commit,
  per `spec/tickets/CLAUDE.md`.

The rule follows *git-safety*, not the tool name: if you author in a git-safe runtime you may let the
agent commit; if you ever build in Cowork, switch that phase to hand-off. **When unsure, hand off** — it
is safe in every runtime.

## Definition of done (implementation tickets)

A ticket reaches **`in-review`** (ready for the user's review) when: the default gate passes **with
zero warnings**; **red-green was followed** — the failing test was written first and confirmed to fail
for the right reason, or the test strategy explicitly exempts that layer (say which in the completion
report); new/changed numbered-requirement behaviour has tests **in the same commit**; the
relevant heavier gate passes where the ticket says so; and the ticket's status + `## Notes` and its
`BOARD.md` row are updated in that commit. It becomes **`done`** only after the user reviews it —
`sfk-next-ticket` finalizes the previous `in-review` ticket on its next run (asking for the next
ticket is approval), or `sfk-signoff` finalizes the last one at milestone sign-off, each in a small
status-only commit. Docs-only, pure-styling and build-plumbing tickets may set `tests_required:
false` and must state the exemption in the body.

End each ticket with a **completion report**. In the **chat response**, open with the ticket **id and
title** and its **`## In plain English`** line, then give: (1) a short plain-language **summary**;
(2) a one-line **sanity test** the user can run; and (3) for any ticket that touches the UI, **QA
steps**. In the **ticket file**, append the summary and sanity test to `## Notes` and the QA steps to
`## QA steps`.

## Milestone status lifecycle

Milestones move `Not started (⬜) → In progress (🔶) → Complete (✅)`.

- **When work on a milestone starts (via `sfk-next-milestone`), mark it `In progress` (🔶)** in
  `spec/milestone-plan.md` and move the *Current position* line to it.
- **Never mark a milestone `Complete` (✅) on your own initiative.** Completion requires **explicit
  sign-off from the user**, performed via the `sfk-signoff` skill. Until sign-off, the milestone stays
  `In progress`, however done it looks.
- **`sfk-signoff`** is what flips a milestone to `Complete`, moves the *Current position* line to the
  next milestone, and commits that status change.
