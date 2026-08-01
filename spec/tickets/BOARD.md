# Interstate-8.5 — Ticket Board (Execution Order)

| | |
|---|---|
| **Document** | Topological index of all tickets |
| **Repository location** | `spec/tickets/BOARD.md` |
| **Source** | The ticket files in `spec/tickets/`; format per `TICKET-TEMPLATE.md`; system per `CONVENTIONS.md` |

This board is the single topological view of the implementation order. Implementation tickets are
listed by execution number (`INT8-NNN`); reading top to bottom is a legal build sequence because no
ticket depends on a higher-numbered one (CONVENTIONS.md §4.3). It is a *derived* view of the ticket
files' `depends_on` and `before` edges and is regenerated, never hand-edited for status
(CONVENTIONS.md §5.4). Epics are containers and sit outside the execution order.

**Top-to-bottom order is authoritative; id order is not.** A **promoted** row (§6.5) sits deliberately
out of id sequence, and its `flag` cell says so. Never re-sort this table by id — that silently
reverses a real constraint. The `before:` field in the ticket file is what makes the constraint
recoverable if it happens.

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

**Kind:** `[site-building]` = operator builds in the Drupal UI + exports config, Claude verifies against
spec (no hand-authored config YAML); everything else is code.

---

## Capability epics

| id | title | milestone | status |
|----|-------|-----------|--------|
| [INT8-E01](INT8-E01-foundation-tooling.md) | Foundation & tooling (scaffolding) | 8 | ✅ done |
| [INT8-E02](INT8-E02-songs-content-model-migration.md) | Songs content model & migration | 9 | ✅ done |
| [INT8-E03](INT8-E03-theme-foundation.md) | Theme foundation | 9 | ✅ done |
| [INT8-E04](INT8-E04-songs-section.md) | Songs section (landing + song page) | 9 | ✅ done |

---

## `5.0.x-dev` slice 1 — execution order

Leaf tickets, in dependency order. Reading top to bottom is a legal build sequence; no ticket depends
on a higher-numbered one. Epics close when their children are all `done`.

