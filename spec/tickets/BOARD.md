# Interstate-8.5 — Ticket Board (Execution Order)

| | |
|---|---|
| **Document** | Topological index of all tickets |
| **Repository location** | `spec/tickets/BOARD.md` |
| **Source** | The ticket files in `spec/tickets/`; format per `TICKET-TEMPLATE.md`; system per `CONVENTIONS.md` |

This board is the single topological view of the implementation order. Implementation tickets are
listed by execution number (`INT8-NNN`); reading top to bottom is a legal build sequence because no
ticket depends on a higher-numbered one (CONVENTIONS.md §4.3). It is a *derived* view of the ticket
files' `depends_on` edges and is regenerated, never hand-edited for status (CONVENTIONS.md §5.4).
Epics are containers and sit outside the execution order.

> When there are multiple versions, order the version sections **latest first**, and follow each
> version's execution order with its own cleanup backlog. Shipped versions collapse into a
> **"Shipped — vX.Y.0"** section.

**Status legend:** `todo` · `in-progress` · `blocked` · `in-review` · `done`

---

## Capability epics

| id | title | milestone | status |
|----|-------|-----------|--------|
| INT8-E01 | <Epic title> | 9 | todo |
| INT8-E02 | <Epic title> | 9 | todo |

---

## <VERSION> — execution order (implementation milestone)

Leaf tickets, in dependency order. Reading top to bottom is a legal build sequence; no ticket depends
on a higher-numbered one. Epics close when their children are all `done`.

| # | id | title | type | layer | M / batch | epic | status | depends_on |
|---|----|-------|------|-------|-----------|------|--------|------------|
| 1 | INT8-001 | <Initialise repository> | task | repo | 8 / scaffolding | — | todo | — |
| 2 | INT8-002 | <Backend skeleton> | task | tooling | 8 / scaffolding | — | todo | INT8-001 |
| 3 | INT8-003 | <Frontend skeleton> | task | frontend | 8 / scaffolding | — | todo | INT8-001 |
| 4 | INT8-004 | <Test tooling + dependency-rule check> | task | tooling | 8 / scaffolding | — | todo | INT8-002 |
| 7 | INT8-007 | <Core constants> | task | core | 9 / core | INT8-E02 | todo | INT8-004 |
| 8 | INT8-008 | <Core logic module> | task | core | 9 / core | INT8-E02 | todo | INT8-007 |
| … | … | … | … | … | … | … | … | … |

<!-- Fill one row per ticket. Keep this in step with the ticket files: when a ticket's status
     changes, update its row in the same commit (CONVENTIONS.md §5.4). -->

---

## <VERSION> — cleanup backlog

Reactive tickets from post-batch review (CONVENTIONS.md §6). Not on the critical path unless promoted.

| # | id | title | type | layer | batch | status | depends_on |
|---|----|-------|------|-------|-------|--------|------------|
| — | — | (none yet) | — | — | cleanup | — | — |

---

## Traceability — requirements to tickets

Derived from each ticket's `implements` field. Every `FR`/`NFR` should appear against at least one
ticket.

| Requirement | Implemented by |
|-------------|----------------|
| FR-1 | INT8-008 |
| NFR-1 | INT8-038 |
