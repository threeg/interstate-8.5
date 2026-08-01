# <PROJECT> — Ticket Board (Execution Order)

| | |
|---|---|
| **Document** | Topological index of all tickets |
| **Repository location** | `spec/tickets/BOARD.md` |
| **Source** | The ticket files in `spec/tickets/`; format per `TICKET-TEMPLATE.md`; system per `CONVENTIONS.md` |

This board is the single topological view of the implementation order. Implementation tickets are
listed by execution number (`<PRJ>-NNN`); reading top to bottom is a legal build sequence because no
ticket depends on a higher-numbered one (CONVENTIONS.md §4.3). It is a *derived* view of the ticket
files' `depends_on` and `before` edges and is regenerated, never hand-edited for status
(CONVENTIONS.md §5.4). Epics are containers and sit outside the execution order.

**Top-to-bottom order is authoritative; id order is not.** A **promoted** row (§6.5) sits deliberately
out of id sequence, and its `flag` cell says so. Never re-sort this table by id — that silently
reverses a real constraint. The `before:` field in the ticket file is what makes the constraint
recoverable if it happens.

> When there are multiple versions, order the version sections **latest first**, and follow each
> version's execution order with its own cleanup backlog. Shipped versions collapse into a
> **"Shipped — vX.Y.0"** section.

**Status legend:** ⬜ `todo` · 🔶 `in-progress` · ⛔ `blocked` · 👀 `in-review` · ✅ `done`

> Write **both** — `✅ done`, never `✅` alone. **The text token is the value; the icon is decoration**
> (CONVENTIONS.md §5.4). Status is `grep`-ed by `spec/verify/verify.md` and by hand, and a sweep that
> matches nothing is indistinguishable from a sweep that found nothing wrong. ⬜ / 🔶 / ✅ are the same
> icons `spec/milestone-plan.md` uses, so there is one vocabulary to learn.

**Flag legend:** `🔺 before <id>` — **promoted**: this would fail a gate, so it is slotted ahead of the
ticket named (CONVENTIONS.md §6.5), mirroring the ticket's own `before:` field. `before <id>` without the
🔺 is any other out-of-sequence constraint (§4.6). Otherwise **blank** — which is nearly every row.

> **A flag most rows carry is not a flag.** This column holds only facts the ordering cannot express by
> itself. It is not a priority scale: priority would duplicate what row order and `depends_on` already
> say, and — unlike promotion, which is a definition (*would this fail a gate?*) — it would have no owner
> to keep it true. "Cannot start until a decision is made" is `⛔ blocked`, not a flag.
>
> **Row position is not a record.** A promoted ticket's row sits out of id order, and nothing about the
> row itself says so; any re-sort drops the constraint silently. The `before:` field is the durable half
> and this column is its visible mirror — `sfk-verify` checks that the two still agree.

---

## Capability epics

| id | title | milestone | status |
|----|-------|-----------|--------|
| <PRJ>-E01 | <Epic title> | 9 | ⬜ todo |
| <PRJ>-E02 | <Epic title> | 9 | ⬜ todo |

---

## <VERSION> — execution order (implementation milestone)

Leaf tickets, in dependency order. Reading top to bottom is a legal build sequence; no ticket depends
on a higher-numbered one. Epics close when their children are all `done`.

| # | id | title | type | layer | M / batch | epic | flag | status | depends_on |
|---|----|-------|------|-------|-----------|------|------|--------|------------|
| 1 | [<PRJ>-001](<PRJ>-001-initialise-repository.md) | <Initialise repository> | task | repo | 8 / scaffolding | — | | ⬜ todo | — |
| 2 | [<PRJ>-002](<PRJ>-002-backend-skeleton.md) | <Backend skeleton> | task | tooling | 8 / scaffolding | — | | ⬜ todo | [<PRJ>-001](<PRJ>-001-initialise-repository.md) |
| 3 | [<PRJ>-003](<PRJ>-003-frontend-skeleton.md) | <Frontend skeleton> | task | frontend | 8 / scaffolding | — | | ⬜ todo | [<PRJ>-001](<PRJ>-001-initialise-repository.md) |
| 4 | <PRJ>-004 | <Test tooling + dependency-rule check> | task | tooling | 8 / scaffolding | — | | ⬜ todo | <PRJ>-002 |
| 7 | <PRJ>-007 | <Core constants> | task | core | 9 / core | <PRJ>-E02 | | ⬜ todo | <PRJ>-004 |
| 8 | <PRJ>-008 | <Core logic module> | task | core | 9 / core | <PRJ>-E02 | | ⬜ todo | <PRJ>-007 |
| 9 | [<PRJ>-091](<PRJ>-091-fix-slow-query.md) | <Promoted cleanup: fix slow query> | task | storage | 9 / cleanup | — | 🔺 before [<PRJ>-012](<PRJ>-012-report-endpoint.md) | ⬜ todo | <PRJ>-008 |
| … | … | … | … | … | … | … | … | … | … |

<!-- Fill one row per ticket. Keep this in step with the ticket files: when a ticket's status
     changes, update its row in the same commit (CONVENTIONS.md §5.4).

     LINK EVERY ID — id column, depends_on cells, epic tables, traceability, prose:
       [<PRJ>-036](<PRJ>-036-<slug>.md)
     Decoration wraps INSIDE the link:  [`<PRJ>-036`](…)   NOT  `[<PRJ>-036](…)`
     The second puts link syntax inside a code span and renders as literal brackets.
     The first three rows above are linked as the worked example; the rest are elided for brevity. -->

---

## <VERSION> — cleanup backlog

Reactive tickets from post-batch review (CONVENTIONS.md §6). Not on the critical path unless promoted.

| # | id | title | type | layer | batch | flag | status | depends_on |
|---|----|-------|------|-------|-------|------|--------|------------|
| — | — | (none yet) | — | — | cleanup | | — | — |

---

## Traceability — requirements to tickets

Derived from each ticket's `implements` field. Every `FR`/`NFR` should appear against at least one
ticket.

| Requirement | Implemented by |
|-------------|----------------|
| FR-1 | <PRJ>-008 |
| NFR-1 | <PRJ>-038 |