| # | id | title | type | layer | M / batch | epic | kind | flag | status | depends_on |
|---|----|-------|------|-------|-----------|------|------|------|--------|------------|
| 1 | [INT8-001](INT8-001-init-repo-ddev.md) | Initialise repo + Lando environment | task | repo | 8 / scaffolding | E01 | code | | ✅ done | — |
| 2 | [INT8-002](INT8-002-install-drupal.md) | Install Drupal 11 (minimal) + config/sync | task | config | 8 / scaffolding | E01 | site-building | | ✅ done | [INT8-001](INT8-001-init-repo-ddev.md) |
| 3 | [INT8-003](INT8-003-contrib-admin-theme.md) | Essential contrib + Gin admin theme | task | config | 8 / scaffolding | E01 | site-building | | ✅ done | [INT8-002](INT8-002-install-drupal.md) |
| 4 | [INT8-004](INT8-004-mount-v2-db.md) | Mount the v2 MySQL dump as a migration source | task | tooling | 8 / scaffolding | E01 | code | | ✅ done | [INT8-002](INT8-002-install-drupal.md) |
| 5 | [INT8-005](INT8-005-theme-starterkit-tailwind.md) | Owned theme from starterkit + Tailwind v4 + tokens.css | task | theme | 8 / scaffolding | E01 | code | | ✅ done | [INT8-002](INT8-002-install-drupal.md) |
| 6 | [INT8-006](INT8-006-test-tooling-gate.md) | Test tooling + the default gate | task | tooling | 8 / scaffolding | E01 | code | | ✅ done | [INT8-002](INT8-002-install-drupal.md), [INT8-005](INT8-005-theme-starterkit-tailwind.md) |
| 7 | [INT8-007](INT8-007-fill-sfk-verify.md) | Fill in `sfk-verify` for the stack | task | docs | 8 / scaffolding | E01 | code | | ✅ done | [INT8-006](INT8-006-test-tooling-gate.md) |
| 8 | [INT8-008](INT8-008-song-type-taxonomy.md) | Song type taxonomy (vocabulary + terms) | task | content-model | 9 / content-model | E02 | site-building | | ✅ done | [INT8-003](INT8-003-contrib-admin-theme.md) |
| 9 | [INT8-009](INT8-009-media-textformat.md) | Remote-video media type + Restricted HTML format | task | content-model | 9 / content-model | E02 | site-building | | ✅ done | [INT8-003](INT8-003-contrib-admin-theme.md) |
| 10 | [INT8-010](INT8-010-song-content-type.md) | Song content type + fields | task | content-model | 9 / content-model | E02 | site-building | | ✅ done | [INT8-008](INT8-008-song-type-taxonomy.md), [INT8-009](INT8-009-media-textformat.md) |
| 11 | [INT8-011](INT8-011-pathauto-songs.md) | Pathauto pattern for songs | task | config | 9 / config | E02 | site-building | | ✅ done | [INT8-010](INT8-010-song-content-type.md) |
| 12 | [INT8-022](INT8-022-broaden-boundary-check.md) | Broaden the dependency-rule boundary check to the full architecture rule | task | tooling | 9 / cleanup | — | code | 🔺 before [INT8-012](INT8-012-song-type-migration.md) | ✅ done | [INT8-006](INT8-006-test-tooling-gate.md) |
| 13 | [INT8-012](INT8-012-song-type-migration.md) | Song type migration (`I8_SongType` → terms) | task | migration | 9 / migration | E02 | code | | ✅ done | [INT8-004](INT8-004-mount-v2-db.md), [INT8-008](INT8-008-song-type-taxonomy.md) |
| 14 | [INT8-013](INT8-013-songs-migration.md) | Songs migration (`I8_Songs` → nodes) | task | migration | 9 / migration | E02 | code | | ✅ done | [INT8-010](INT8-010-song-content-type.md), [INT8-011](INT8-011-pathauto-songs.md), [INT8-012](INT8-012-song-type-migration.md) |
| 15 | [INT8-014](INT8-014-migration-verification.md) | Migration verification | task | migration | 9 / migration | E02 | code | | ✅ done | [INT8-013](INT8-013-songs-migration.md) |
| 16 | [INT8-015](INT8-015-header-footer.md) | Base layout + header + footer (SDC) | task | theme | 9 / theme | E03 | code | | ✅ done | [INT8-005](INT8-005-theme-starterkit-tailwind.md) |
| 17 | [INT8-016](INT8-016-shared-atoms-molecules.md) | Shared atoms / molecules | task | theme | 9 / theme | E03 | code | | ✅ done | [INT8-005](INT8-005-theme-starterkit-tailwind.md) |
| 18 | [INT8-017](INT8-017-nav-frontpage.md) | Primary nav + front-page/route wiring | task | theme | 9 / theme | E03 | code + site-building | | ✅ done | [INT8-015](INT8-015-header-footer.md) |
| 19 | [INT8-027](INT8-027-header-nav-states-slogan.md) | Header nav hover/focus states, slogan visibility, mobile-menu styling (design-sync corrections) | task | theme | 9 / theme | E03 | code | | ✅ done | [INT8-015](INT8-015-header-footer.md) |
| 20 | [INT8-018](INT8-018-songs-landing.md) | Songs landing (View + filters + ledger) | story | theme | 9 / theme | E04 | code + site-building | | ✅ done | [INT8-013](INT8-013-songs-migration.md), [INT8-015](INT8-015-header-footer.md), [INT8-016](INT8-016-shared-atoms-molecules.md) |
| 21 | [INT8-028](INT8-028-hero-page-header-block.md) | Page-title hero block in a full-width page-header region (random media background) | story | theme | 9 / theme | E03 | code + site-building | before [INT8-019](INT8-019-song-page.md) | ✅ done | [INT8-015](INT8-015-header-footer.md), [INT8-016](INT8-016-shared-atoms-molecules.md), [INT8-018](INT8-018-songs-landing.md) |
| 22 | [INT8-019](INT8-019-song-page.md) | Song page (view mode + Twig + video) | story | theme | 9 / theme | E04 | code | | ✅ done | [INT8-013](INT8-013-songs-migration.md), [INT8-015](INT8-015-header-footer.md), [INT8-016](INT8-016-shared-atoms-molecules.md) |
| 23 | [INT8-020](INT8-020-song-versions.md) | Song versions (side-by-side lyrics + links) | story | theme | 9 / theme | E04 | code | | ✅ done | [INT8-019](INT8-019-song-page.md) |
| 24 | [INT8-021](INT8-021-e2e-capstone.md) | E2E capstone (Playwright + Axe) | task | tooling | 9 / theme | E04 | code | | ✅ done | [INT8-018](INT8-018-songs-landing.md), [INT8-019](INT8-019-song-page.md), [INT8-020](INT8-020-song-versions.md) |
| 25 | [INT8-029](INT8-029-ledger-letter-rail-grouping.md) | Bucket the song ledger's letter rail and groups, with a `#` catch-all | task | theme | 9 / theme | E04 | code | | ✅ done | [INT8-018](INT8-018-songs-landing.md) |
| 26 | [INT8-030](INT8-030-clickable-letter-rail.md) | Make the song ledger's letter rail a real jump-to-letter navigation | task | theme | 9 / theme | E04 | code | | ✅ done | [INT8-029](INT8-029-ledger-letter-rail-grouping.md) |
| 27 | [INT8-031](INT8-031-nav-active-trail-query-params.md) | Keep the primary nav's current-section marking across the whole Songs section | task | theme | 9 / theme | E03 | code | | ✅ done | [INT8-017](INT8-017-nav-frontpage.md), [INT8-018](INT8-018-songs-landing.md) |
| 28 | [INT8-036](INT8-036-firefox-playwright-stale-lock.md) | Restore Firefox coverage in the Playwright suite (stale profile-lock symlink) and correct the record | task | tooling | 9 / cleanup | — | code | | ✅ done | [INT8-006](INT8-006-test-tooling-gate.md), [INT8-021](INT8-021-e2e-capstone.md) |

