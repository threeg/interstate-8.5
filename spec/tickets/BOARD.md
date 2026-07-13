# Interstate-8.5 — Ticket Board (Execution Order)

| | |
|---|---|
| **Document** | Topological index of all tickets |
| **Repository location** | `spec/tickets/BOARD.md` |
| **Source** | The ticket files in `spec/tickets/`; format per `TICKET-TEMPLATE.md`; system per `CONVENTIONS.md` |

This board is the single topological view of the implementation order. Implementation tickets are
listed by execution number (`INT8-NNN`); reading top to bottom is a legal build sequence because no
ticket depends on a higher-numbered one (CONVENTIONS.md §4.3). It is a *derived* view of the ticket
files' `depends_on` edges and is regenerated, never hand-edited for status. Epics are containers and
sit outside the execution order.

**Status legend:** `todo` · `in-progress` · `blocked` · `in-review` · `done`

**Kind:** `[site-building]` = operator builds in the Drupal UI + exports config, Claude verifies against
spec (no hand-authored config YAML); everything else is code.

---

## Capability epics

| id | title | milestone | status |
|----|-------|-----------|--------|
| INT8-E01 | Foundation & tooling (scaffolding) | 8 | todo |
| INT8-E02 | Songs content model & migration | 9 | todo |
| INT8-E03 | Theme foundation | 9 | todo |
| INT8-E04 | Songs section (landing + song page) | 9 | todo |

---

## `5.0.x-dev` slice 1 — execution order

Leaf tickets, in dependency order. Reading top to bottom is a legal build sequence; no ticket depends
on a higher-numbered one. Epics close when their children are all `done`.

| # | id | title | type | layer | M / batch | epic | kind | status | depends_on |
|---|----|-------|------|-------|-----------|------|------|--------|------------|
| 1 | INT8-001 | Initialise repo + DDEV environment | task | repo | 8 / scaffolding | E01 | code | done | — |
| 2 | INT8-002 | Install Drupal 11 (minimal) + config/sync | task | config | 8 / scaffolding | E01 | site-building | todo | INT8-001 |
| 3 | INT8-003 | Essential contrib + Gin admin theme | task | config | 8 / scaffolding | E01 | site-building | todo | INT8-002 |
| 4 | INT8-004 | Mount the v2 MySQL dump as a migration source | task | tooling | 8 / scaffolding | E01 | code | todo | INT8-002 |
| 5 | INT8-005 | Owned theme from starterkit + Tailwind v4 + tokens.css | task | theme | 8 / scaffolding | E01 | code | todo | INT8-002 |
| 6 | INT8-006 | Test tooling + the default gate | task | tooling | 8 / scaffolding | E01 | code | todo | INT8-002, INT8-005 |
| 7 | INT8-007 | Fill in `sfk-verify` for the stack | task | docs | 8 / scaffolding | E01 | code | todo | INT8-006 |
| 8 | INT8-008 | Song type taxonomy (vocabulary + terms) | task | content-model | 9 / content-model | E02 | site-building | todo | INT8-003 |
| 9 | INT8-009 | Remote-video media type + Restricted HTML format | task | content-model | 9 / content-model | E02 | site-building | todo | INT8-003 |
| 10 | INT8-010 | Song content type + fields | task | content-model | 9 / content-model | E02 | site-building | todo | INT8-008, INT8-009 |
| 11 | INT8-011 | Pathauto pattern for songs | task | config | 9 / config | E02 | site-building | todo | INT8-010 |
| 12 | INT8-012 | Song type migration (`I8_SongType` → terms) | task | migration | 9 / migration | E02 | code | todo | INT8-004, INT8-008 |
| 13 | INT8-013 | Songs migration (`I8_Songs` → nodes) | task | migration | 9 / migration | E02 | code | todo | INT8-010, INT8-011, INT8-012 |
| 14 | INT8-014 | Migration verification | task | migration | 9 / migration | E02 | code | todo | INT8-013 |
| 15 | INT8-015 | Base layout + header + footer (SDC) | task | theme | 9 / theme | E03 | code | todo | INT8-005 |
| 16 | INT8-016 | Shared atoms / molecules | task | theme | 9 / theme | E03 | code | todo | INT8-005 |
| 17 | INT8-017 | Primary nav + front-page/route wiring | task | theme | 9 / theme | E03 | code + site-building | todo | INT8-015 |
| 18 | INT8-018 | Songs landing (View + filters + ledger) | story | theme | 9 / theme | E04 | code + site-building | todo | INT8-013, INT8-015, INT8-016 |
| 19 | INT8-019 | Song page (view mode + Twig + video) | story | theme | 9 / theme | E04 | code | todo | INT8-013, INT8-015, INT8-016 |
| 20 | INT8-020 | Song versions (side-by-side lyrics + links) | story | theme | 9 / theme | E04 | code | todo | INT8-019 |
| 21 | INT8-021 | E2E capstone (Playwright + Axe) | task | tooling | 9 / theme | E04 | code | todo | INT8-018, INT8-019, INT8-020 |

> **Frontend independence (CONVENTIONS §4.5):** the theme foundation (E03, 015–017) builds against the
> design/contract in parallel with the content model + migration (E02, 008–014); the Songs-section
> screens (018–020) depend on **both**, and INT8-021 is the e2e reconcile.

---

## `5.0.x-dev` slice 1 — cleanup backlog

Reactive tickets from post-batch `sfk-verify` review (CONVENTIONS §6). Not on the critical path unless promoted.

| # | id | title | type | layer | batch | status | depends_on |
|---|----|-------|------|-------|-------|--------|------------|
| — | — | (none yet) | — | — | cleanup | — | — |

---

## Traceability — requirements to tickets

Derived from each ticket's `implements` field. Every `FR`/`NFR` appears against at least one ticket
(NFR-4 is deliberately deferred — pre-launch performance pass).

| Requirement | Implemented by |
|-------------|----------------|
| FR-1 | INT8-012, INT8-013 |
| FR-2 | INT8-010, INT8-013 |
| FR-3 | INT8-010, INT8-013 |
| FR-4 | INT8-013 |
| FR-5 | INT8-014 |
| FR-6 | INT8-018 |
| FR-7 | INT8-018 |
| FR-8 | INT8-018 |
| FR-9 | INT8-008, INT8-018 |
| FR-10 | INT8-018 |
| FR-11 | INT8-018 |
| FR-12 | INT8-010, INT8-019 |
| FR-13 | INT8-020 |
| FR-14 | INT8-019 |
| FR-15 | INT8-019 |
| FR-16 | INT8-011, INT8-015, INT8-017, INT8-018 |
| FR-17 | INT8-009, INT8-019 |
| FR-18 | INT8-018 |
| FR-19 | INT8-018 |
| FR-20 | INT8-020 |
| FR-21 | INT8-009, INT8-013 |
| NFR-1 | INT8-015, INT8-018, INT8-019, INT8-020, INT8-021 |
| NFR-2 | INT8-015, INT8-021 |
| NFR-3 | INT8-014 |
| NFR-4 | *(deferred — pre-launch performance pass; no slice-1 ticket)* |
| NFR-5 | INT8-006 |
| NFR-6 | INT8-010 (+ the config-export-and-verify practice on every `[site-building]` ticket: 002, 003, 008, 009, 011, 017) |
| NFR-7 | INT8-006, INT8-021 |
| NFR-8 | INT8-021 |
