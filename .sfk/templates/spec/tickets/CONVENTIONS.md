# <PROJECT> — Ticket-System Conventions

| | |
|---|---|
| **Document** | Ticket-system conventions |
| **Repository location** | `spec/tickets/CONVENTIONS.md` |
| **Applies to** | Every file in `spec/tickets/`, alongside `TICKET-TEMPLATE.md` (the canonical format) |

This document defines how the ticket system works: the identifier scheme, the status lifecycle, what
each frontmatter field means, how `depends_on` expresses execution order, the rule that a ticket may
not start until its dependencies are done, and how tickets are kept honest as work completes.
`TICKET-TEMPLATE.md` is canonical for the *shape* of a ticket; this document governs the *system* the
tickets form. Where the two appear to disagree, the template wins on format and this document wins on
process.

The ticket system replaces an external tracker: tickets are plain Markdown files living beside the
code in a single repository, committed and updated in the same commits as the work they describe.

> Replace `<PRJ>` throughout with your project's short prefix (e.g. `ACME`, `WIDGET`). Replace the layer
> names with your architecture's layers.

---

## 1. Identifier scheme

1. **Implementation tickets** are `<PRJ>-NNN`, zero-padded to three digits: `<PRJ>-001`,
   `<PRJ>-002`, … The number is allocated in **execution order** — a ticket with a lower number
   never depends on a higher-numbered one (§4). The id is permanent once allocated; numbers are never
   reused or renumbered, even if a ticket is later abandoned.
2. **Epics** are `<PRJ>-E0N`: `<PRJ>-E01`, `<PRJ>-E02`, … Epics are containers (brief capabilities)
   and carry no code, so they sit *outside* the execution order; the `E` prefix keeps them visually
   distinct and stops them consuming an execution slot.
3. The filename is the id plus a short slug: `<PRJ>-007-core-constants.md`,
   `<PRJ>-E02-pure-core.md`. One ticket per file.