> **Frontend independence (CONVENTIONS §4.5):** the theme foundation (E03, 015–017) builds against the
> design/contract in parallel with the content model + migration (E02, 008–014); the Songs-section
> screens (018–020) depend on **both**, and [INT8-021](INT8-021-e2e-capstone.md) is the e2e reconcile.

> [**INT8-027**](INT8-027-header-nav-states-slogan.md) was slotted into the main sequence (row 19, after [INT8-017](INT8-017-nav-frontpage.md)) rather than the cleanup
> backlog — it corrects already-shipped [INT8-015](INT8-015-header-footer.md) output against a 2026-07-21 design-export refresh, and
> genuinely implements FR-16/NFR-1 more correctly rather than improving internal quality of unchanged
> behaviour (CONVENTIONS §6.6 excludes real spec-gap fixes from the cleanup category). Placed before
> [INT8-018](INT8-018-songs-landing.md)/019 so the Songs screens render the corrected header/nav from the start.

> **[INT8-028](INT8-028-hero-page-header-block.md) and [INT8-029](INT8-029-ledger-letter-rail-grouping.md)** both came out of the [INT8-018](INT8-018-songs-landing.md) review and are placed in the main sequence,
> not the cleanup backlog. [**INT8-028**](INT8-028-hero-page-header-block.md) is genuine new capability (a new theme region plus a real block
> plugin, replacing hero markup embedded in a page template), which CONVENTIONS §6.6 excludes from the
> cleanup category outright. [**INT8-029**](INT8-029-ledger-letter-rail-grouping.md) corrects already-shipped [INT8-018](INT8-018-songs-landing.md) output, but it changes the
> FR-8 ordering expression itself and adds the ledger's missing non-letter bucket — implementing the
> requirement *more correctly* rather than improving internal quality of unchanged behaviour, exactly
> the reasoning that placed [INT8-027](INT8-027-header-nav-states-slogan.md) here.

