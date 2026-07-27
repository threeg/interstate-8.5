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
| INT8-E01 | Foundation & tooling (scaffolding) | 8 | done |
| INT8-E02 | Songs content model & migration | 9 | done |
| INT8-E03 | Theme foundation | 9 | done |
| INT8-E04 | Songs section (landing + song page) | 9 | done |

---

## `5.0.x-dev` slice 1 — execution order

Leaf tickets, in dependency order. Reading top to bottom is a legal build sequence; no ticket depends
on a higher-numbered one. Epics close when their children are all `done`.

| # | id | title | type | layer | M / batch | epic | kind | status | depends_on |
|---|----|-------|------|-------|-----------|------|------|--------|------------|
| 1 | INT8-001 | Initialise repo + DDEV environment | task | repo | 8 / scaffolding | E01 | code | done | — |
| 2 | INT8-002 | Install Drupal 11 (minimal) + config/sync | task | config | 8 / scaffolding | E01 | site-building | done | INT8-001 |
| 3 | INT8-003 | Essential contrib + Gin admin theme | task | config | 8 / scaffolding | E01 | site-building | done | INT8-002 |
| 4 | INT8-004 | Mount the v2 MySQL dump as a migration source | task | tooling | 8 / scaffolding | E01 | code | done | INT8-002 |
| 5 | INT8-005 | Owned theme from starterkit + Tailwind v4 + tokens.css | task | theme | 8 / scaffolding | E01 | code | done | INT8-002 |
| 6 | INT8-006 | Test tooling + the default gate | task | tooling | 8 / scaffolding | E01 | code | done | INT8-002, INT8-005 |
| 7 | INT8-007 | Fill in `sfk-verify` for the stack | task | docs | 8 / scaffolding | E01 | code | done | INT8-006 |
| 8 | INT8-008 | Song type taxonomy (vocabulary + terms) | task | content-model | 9 / content-model | E02 | site-building | done | INT8-003 |
| 9 | INT8-009 | Remote-video media type + Restricted HTML format | task | content-model | 9 / content-model | E02 | site-building | done | INT8-003 |
| 10 | INT8-010 | Song content type + fields | task | content-model | 9 / content-model | E02 | site-building | done | INT8-008, INT8-009 |
| 11 | INT8-011 | Pathauto pattern for songs | task | config | 9 / config | E02 | site-building | done | INT8-010 |
| 12 | INT8-022 | Broaden the dependency-rule boundary check to the full architecture rule | task | tooling | 9 / cleanup | — | code | done | INT8-006 |
| 13 | INT8-012 | Song type migration (`I8_SongType` → terms) | task | migration | 9 / migration | E02 | code | done | INT8-004, INT8-008 |
| 14 | INT8-013 | Songs migration (`I8_Songs` → nodes) | task | migration | 9 / migration | E02 | code | done | INT8-010, INT8-011, INT8-012 |
| 15 | INT8-014 | Migration verification | task | migration | 9 / migration | E02 | code | done | INT8-013 |
| 16 | INT8-015 | Base layout + header + footer (SDC) | task | theme | 9 / theme | E03 | code | done | INT8-005 |
| 17 | INT8-016 | Shared atoms / molecules | task | theme | 9 / theme | E03 | code | done | INT8-005 |
| 18 | INT8-017 | Primary nav + front-page/route wiring | task | theme | 9 / theme | E03 | code + site-building | done | INT8-015 |
| 19 | INT8-027 | Header nav hover/focus states, slogan visibility, mobile-menu styling (design-sync corrections) | task | theme | 9 / theme | E03 | code | done | INT8-015 |
| 20 | INT8-018 | Songs landing (View + filters + ledger) | story | theme | 9 / theme | E04 | code + site-building | done | INT8-013, INT8-015, INT8-016 |
| 21 | INT8-019 | Song page (view mode + Twig + video) | story | theme | 9 / theme | E04 | code | done | INT8-013, INT8-015, INT8-016 |
| 22 | INT8-020 | Song versions (side-by-side lyrics + links) | story | theme | 9 / theme | E04 | code | done | INT8-019 |
| 23 | INT8-021 | E2E capstone (Playwright + Axe) | task | tooling | 9 / theme | E04 | code | done | INT8-018, INT8-019, INT8-020 |
| 24 | INT8-028 | Page-title hero block in a full-width page-header region (random media background) | story | theme | 9 / theme | E03 | code + site-building | done | INT8-015, INT8-016, INT8-018 |
| 25 | INT8-029 | Bucket the song ledger's letter rail and groups, with a `#` catch-all | task | theme | 9 / theme | E04 | code | done | INT8-018 |
| 26 | INT8-030 | Make the song ledger's letter rail a real jump-to-letter navigation | task | theme | 9 / theme | E04 | code | done | INT8-029 |
| 27 | INT8-031 | Keep the primary nav's current-section marking across the whole Songs section | task | theme | 9 / theme | E03 | code | done | INT8-017, INT8-018 |
| 28 | INT8-036 | Restore Firefox coverage in the Playwright suite (stale profile-lock symlink) and correct the record | task | tooling | 9 / cleanup | — | code | todo | INT8-006, INT8-021 |