4. A ticket's id appears in exactly one place as the source of truth — its own `id:` frontmatter
   field. Every other mention (a `depends_on` edge, an epic's `Children` list, a `BOARD.md` row) is a
   reference to it.

---

## 2. Status lifecycle

The `status` field takes exactly one of the five values defined by the template:

| Status | Board icon | Meaning | Entry condition |
|--------|-----------|---------|-----------------|
| `todo` | ⬜ | Not started. The default at creation. | — |
| `in-progress` | 🔶 | Actively being worked. **All** `depends_on` ids are `done` (§4). | Work has started. |
| `blocked` | ⛔ | Cannot proceed despite dependencies being met — an external problem, a discovered defect elsewhere, or a decision needed. | Recorded with the reason in `## Notes`, **naming what it is blocked on**. |
| `in-review` | 👀 | Implemented, committed and self-tested by `sfk-next-ticket`; the definition of done holds bar the user's review. A freshly implemented ticket rests here. | Implementation finished, gates green (§5). |
| `done` | ✅ | Reviewed and approved. The `in-review → done` flip is its own small status-only commit. | Finalized on the next `sfk-next-ticket` run, or by `sfk-close-ticket` (including a milestone's last ticket). |

**The icon is for `BOARD.md` only, and the token is the value.** A ticket's own `status:` frontmatter
carries the bare token and nothing else — it is a machine-read field (§1). The board writes both
(`✅ done`), because that is the document people scan by eye; see §5.4 for the rule and the reason. ⬜ / 🔶
/ ✅ are deliberately the same three `spec/milestone-plan.md` uses, so the method has **one** icon
vocabulary rather than two; `blocked` and `in-review` have no milestone equivalent and take their own.

Normal flow is `todo → in-progress → in-review → done`. `sfk-next-ticket` sets `in-review` when it
finishes implementing a ticket (in the work commit); the ticket becomes `done` only once **reviewed** —
`sfk-next-ticket` finalizes the previous `in-review` ticket at the start of its next run (the user
invoking it is their approval), and `sfk-close-ticket` does the same finalize without starting another —
each as a small status-only commit, and in `pr` mode each squash-merges the ticket's PR. **`sfk-signoff`
does not finalize tickets**; it refuses to run while one is open. `blocked` may be entered from `in-progress` and is left
back to `in-progress` once unblocked.

The milestone tracker (`spec/milestone-plan.md`) uses its own three-symbol vocabulary (⬜ / 🔶 /
✅) for *milestones*; that is a separate, coarser lifecycle and is not the per-ticket status here.

---

## 3. Frontmatter fields

| Field | Meaning and rules |
|-------|-------------------|
| `id` | The unique identifier (§1). Source of truth for the ticket's identity. |
| `title` | Short imperative summary. One line. |
| `type` | `epic` \| `story` \| `task` \| `spike`. Stories are user-facing slices; tasks are backend/infra work verified without an interactive UI; epics are containers; spikes are time-boxed investigations. The body structure follows from this field. **A `task` may still change rendered output** (a generated document, report, print output, email, image) — when it does, its `## Design authority` section is required, exactly as for a story. |
| `status` | The lifecycle value (§2). |
| `milestone` | The milestone number from `spec/milestone-plan.md`. Scaffolding/tooling/fixtures and implementation are typically separate milestones. Epics record the milestone in which their last child completes. |
| `batch` | Optional grouping within a milestone. Here it carries the **architecture layer**, making the dependency rule legible at a glance and giving `BOARD.md` a second axis. |
| `layer` | The architecture layer (`core` \| `domain` \| `storage` \| `services` \| `interface` \| `frontend` \| `tooling` \| `docs` \| `repo`). The `depends_on` graph must respect the dependency rule for this layer (§4). |
| `depends_on` | The execution-order edges: ids that must be `done` before this ticket may start (§4). Epics are never listed here — depend on the specific child instead. |
| `before` | **Optional — omit the line entirely when there is nothing to record**, which is nearly always. The **inverse** edges: ids this ticket must *precede* (§4.6). Unlike `depends_on`, it **may name a lower-numbered id** — that is the point of it. Reach for it only when the constraint cannot be a `depends_on`, which in practice means a promoted cleanup ticket (§6.5). |
| `implements` | The `FR-n` / `NFR-n` ids from `spec/requirements/requirements.md` this ticket realises. Every requirement is implemented by at least one ticket; `BOARD.md` traceability derives from these fields. Pure scaffolding/tooling tickets may implement an NFR's *enforcement* or none. |
| `tests_required` | `true` for any ticket creating/changing numbered-requirement behaviour (tests in the same commit). `false` only for docs-only, pure-styling, or build-plumbing tickets; the body states which exemption applies. |
| `estimate` | Rough session-sizing on the Fibonacci scale (1, 2, 3, 5, 8). A sizing aid, not a commitment; every ticket is scoped to fit a single implementation session. |

No ticket adds frontmatter fields beyond those the template defines, and none omits a required field.
`before` is the one **optional** field: absent means the same as `[]`, so a ticket with no out-of-sequence
constraint simply leaves the line out. Existing tickets never need editing to gain it.

---

## 4. `depends_on` — ordering and the start rule

1. **`depends_on` is the execution order.** Each entry is the id of a ticket that must be `done`
   before this ticket may move to `in-progress`. This is the one and only place execution order is
   encoded; `BOARD.md` is a *view* of these edges, never an independent source.
2. **The start rule.** A ticket may not start until **every** id in its `depends_on` is `done`, **and
   until every ticket naming it in a `before` list is `done`** (§4.6 — `before: [Y]` on X gates Y
   exactly as `depends_on: [X]` on Y would). Starting earlier means building on unfinished foundations
   and is a process violation.
3. **No forward dependencies.** Because ids are allocated in execution order (§1.1), every id in a
   `depends_on` list is numerically lower than the ticket's own id. The set of tickets is therefore a
   **valid topological ordering**: reading `BOARD.md` top to bottom is a legal build sequence. Any
   forward edge is a defect, fixed by re-sequencing, not worked around.
4. **The dependency rule is encoded here.** The architecture's layer rule (architecture §2.1) must be
   reflected in the `depends_on` graph: a `services` ticket may depend on `core`/`domain`/`storage`
   tickets; an `interface` ticket depends on `services`, never the reverse. The boundary-enforcement
   tooling enforces the same rule in code; the ticket graph and the import contracts must agree.
5. **Frontend independence.** Because the interface contract (`spec/architecture/api-contract.md`) is fixed, the
   frontend/client can be built against the contract independently of the backend. Frontend tickets
   therefore depend on the frontend skeleton, the typed client, and the request mocks — **not** on the
   backend endpoint tickets. End-to-end assembly is reconciled in an e2e capstone ticket that depends
   on both sides.
6. **`before` — the inverse edge, for the constraint `depends_on` cannot express.** `before: [Y]` means
   *this ticket must be worked before `Y`*. It is the dual of `depends_on` — `depends_on: [X]` is "not
   before X", `before: [Y]` is "not after Y" — so either can be derived from the other, and both impose
   the same start condition (§4.2).

   **It exists because §4.3 makes a real, recurring case unexpressible.** Cleanup tickets are by
   construction numbered *after* everything they clean up (§6.1). So when a post-batch review finds that
   a **later**-numbered ticket must be worked **before** an earlier-numbered one — the promotion case,
   §6.5 — that constraint cannot be a `depends_on` edge without creating the forward dependency §4.3
   forbids, and ids are never renumbered (§1.1). This is the *normal* output of a verification pass, not
   an edge case.

   **Without it, the only record is row position in `BOARD.md`, and row position is invisible.** Nothing
   in an inserted row shows that it arrived out of order. Any reader who sorts by id, reads the cleanup
   table separately from the main one, or works from ticket frontmatter loses the constraint completely,
   and a later edit that re-sorts the table drops it with no trace. As data instead of prose it becomes
   checkable: *is this ticket still ahead of the thing it must precede?* is then a mechanical question.

   **`before` may name a lower-numbered id — that is its entire purpose — and this does not weaken
   §4.3.** That invariant is about `depends_on` never pointing forward, so that ids read in execution
   order; its purpose is that a genuine constraint gets **recorded**, not that an inconvenient one goes
   unrecorded. `depends_on` stays backward-only, and the topological reading of the board still holds.

   **Write both ends.** Adding `before: [Y]` to X also moves X's row above Y's in `BOARD.md` and sets
   X's *flag* cell (§5.4). The row move is the human-legible half; the field is the checkable half, and
   `sfk-verify` audits that the two still agree.

   **Rare by design.** Nearly every ordering constraint is a `depends_on`. Reach for `before` only when
   the id arithmetic forbids one.
7. **Epics carry no edges.** An epic lists its children in its body and is referenced by them in
   prose, but never appears in any `depends_on`. Epics close when all their children are `done`.

---

## 5. Keeping tickets honest as work completes

Tickets are updated *as work completes*, not retrofitted. The mechanism, binding for every
implementation ticket:

1. **Status and notes change in the same commit as the work.** When a commit moves a ticket's state —
   starting it, finishing implementation (to `in-review`), blocking it — that commit edits the ticket's
   `status` and appends a dated line to `## Notes`. The work and the record of the work are never split
   across commits. The one status move not tied to code is the review finalize: the `in-review → done`
   flip rides its own small commit (`sfk-next-ticket`'s next run, or `sfk-signoff`), carrying the status
   change and the `BOARD.md` row only.
2. **The definition of done is the gate.** A ticket reaches `in-review` only when every checkbox in its
   body's definition of done is satisfied (test strategy §12.3); it reaches `done` only after the user's
   review (the finalize step).
3. **`## Notes` is the audit trail.** Creation, status transitions, blockers, and any decision that
   deviates from or refines the spec are recorded there with an ISO date.
4. **`BOARD.md` is regenerated, not hand-edited for status.** When a ticket's status changes,
   `BOARD.md`'s status column is brought into line in the same commit. The board is a derived view
   (§4.1), kept in step with the ticket files rather than treated as a parallel source.
   - **A board status cell is `<icon> <token>` — both, always** (§2's table gives the icons): `✅ done`,
     `⬜ todo`, `👀 in-review`. The icon exists because a board of a hundred near-identical rows is read
     by eye, and *"what is open right now?"* should not require reading every row — the same reason
     `spec/milestone-plan.md` has had icons all along. **The text token is the value; the icon is
     decoration.** Never write the icon alone, for two reasons: status is routinely `grep`-ed (by
     `spec/verify/verify.md`'s board-versus-ticket agreement check, and by hand), and **a sweep that
     matches nothing looks exactly like a sweep that found nothing wrong** — an icon-only column would
     turn every such check into a silent pass. Emoji also render at inconsistent widths across terminals
     and Markdown viewers, so icon-plus-text degrades to something still readable.
   - **The `flag` column carries out-of-sequence facts, and nothing else.** Blank on nearly every row.
     It holds `🔺 before <id>` when the ticket is **promoted** (§6.5) — the 🔺 says *this is out of
     sequence on purpose*, the `before <id>` says *ahead of what*, mirroring the ticket's `before:`
     field (§4.6) so the constraint is legible without opening the file. A `before:` set for any other
     reason gets the `before <id>` without the 🔺. Link the id like any other (see above).
   - **No ad-hoc emphasis.** Do not bold, asterisk or otherwise mark a row to mean "notable" — `status`
     and `flag` carry meaning here, and nothing else does. An undocumented convention invented row by
     row ends up carrying several meanings at once, which is worse for the next reader than carrying
     none. If a row needs a fact the columns cannot hold, the fact belongs in the ticket.
   - **A `blocked` row names what it is blocked on** in the ticket's `## Notes` (§2). "Cannot start
     until a decision is made" is a `blocked` ticket, not a flag — `blocked` already has a lifecycle and
     an owner, and a second marker for the same fact would give the board two answers to one question.
   - **Every id in `BOARD.md` is a link to its file** — in the `id` column, in `depends_on` cells, in the
     epic and traceability tables, and in prose: `[<PRJ>-036](<PRJ>-036-<slug>.md)`. The board is the
     document people navigate most, and a forge or Markdown viewer makes a linked id one click from the
     ticket. This is the safe kind of link — an id maps to a **whole file**, so there is no section anchor
     to break (see *Resolving an id* in `spec/README.md`).
   - **Decoration wraps *inside* the link, never outside.** `` `<PRJ>-064` `` becomes
     `` [`<PRJ>-064`](<PRJ>-064-<slug>.md) `` — **not** `` `[<PRJ>-064](<PRJ>-064-<slug>.md)` ``. The second
     form puts link syntax inside a code span, so it renders as literal brackets and parentheses instead of
     a link. A naive regex over `<PRJ>-\d{3}` that ignores surrounding backticks or `**` produces exactly
     that; expand outward over any symmetric decoration pair first, then wrap.
   - **Whatever writes a row emits it already linked** — ticket generation, `sfk-next-ticket`,
     `sfk-close-ticket`, and `sfk-verify` when it files a promoted cleanup ticket. A bare id from any one of
     them degrades the file unevenly, and nobody can tell afterwards which pass did it. Do not rely on a
     later cleanup sweep.
5. **A specification change is a documented change, and it comes *first*.** Numeric thresholds and rules
   are contractual. If implementing a ticket reveals the spec must change, **stop**: the change is agreed
   with the user, recorded in the relevant `spec/` document (and its decisions log) **before** the code that
   depends on it, and referenced from the ticket. Tickets do not silently reinterpret a settled decision.
   **The order is not bookkeeping.** Asked before the code exists, "amend the spec" and "fix the code to
   match" cost the same and the user can choose freely; asked afterwards, amending is cheap and changing the
   code looks expensive, so sunk cost decides. It also leaves no way to tell later whether the spec was a
   decision or a rationalisation — which is what makes auditing code against it meaningful. A ticket does
   **not** reach `in-review` with an amendment still owed.
6. **Every completed ticket carries a completion report.** On completion the ticket records — and the
   chat response repeats — a plain-language **summary** and a one-line **sanity test**; UI tickets
   additionally record manual **QA steps** (which accumulate as living per-screen documentation). The
   **chat response opens with the ticket id, title, and its `## In plain English` line** before the
   summary, so the reader sees which ticket landed and why it matters first; those three are chat-only
   (already in the ticket) and are not written into `## Notes`.

---

## 6. Cleanup backlog

Reactive tickets discovered by post-batch review rather than planned up front.

1. **Creation.** After each batch completes, run the **`sfk-verify` skill** (`.claude/skills/sfk-verify/SKILL.md`),
   which audits the committed code against the spec and reviews it for reuse, quality and efficiency
   issues. Accepted findings become cleanup tickets — ordinary `task` tickets with `batch: cleanup`,
   numbered after the current highest id so the no-forward-dependency invariant (§4.3) holds
   automatically.
2. **Board placement.** Cleanup tickets live in a dedicated **Cleanup backlog** table in `BOARD.md`,
   separate from the main execution-order table, so they stay visible without cluttering the critical
   path.
3. **Dependencies.** Each cleanup ticket's `depends_on` lists the tickets whose code it cleans up.
   Nothing in the main sequence depends on a cleanup ticket unless explicitly promoted.
4. **When to work them.** Between batches or at the end of a milestone, at the developer's discretion,
   under the same lifecycle and definition-of-done rules.
5. **Promotion.** If a cleanup ticket is **critical** — it would cause a gate failure (e.g. a
   performance regression, a warning that breaks the zero-warnings gate) — it is promoted into the
   main sequence, slotted before the gate it would affect. Promotion is recorded in **three** places,
   in one commit:
   - **`before:`** on the promoted ticket, naming the ticket it must precede (§4.6). This is the
     authoritative record, and it is the reason the field exists — a cleanup ticket is numbered after
     everything it cleans up, so this edge can never be a `depends_on`.
   - **its row moves** into the main-sequence table, above the ticket it must precede;
   - **its `flag` cell** becomes `🔺 before <the id>` (§5.4), so the row itself says it is out of
     sequence rather than relying on position alone.

   Promotion is a **binary property with a definition** — *would this fail a gate?* — which is what
   keeps the flag honest. It is deliberately not a priority scale: an undefined level rots into a
   record of what was urgent months ago, and with nobody owning it, nothing would catch that.
6. **Scope.** Cleanup tickets do not implement new requirements (`implements: []`); they improve
   internal quality of already-shipped code. A finding that reveals a genuine spec gap is a
   specification change (§5.5), not a cleanup ticket.

---

## 7. Relationship to the other index files

- `TICKET-TEMPLATE.md` — the canonical per-ticket format. Authoritative for shape.
- `CONVENTIONS.md` (this file) — how the ticket *system* works. Authoritative for process.
- `BOARD.md` — the single topological view of all tickets in execution order, plus requirement
  traceability derived from `implements`.
- `CLAUDE.md` (in this folder) — the quick workflow rules an agent loads when touching `spec/tickets/`.