> [**INT8-030**](INT8-030-clickable-letter-rail.md) is in the main sequence too, despite `implements: []`. It is genuine new capability —
> the letter rail becomes real, keyboard-operable in-page navigation, which no `FR` asks for and
> `design-system.md` §3 does not document — and CONVENTIONS §6.6 reserves the cleanup backlog for
> internal-quality improvements to already-shipped behaviour, not new capability (the same reasoning as
> [INT8-028](INT8-028-hero-page-header-block.md), which is likewise new capability rather than a requirement fix). It was triaged out of
> [INT8-029](INT8-029-ledger-letter-rail-grouping.md) during the [INT8-018](INT8-018-songs-landing.md) review and is stated as out of scope in [INT8-029](INT8-029-ledger-letter-rail-grouping.md)'s own body.

> [**INT8-031**](INT8-031-nav-active-trail-query-params.md) is in the main sequence, not the cleanup backlog, on the same reasoning as [INT8-027](INT8-027-header-nav-states-slogan.md) and
> [INT8-029](INT8-029-ledger-letter-rail-grouping.md): it corrects already-shipped [INT8-017](INT8-017-nav-frontpage.md) output, but it implements FR-16/NFR-1 *more correctly*
> (the nav's current-section state is lost whenever the Songs filters put query parameters in the URL)
> rather than improving the internal quality of behaviour that is already right — which CONVENTIONS §6.6
> reserves the cleanup backlog for. Raised by the site owner during manual QA of [INT8-028](INT8-028-hero-page-header-block.md).

> **Sequencing — [INT8-028](INT8-028-hero-page-header-block.md) before [INT8-019](INT8-019-song-page.md), despite the ids.** [INT8-019](INT8-019-song-page.md) (Song page) needs the same
> hero-per-route mechanism [INT8-028](INT8-028-hero-page-header-block.md) introduces. Ids are permanent and allocated in execution order, so
> [INT8-019](INT8-019-song-page.md) cannot depend on [INT8-028](INT8-028-hero-page-header-block.md) (no forward edges, CONVENTIONS §4.3) and its `depends_on` is
> unchanged — but building [INT8-028](INT8-028-hero-page-header-block.md) first avoids [INT8-019](INT8-019-song-page.md) writing a second hero mechanism that
> [INT8-028](INT8-028-hero-page-header-block.md) would delete. Noted in both ticket files.
>
> This is now recorded as **data**, not only prose: `before: [INT8-019]` on [INT8-028](INT8-028-hero-page-header-block.md) (CONVENTIONS §4.6),
> its `flag` cell, and its row moved above [INT8-019](INT8-019-song-page.md)'s — which is what the build actually did ([INT8-028](INT8-028-hero-page-header-block.md)
> finalized 2026-07-26, [INT8-019](INT8-019-song-page.md) started after it). Until the v1.4.3 kit update the row sat *below*
> [INT8-019](INT8-019-song-page.md) at position 24, so the board's own ordering contradicted this paragraph and nothing could
> detect it. No 🔺: the constraint avoids rework, it is not a gate failure (§6.5).

---

## `5.0.x-dev` slice 1 — cleanup backlog

Reactive tickets from post-batch `sfk-verify` review (CONVENTIONS §6). Not on the critical path unless promoted.

> **This board is the whole queue.** Work that is known but **not yet specifiable** — where the design
> or product decision doesn't exist yet, so no honest ticket can be written — is parked in
> `spec/TODO.md` instead, each entry naming the decision still owed. It is a waiting room, not a second
> backlog: an entry gets deleted from there in the same commit that files its real ticket here.