> **Frontend independence (CONVENTIONS §4.5):** the theme foundation (E03, 015–017) builds against the
> design/contract in parallel with the content model + migration (E02, 008–014); the Songs-section
> screens (018–020) depend on **both**, and INT8-021 is the e2e reconcile.

> **INT8-027** was slotted into the main sequence (row 19, after INT8-017) rather than the cleanup
> backlog — it corrects already-shipped INT8-015 output against a 2026-07-21 design-export refresh, and
> genuinely implements FR-16/NFR-1 more correctly rather than improving internal quality of unchanged
> behaviour (CONVENTIONS §6.6 excludes real spec-gap fixes from the cleanup category). Placed before
> INT8-018/019 so the Songs screens render the corrected header/nav from the start.

> **INT8-028 and INT8-029** both came out of the INT8-018 review and are placed in the main sequence,
> not the cleanup backlog. **INT8-028** is genuine new capability (a new theme region plus a real block
> plugin, replacing hero markup embedded in a page template), which CONVENTIONS §6.6 excludes from the
> cleanup category outright. **INT8-029** corrects already-shipped INT8-018 output, but it changes the
> FR-8 ordering expression itself and adds the ledger's missing non-letter bucket — implementing the
> requirement *more correctly* rather than improving internal quality of unchanged behaviour, exactly
> the reasoning that placed INT8-027 here.

> **INT8-030** is in the main sequence too, despite `implements: []`. It is genuine new capability —
> the letter rail becomes real, keyboard-operable in-page navigation, which no `FR` asks for and
> `design-system.md` §3 does not document — and CONVENTIONS §6.6 reserves the cleanup backlog for
> internal-quality improvements to already-shipped behaviour, not new capability (the same reasoning as
> INT8-028, which is likewise new capability rather than a requirement fix). It was triaged out of
> INT8-029 during the INT8-018 review and is stated as out of scope in INT8-029's own body.

