# CLAUDE.md — Interstate-8.5

Standing instructions for working in this repository. Read this first, every session. This file is
auto-loaded at the repo root. The full method and the binding specification live in `spec/` (start
at `spec/README.md`); layer-specific guidance lives in `<code>/<layer>/CLAUDE.md` and
`spec/tickets/CLAUDE.md`, which load automatically when you touch those directories.

## Project & kit

- **Project code:** `INT8` — the ticket prefix (`INT8-001`). Set by `sfk-init`.
- **Spec-First Kit version applied:** `1.0.0` — the *kit* version this project is on (set by
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
- `spec/design/design-system.md` — tokens, components, visual states; the frontend's visual contract.
- `spec/test-strategy/test-strategy.md` — frameworks, conventions, the definition of done.
- `spec/tickets/` — the work queue; ticket workflow rules in `spec/tickets/CLAUDE.md`.
- `.sfk/` — kit machinery (read-only): `manifest.md` (kit identity), `CHANGELOG.md`, and `templates/` (pristine sources the skills copy out). Never edit `.sfk/` by hand.
- `.claude/skills/sfk-*` — the workflow skills (`sfk-init`, `sfk-version`, `sfk-next-milestone`, `sfk-signoff`, `sfk-next-ticket`, `sfk-verify`, `sfk-update-kit`, `sfk-feedback`).

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

Drupal 11 on PHP, local development via **DDEV**. Front end: an owned starterkit-generated theme with
**SDC** as the component layer and **Tailwind v4** hand-wired without SASS (design tokens as CSS
custom properties); Layout Builder scoped narrowly. Search via **Search API** with a database backend
to start. Data comes in through the **Migrate API** (v2 MySQL dump as the sole source of truth).
Keep this paragraph in step with `spec/architecture/architecture.md` §6.

## Commands

- `ddev start` — bring the environment up (one-time / per-session).
- `ddev composer install` — install pinned PHP deps (one-time, online).
- `ddev launch` — open the running site.
- `ddev npm run watch` — theme dev mode (Tailwind rebuild + reload) once the theme is scaffolded.

Test targets:

- `ddev exec phpunit` — **the default gate**: the check that must pass on every ticket and at the
  pre-commit hook. Kept fast and honest while the codebase is small.
- Grows into a composite `ddev test` custom command adding **PHPCS** (Drupal coding standards) and
  **PHPStan** (static analysis) once there is enough code to justify it (lazy adoption).
- `ddev test-all` — everything; required at milestone completion (defined in the scaffolding milestone).

## Definition of done (implementation tickets)

A ticket reaches **`in-review`** (ready for the user's review) when: the default gate passes **with
zero warnings**; new/changed numbered-requirement behaviour has tests **in the same commit**; the
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