| # | id | title | type | layer | batch | flag | status | depends_on |
|---|----|-------|------|-------|-------|------|--------|------------|
| C2 | [INT8-023](INT8-023-reconcile-int8-001-lando.md) | Reconcile the [INT8-001](INT8-001-init-repo-ddev.md) record (and its BOARD title) from DDEV to Lando | task | docs | cleanup | | ✅ done | [INT8-001](INT8-001-init-repo-ddev.md) |
| C3 | [INT8-024](INT8-024-pin-restricted-html-format.md) | Pin lyrics/notes/quotes fields to the Restricted HTML format | task | content-model | cleanup | | ✅ done | [INT8-010](INT8-010-song-content-type.md) |
| C4 | [INT8-025](INT8-025-harden-migration-count-check.md) | Harden the migration count-parity check to verify FR-5 literally (published == active source) | task | migration | cleanup | | ✅ done | [INT8-014](INT8-014-migration-verification.md) |
| C5 | [INT8-026](INT8-026-footer-menu.md) | Hook the footer's secondary label row up to a real Drupal menu | task | theme | cleanup | | ✅ done | [INT8-015](INT8-015-header-footer.md) |
| C6 | [INT8-032](INT8-032-song-type-name-drift.md) | Reconcile the "Side Projects" song-type name across the spec, and pin the filter's case-sensitivity | task | docs | cleanup | | ✅ done | [INT8-008](INT8-008-song-type-taxonomy.md), [INT8-018](INT8-018-songs-landing.md) |
| C7 | [INT8-033](INT8-033-tailwind-preflight-border-assertions.md) | Drop the inert border-style clauses Tailwind's preflight makes vacuous in the Playwright suite | task | tooling | cleanup | | ✅ done | [INT8-015](INT8-015-header-footer.md), [INT8-027](INT8-027-header-nav-states-slogan.md) |
| C8 | [INT8-034](INT8-034-theme-starterkit-provenance.md) | Correct the theme's starterkit provenance record and restore the menu active-trail template | task | theme | cleanup | | ✅ done | [INT8-005](INT8-005-theme-starterkit-tailwind.md), [INT8-031](INT8-031-nav-active-trail-query-params.md) |
| C9 | [INT8-035](INT8-035-move-entity-queries-out-of-the-theme.md) | Move the theme's entity queries and loads into the services layer | task | services | cleanup | | ✅ done | [INT8-018](INT8-018-songs-landing.md), [INT8-020](INT8-020-song-versions.md) |
| C10 | [INT8-037](INT8-037-songs-landing-dynamic-cache.md) | Correct [INT8-018](INT8-018-songs-landing.md)'s caching claim and decide whether the Songs landing's max-age 0 stands | task | config | cleanup | | ✅ done | [INT8-018](INT8-018-songs-landing.md) |
| C11 | [INT8-038](INT8-038-ledger-sort-key-accent-folding.md) | Fold accents in the ledger's sort key so one letter cannot split into two groups | task | services | cleanup | | 👀 in-review | [INT8-029](INT8-029-ledger-letter-rail-grouping.md), [INT8-030](INT8-030-clickable-letter-rail.md) |
| C12 | [INT8-039](INT8-039-i8-services-module-dependencies.md) | Declare `i8_services`' module dependencies and correct its stale description | task | services | cleanup | | ⬜ todo | [INT8-017](INT8-017-nav-frontpage.md), [INT8-035](INT8-035-move-entity-queries-out-of-the-theme.md) |
| C13 | [INT8-040](INT8-040-redirect-path-map-deferral-drift.md) | Qualify the v2→v5 redirect path-map claim in `api-contract.md` and `architecture.md` §6 | task | docs | cleanup | | ⬜ todo | [INT8-011](INT8-011-pathauto-songs.md) |
| C14 | [INT8-041](INT8-041-type-filter-published-terms.md) | Scope the Songs landing's Type-filter term lookup to published terms | task | services | cleanup | | ⬜ todo | [INT8-018](INT8-018-songs-landing.md), [INT8-035](INT8-035-move-entity-queries-out-of-the-theme.md) |
| C15 | [INT8-042](INT8-042-fast-lint-only-gate.md) | Add a fast lint-only check alongside the default gate | task | tooling | cleanup | | ⬜ todo | [INT8-006](INT8-006-test-tooling-gate.md) |

> [**INT8-022**](INT8-022-broaden-boundary-check.md) was promoted into the main execution-order table above (row 12, before [INT8-012](INT8-012-song-type-migration.md)) — its
> own DoD required it be worked before the first migration module landed. Recorded three ways per
> CONVENTIONS §6.5: `before: [INT8-012]` in its frontmatter, the row move, and the `🔺 before INT8-012`
> flag.