> **INT8-031** is in the main sequence, not the cleanup backlog, on the same reasoning as INT8-027 and
> INT8-029: it corrects already-shipped INT8-017 output, but it implements FR-16/NFR-1 *more correctly*
> (the nav's current-section state is lost whenever the Songs filters put query parameters in the URL)
> rather than improving the internal quality of behaviour that is already right — which CONVENTIONS §6.6
> reserves the cleanup backlog for. Raised by the site owner during manual QA of INT8-028.

> **Sequencing — INT8-028 before INT8-019, despite the ids.** INT8-019 (Song page) needs the same
> hero-per-route mechanism INT8-028 introduces. Ids are permanent and allocated in execution order, so
> INT8-019 cannot depend on INT8-028 (no forward edges, CONVENTIONS §4.3) and its `depends_on` is
> unchanged — but building INT8-028 first avoids INT8-019 writing a second hero mechanism that
> INT8-028 would delete. Noted in both ticket files.

---

## `5.0.x-dev` slice 1 — cleanup backlog

Reactive tickets from post-batch `sfk-verify` review (CONVENTIONS §6). Not on the critical path unless promoted.

> **This board is the whole queue.** Work that is known but **not yet specifiable** — where the design
> or product decision doesn't exist yet, so no honest ticket can be written — is parked in
> `spec/TODO.md` instead, each entry naming the decision still owed. It is a waiting room, not a second
> backlog: an entry gets deleted from there in the same commit that files its real ticket here.

| # | id | title | type | layer | batch | status | depends_on |
|---|----|-------|------|-------|-------|--------|------------|
| C2 | INT8-023 | Reconcile the INT8-001 record (and its BOARD title) from DDEV to Lando | task | docs | cleanup | todo | INT8-001 |
| C3 | INT8-024 | Pin lyrics/notes/quotes fields to the Restricted HTML format | task | content-model | cleanup | todo | INT8-010 |
| C4 | INT8-025 | Harden the migration count-parity check to verify FR-5 literally (published == active source) | task | migration | cleanup | todo | INT8-014 |
| C5 | INT8-026 | Hook the footer's secondary label row up to a real Drupal menu | task | theme | cleanup | todo | INT8-015 |
| C6 | INT8-032 | Reconcile the "Side Projects" song-type name across the spec, and pin the filter's case-sensitivity | task | docs | cleanup | todo | INT8-008, INT8-018 |
| C7 | INT8-033 | Drop the inert border-style clauses Tailwind's preflight makes vacuous in the Playwright suite | task | tooling | cleanup | todo | INT8-015, INT8-027 |
| C8 | INT8-034 | Correct the theme's starterkit provenance record and restore the menu active-trail template | task | theme | cleanup | todo | INT8-005, INT8-031 |
| C9 | INT8-035 | Move the theme's entity queries and loads into the services layer | task | services | cleanup | todo | INT8-018, INT8-020 |
| C10 | INT8-037 | Correct INT8-018's caching claim and decide whether the Songs landing's max-age 0 stands | task | config | cleanup | todo | INT8-018 |

> **INT8-022** was promoted into the main execution-order table above (row 12, before INT8-012) — its
> own DoD required it be worked before the first migration module landed.

> **INT8-036** was likewise raised by `sfk-verify` but placed in the **main sequence** (row 28), not
> here, per CONVENTIONS §6.5: it is a live **gate failure**, not an internal-quality improvement.
> `lando playwright` exits 1 — every Firefox test has failed since 2026-07-20 on a dangling profile-lock
> symlink — while root `CLAUDE.md` requires `lando test-all` green at milestone completion and NFR-8
> names Firefox among the supported browsers. Removing the stale symlink takes the suite from 436/545 to
> **545/545** with no application change, which is what confirmed this is tooling, not a defect in the
> shipped screens. It must be worked before Milestone 9 sign-off.

> **INT8-035** covers **two** call sites (INT8-018's and INT8-020's), not just the one that prompted it.
> INT8-020 followed the pattern INT8-018 had already established rather than inventing it, so fixing
> only the newer would leave the architecture rule half-enforced with the older, larger violation still
> in place. It also closes the blind spot that let both through: `check-boundary.sh` greps `use`
> statements between modules, so it structurally cannot see a dynamic `\Drupal::entityTypeManager()`
> call in a `.theme` file.

> **INT8-032 and INT8-033** were both surfaced by the *independent test author* while writing
> INT8-031's tests — a side-effect of the grader≠graded split worth noting: a model reading the spec
> without the implementer's assumptions found two drifts nobody had looked for. Both are cleanup
> backlog rather than main sequence because each improves the internal consistency of behaviour that
> is already shipped and already correct, changing nothing a user can see (CONVENTIONS §6.6) — the
> opposite of the reasoning that placed INT8-027/029/031 in the main sequence. Neither blocks anything.

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
| FR-8 | INT8-018, INT8-029 |
| FR-9 | INT8-008, INT8-018 |
| FR-10 | INT8-018 |
| FR-11 | INT8-018 |
| FR-12 | INT8-010, INT8-019 |
| FR-13 | INT8-020 |
| FR-14 | INT8-019 |
| FR-15 | INT8-019 |
| FR-16 | INT8-011, INT8-015, INT8-017, INT8-018, INT8-027 |
| FR-17 | INT8-009, INT8-019 |
| FR-18 | INT8-018 |
| FR-19 | INT8-018 |
| FR-20 | INT8-020 |
| FR-21 | INT8-009, INT8-013 |
| NFR-1 | INT8-015, INT8-018, INT8-019, INT8-020, INT8-021, INT8-027 |
| NFR-2 | INT8-015, INT8-021 |
| NFR-3 | INT8-014 |
| NFR-4 | *(deferred — pre-launch performance pass; no slice-1 ticket)* |
| NFR-5 | INT8-006 |
| NFR-6 | INT8-010 (+ the config-export-and-verify practice on every `[site-building]` ticket: 002, 003, 008, 009, 011, 017) |
| NFR-7 | INT8-006, INT8-021, INT8-036 |
| NFR-8 | INT8-021, INT8-036 |
