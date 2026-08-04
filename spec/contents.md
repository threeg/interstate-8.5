# Interstate-8.5 — Contents of the specification

| | |
|---|---|
| **Document** | Specification contents (navigation index) |
| **Repository location** | `spec/contents.md` |
| **Last updated** | 2026-08-02 (Milestone 12 sign-off — content-model description extended for slice 2) |

Every document in `spec/`, in milestone order, so you can reach any part of the specification from one
place instead of opening folders. Open this file on your forge (GitHub/GitLab render it) or in any
Markdown viewer and follow the links; your **browser's back button** returns you here, which is why no
other document needs a link back.

> **Two things this index tells you at a glance.** Each section's **first entry is that section's binding
> master document** — the one implementation must honour. Anything listed under it is **supporting
> context**: useful, but not binding (reference material, integration notes, inspiration). If you only
> read one file per section, read the first one.
>
> **Navigation only — nothing here binds.** The linked documents are the specification; this is a way in.

> **Regenerated, not hand-maintained.** `sfk-signoff` rewrites the affected sections when a milestone is
> signed off, keeping the one-line descriptions already written, and `sfk-verify` checks that every file
> in `spec/` appears here and that every entry still exists. If you add a supporting document mid-flow,
> add its line — but nothing depends on you remembering.

---

## Status and the method

| Document | What it is |
|---|---|
| [`milestone-plan.md`](milestone-plan.md) | **Where the project is** — the milestone table and the *Current position* line. Read this first in a fresh session. |
| [`README.md`](README.md) | The method itself: the nine steps, the lifecycle, how the skills drive it. Kit-owned. |
| [`contents.md`](contents.md) | This index. |
| [`templates/layer-CLAUDE.md`](templates/layer-CLAUDE.md) | Template for a per-layer `CLAUDE.md`, copied out to `<code>/<layer>/` when a layer needs its own standing instructions. |

## Living registers

| Document | What it is |
|---|---|
| [`open-questions.md`](open-questions.md) | Values we build against but cannot confirm — `Q-n` for outside the team, `S-n` for ourselves. Never blocks work. Two `S-n` rows open as of M10; no `Q-n`. |
| [`TODO.md`](TODO.md) | The parking lot: work known but not yet specifiable, because the decision it needs doesn't exist. |
| [`id-registry.md`](id-registry.md) | What each id prefix (`FR-`, `NFR-`, `DR-`, `D-`, `Q-`, `S-`, `TODO-`, `INT8-`) means, and which document defines it. |

## 1. Brief

| Document | What it is |
|---|---|
| [`brief/brief.md`](brief/brief.md) | **Binding.** Northstar, slice-1 scope, users, out-of-scope, success criteria. |
| [`brief/5.0.x-dev2-brief.md`](brief/5.0.x-dev2-brief.md) | **Binding for slice 2.** The `5.0.x-dev2` delta brief: six goals (song-page alternates, the real homepage, reproducible install content, the design-source restructure, a root README, Composer standardisation), the `D-x` decisions the version owes, success criteria and risks. Scopes changes *against* the living spec — it does not reopen the northstar. |

## 2. Requirements

| Document | What it is |
|---|---|
| [`requirements/requirements.md`](requirements/requirements.md) | **Binding.** The numbered `FR-n` / `NFR-n` / `DR-n` rules; numeric thresholds are contractual. |

## 3. Architecture & content model

| Document | What it is |
|---|---|
| [`architecture/architecture.md`](architecture/architecture.md) | **Binding.** Layering and the dependency rule (§2.1), data model, migration and rendering flows, stack (§6). |
| [`architecture/api-contract.md`](architecture/api-contract.md) | **Binding.** Authoritative route/response shapes; where code and contract disagree, the contract wins. |
| [`architecture/content-model.md`](architecture/content-model.md) | **Binding.** The Drupal realisation: content types, fields and machine names, the Song type taxonomy, Remote-video media, Restricted HTML. Config is exported and verified against this — never hand-authored. *Slice 2 added the `Page` type and its Layout Builder scoping, the `Homepage hero` block, and the default content that makes a fresh install reproducible.* |

## 4. Wireframes