> [**INT8-036**](INT8-036-firefox-playwright-stale-lock.md) was likewise raised by `sfk-verify` but placed in the **main sequence** (row 28), not
> here, per CONVENTIONS §6.5: it is a live **gate failure**, not an internal-quality improvement.
> `lando playwright` exits 1 — every Firefox test has failed since 2026-07-20 on a dangling profile-lock
> symlink — while root `CLAUDE.md` requires `lando test-all` green at milestone completion and NFR-8
> names Firefox among the supported browsers. Removing the stale symlink takes the suite from 436/545 to
> **545/545** with no application change, which is what confirmed this is tooling, not a defect in the
> shipped screens. It must be worked before Milestone 9 sign-off.

> [**INT8-035**](INT8-035-move-entity-queries-out-of-the-theme.md) covers **two** call sites ([INT8-018](INT8-018-songs-landing.md)'s and [INT8-020](INT8-020-song-versions.md)'s), not just the one that prompted it.
> [INT8-020](INT8-020-song-versions.md) followed the pattern [INT8-018](INT8-018-songs-landing.md) had already established rather than inventing it, so fixing
> only the newer would leave the architecture rule half-enforced with the older, larger violation still
> in place. It also closes the blind spot that let both through: `check-boundary.sh` greps `use`
> statements between modules, so it structurally cannot see a dynamic `\Drupal::entityTypeManager()`
> call in a `.theme` file.

> **[INT8-032](INT8-032-song-type-name-drift.md) and [INT8-033](INT8-033-tailwind-preflight-border-assertions.md)** were both surfaced by the *independent test author* while writing
> [INT8-031](INT8-031-nav-active-trail-query-params.md)'s tests — a side-effect of the grader≠graded split worth noting: a model reading the spec
> without the implementer's assumptions found two drifts nobody had looked for. Both are cleanup
> backlog rather than main sequence because each improves the internal consistency of behaviour that
> is already shipped and already correct, changing nothing a user can see (CONVENTIONS §6.6) — the
> opposite of the reasoning that placed [INT8-027](INT8-027-header-nav-states-slogan.md)/029/031 in the main sequence. Neither blocks anything.

> **[INT8-038](INT8-038-ledger-sort-key-accent-folding.md) through [INT8-041](INT8-041-type-filter-published-terms.md)** were filed by `sfk-verify` on the cleanup batch ([INT8-023](INT8-023-reconcile-int8-001-lando.md)–026,
> 032–037) with both gates green — `lando test` clean with zero warnings and `lando playwright`
> 565/565 across all five browsers. All four are cleanup backlog, not main sequence: each improves the
> internal correctness or consistency of behaviour that is already shipped and, on the data the site
> actually holds, already renders correctly (CONVENTIONS §6.6). [**INT8-038**](INT8-038-ledger-sort-key-accent-folding.md) and [**INT8-041**](INT8-041-type-filter-published-terms.md) are both
> *latent* defects — a bucket that splits only for a non-ASCII title (none of the 492 exist) and a
> filter option that misbehaves only for an unpublished song type (none of the four are) — so neither
> is a gate failure of the kind §6.5 promotes. [**INT8-040**](INT8-040-redirect-path-map-deferral-drift.md) is the same shape as [INT8-032](INT8-032-song-type-name-drift.md): one fact
> spelled two ways across the spec, with no decision reopened.

> **A fifth finding is deliberately *not* a ticket.** The site's own presentation depends on content
> entities that exist only in the development database — the main menu's Home and **Songs** links
> (`menu_link_content`, the concrete realisation of FR-16), [INT8-026](INT8-026-footer-menu.md)'s five footer labels, and
> [INT8-028](INT8-028-hero-page-header-block.md)'s `page_hero` block, whose UUID `block.block.interstate_85_pageherobackground.yml`
> hard-references. NFR-6 governs *config*; nothing governs required *content*, and no ticket could be
> written honestly until the mechanism is chosen. Parked in `spec/TODO.md` (TODO-002) with the owed
> decision named, per CONVENTIONS §6.6's rule that a genuine spec gap is a specification change, not a
> cleanup ticket.

