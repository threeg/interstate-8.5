# <PROJECT> — Contents of the specification

| | |
|---|---|
| **Document** | Specification contents (navigation index) |
| **Repository location** | `spec/contents.md` |
| **Last updated** | <DATE> (<one-line note: which milestone's files were added>) |

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
| [`README.md`](README.md) | The method itself: the steps, the lifecycle, how the skills drive it. Kit-owned. |
| [`contents.md`](contents.md) | This index. |

## Living registers

| Document | What it is |
|---|---|
| [`open-questions.md`](open-questions.md) | Values we build against but cannot confirm — `Q-n` for the client, `S-n` for ourselves. Never blocks work. |
| [`TODO.md`](TODO.md) | The parking lot: work known but not yet specifiable, because the decision it needs doesn't exist. |
| [`id-registry.md`](id-registry.md) | What each id prefix (`FR-`, `NFR-`, `Q-`, and this project's own) means, and which document defines it. |

## 1. Brief

| Document | What it is |
|---|---|
| [`brief/brief.md`](brief/brief.md) | **Binding.** Scope, goals, users, out-of-scope, success criteria. |
| [`brief/decisions.md`](brief/decisions.md) | *Archive — not binding.* Why the brief says what it says, and every superseded wording. Not in the reading path; search it only when asking *why*. |

## 2. Requirements

| Document | What it is |
|---|---|
| [`requirements/requirements.md`](requirements/requirements.md) | **Binding.** The numbered `FR-n` / `NFR-n` rules; numeric thresholds are contractual. |
| [`requirements/decisions.md`](requirements/decisions.md) | *Archive — not binding.* Why the requirements say what they say, and every superseded wording. Not in the reading path; search it only when asking *why*. |

## 3. Architecture & interface contract

| Document | What it is |
|---|---|
| [`architecture/architecture.md`](architecture/architecture.md) | **Binding.** Module layout, the dependency rule, data model, key flows. |
| [`architecture/api-contract.md`](architecture/api-contract.md) | **Binding.** Authoritative interface shapes; where code and contract disagree, the contract wins. |
| <`architecture/<supporting>.md`> | <supporting context — e.g. an integration note or vendor reference; not binding> |
| [`architecture/decisions.md`](architecture/decisions.md) | *Archive — not binding.* Why the architecture and the contract say what they say, and every superseded wording. Not in the reading path; search it only when asking *why*. |

## 4. Wireframes

> Delete this section if the project renders nothing a person looks at. The overview is the master; one
> file per surface sits under it, plus any mockups and reference material. This is the section that grows
> least predictably, which is most of why this index exists.

| Document | What it is |
|---|---|
| [`wireframes/overview.md`](wireframes/overview.md) | **Binding.** The surface index, shared conventions, navigation, state-coverage matrix. |
| <`wireframes/01-<name>.md`> | <one surface: its states and behaviour> |
| <`wireframes/<mockup>`> | <renderable mockup — **proportion reference, not a value source**> |
| [`wireframes/decisions.md`](wireframes/decisions.md) | *Archive — not binding.* Why the wireframes say what they say, and every superseded wording. Not in the reading path; search it only when asking *why*. |

## 5. Design system

> Delete this section if there is no distinct visual design.

| Document | What it is |
|---|---|
| [`design/design-system.md`](design/design-system.md) | **Binding.** Tokens, components, visual states — and §1.1, which artefact is authoritative for which kind of fact. |
| [`design/decisions.md`](design/decisions.md) | *Archive — not binding.* Why the design system says what it says, and every superseded wording. Not in the reading path; search it only when asking *why*. |
| <`design/<token source>`> | <the machine-readable values the implementation imports> |

## 6. Test strategy

| Document | What it is |
|---|---|
| [`test-strategy/test-strategy.md`](test-strategy/test-strategy.md) | **Binding.** Frameworks, the pyramid, the gates, the definition of done. |
| [`test-strategy/decisions.md`](test-strategy/decisions.md) | *Archive — not binding.* Why the test strategy says what it says, and every superseded wording. Not in the reading path; search it only when asking *why*. |

## 7. Tickets

> **Not enumerated on purpose.** A mature project has hundreds of ticket files and `BOARD.md` is already
> their index — listing them here would bury everything above. Only the ticket system's own documents are
> listed; go to `BOARD.md` for the queue.

| Document | What it is |
|---|---|
| [`tickets/BOARD.md`](tickets/BOARD.md) | **The queue** — every ticket, its status, order and traceability. |
| [`tickets/CONVENTIONS.md`](tickets/CONVENTIONS.md) | How tickets are structured, numbered and related. |
| [`tickets/TICKET-TEMPLATE.md`](tickets/TICKET-TEMPLATE.md) | The per-type body formats. |
| [`tickets/CLAUDE.md`](tickets/CLAUDE.md) | Ticket workflow rules (auto-loaded when working in `tickets/`). |

## Verification

| Document | What it is |
|---|---|
| [`verify/verify.md`](verify/verify.md) | The verifier's project-specific instructions: gate commands, contractual values, extra checks. Created by `sfk-verify` on its first run. |

---

<!-- Regeneration notes, for whoever (or whatever) rewrites this file:
     - Walk spec/ for *.md. Every file appears exactly once, EXCEPT tickets/<PRJ>-*.md, which are
       represented by BOARD.md alone.
     - Group by milestone, in milestone order. Registers and status files go in the two lead sections.
     - Within a section the binding master comes FIRST and is marked Binding; supporting files follow.
     - Link the file. Never link a numbered-section anchor: slugs embed section numbers and break
       silently on renumbering (see the method guide, Resolving an id).
     - PRESERVE existing one-line descriptions verbatim — they are hand-written. Only add rows for new
       files, and remove rows whose file is gone.
     - Delete a whole section if that milestone was dropped (e.g. no UI). -->