| Document | What it is |
|---|---|
| [`wireframes/overview.md`](wireframes/overview.md) | **Binding.** The screen index, shared layout and vocabulary, navigation, state-coverage matrix. |
| [`wireframes/01-homepage.md`](wireframes/01-homepage.md) | Home — design-only in slice 1; the go/no-go viability gate, not implemented. |
| [`wireframes/02-songs-landing.md`](wireframes/02-songs-landing.md) | Songs landing (Songlist) — the filterable, complete song list and its states. |
| [`wireframes/03-song-page.md`](wireframes/03-song-page.md) | Song page — text, video, and version cross-links. |
| `wireframes/Interstate-8 Wireframes.dc.html` | The click-through structural canvas the go/no-go was decided against (all three screens, desktop + mobile). Supporting — **proportion reference, not a value source** (design-system §1.1). |
| [`wireframes/design-brief.md`](wireframes/design-brief.md) | Supporting: the visual direction brief handed to Claude Design. |
| [`wireframes/references/README.md`](wireframes/references/README.md) | Supporting: the inspiration and reference images beside it (palette extraction, shield mark, v1/v2 screenshots). |

## 5. Design system

| Document | What it is |
|---|---|
| [`design/design-system.md`](design/design-system.md) | **Binding.** Tokens, components, visual states — and §1.1, which artefact is authoritative for which kind of fact. |
| `design/tokens.css` | The machine-readable token set the theme imports. The binding source for every colour, type and spacing **value**; components read `var(--…)` and never hardcode hex/px. |
| `design/interstate-8-design-refinement/project/Interstate-8 1B.dc.html` | The canonical hi-fi: all three screens at four widths, the component library, the token panel. Binding for **placement and component shape** (design-system §1.1). |
| [`design/interstate-8-design-refinement/README.md`](design/interstate-8-design-refinement/README.md) | Supporting: what the Claude Design export contains and how it is organised. |

## 6. Test strategy

| Document | What it is |
|---|---|
| [`test-strategy/test-strategy.md`](test-strategy/test-strategy.md) | **Binding.** Frameworks, the pyramid, the gates (§2.2), red-green and its exemptions, the definition of done. |

## 7. Tickets

> **Not enumerated on purpose.** A mature project has hundreds of ticket files and `BOARD.md` is already
> their index — listing them here would bury everything above. Only the ticket system's own documents are
> listed; go to `BOARD.md` for the queue.

| Document | What it is |
|---|---|
| [`tickets/BOARD.md`](tickets/BOARD.md) | **The queue** — every ticket, its status, order and traceability. |
| [`tickets/CONVENTIONS.md`](tickets/CONVENTIONS.md) | How tickets are structured, numbered and related; the status lifecycle and the ordering rules. |
| [`tickets/TICKET-TEMPLATE.md`](tickets/TICKET-TEMPLATE.md) | The per-type body formats and the frontmatter specification. |
| [`tickets/CLAUDE.md`](tickets/CLAUDE.md) | Ticket workflow rules (auto-loaded when working in `tickets/`). |

## Verification

| Document | What it is |
|---|---|
| [`verify/verify.md`](verify/verify.md) | The verifier's project-specific instructions: the Lando gate commands, contractual values to sweep, Drupal-specific checks. |

---

<!-- Regeneration notes, for whoever (or whatever) rewrites this file:
     - Walk spec/ for *.md. Every file appears exactly once, EXCEPT tickets/INT8-*.md, which are
       represented by BOARD.md alone, and spec/.sfk-feedback/ which is gitignored and out of scope.
     - Non-Markdown artefacts that BIND (tokens.css, the hi-fi HTML) are listed too, unlinked, because
       relative links to them do not render usefully on a forge.
     - Group by milestone, in milestone order. Registers and status files go in the two lead sections.
     - Within a section the binding master comes FIRST and is marked Binding; supporting files follow.
     - Link the file. Never link a numbered-section anchor: slugs embed section numbers and break
       silently on renumbering (see the method guide, Resolving an id).
     - PRESERVE existing one-line descriptions verbatim — they are hand-written. Only add rows for new
       files, and remove rows whose file is gone. -->