---

## Traceability — requirements to tickets

Derived from each ticket's `implements` field. Every `FR`/`NFR` appears against at least one ticket
(NFR-4 is deliberately deferred — pre-launch performance pass).

| Requirement | Implemented by |
|-------------|----------------|
| FR-1 | [INT8-012](INT8-012-song-type-migration.md), [INT8-013](INT8-013-songs-migration.md) |
| FR-2 | [INT8-010](INT8-010-song-content-type.md), [INT8-013](INT8-013-songs-migration.md) |
| FR-3 | [INT8-010](INT8-010-song-content-type.md), [INT8-013](INT8-013-songs-migration.md) |
| FR-4 | [INT8-013](INT8-013-songs-migration.md) |
| FR-5 | [INT8-014](INT8-014-migration-verification.md) |
| FR-6 | [INT8-018](INT8-018-songs-landing.md) |
| FR-7 | [INT8-018](INT8-018-songs-landing.md) |
| FR-8 | [INT8-018](INT8-018-songs-landing.md), [INT8-029](INT8-029-ledger-letter-rail-grouping.md) |
| FR-9 | [INT8-008](INT8-008-song-type-taxonomy.md), [INT8-018](INT8-018-songs-landing.md) |
| FR-10 | [INT8-018](INT8-018-songs-landing.md) |
| FR-11 | [INT8-018](INT8-018-songs-landing.md) |
| FR-12 | [INT8-010](INT8-010-song-content-type.md), [INT8-019](INT8-019-song-page.md) |
| FR-13 | [INT8-020](INT8-020-song-versions.md) |
| FR-14 | [INT8-019](INT8-019-song-page.md) |
| FR-15 | [INT8-019](INT8-019-song-page.md) |
| FR-16 | [INT8-011](INT8-011-pathauto-songs.md), [INT8-015](INT8-015-header-footer.md), [INT8-017](INT8-017-nav-frontpage.md), [INT8-018](INT8-018-songs-landing.md), [INT8-027](INT8-027-header-nav-states-slogan.md) |
| FR-17 | [INT8-009](INT8-009-media-textformat.md), [INT8-019](INT8-019-song-page.md) |
| FR-18 | [INT8-018](INT8-018-songs-landing.md) |
| FR-19 | [INT8-018](INT8-018-songs-landing.md) |
| FR-20 | [INT8-020](INT8-020-song-versions.md) |
| FR-21 | [INT8-009](INT8-009-media-textformat.md), [INT8-013](INT8-013-songs-migration.md) |
| NFR-1 | [INT8-015](INT8-015-header-footer.md), [INT8-018](INT8-018-songs-landing.md), [INT8-019](INT8-019-song-page.md), [INT8-020](INT8-020-song-versions.md), [INT8-021](INT8-021-e2e-capstone.md), [INT8-027](INT8-027-header-nav-states-slogan.md) |
| NFR-2 | [INT8-015](INT8-015-header-footer.md), [INT8-021](INT8-021-e2e-capstone.md) |
| NFR-3 | [INT8-014](INT8-014-migration-verification.md) |
| NFR-4 | *(deferred — pre-launch performance pass; no slice-1 ticket)* |
| NFR-5 | [INT8-006](INT8-006-test-tooling-gate.md) |
| NFR-6 | [INT8-010](INT8-010-song-content-type.md) (+ the config-export-and-verify practice on every `[site-building]` ticket: 002, 003, 008, 009, 011, 017) |
| NFR-7 | [INT8-006](INT8-006-test-tooling-gate.md), [INT8-021](INT8-021-e2e-capstone.md), [INT8-036](INT8-036-firefox-playwright-stale-lock.md) |
| NFR-8 | [INT8-021](INT8-021-e2e-capstone.md), [INT8-036](INT8-036-firefox-playwright-stale-lock.md) |
