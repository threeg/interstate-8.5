---
id: INT8-004
title: Mount the v2 MySQL dump as a migration source
type: task
status: todo
milestone: 8
batch: scaffolding
layer: tooling
depends_on: [INT8-002]
implements: []
tests_required: false
estimate: 2
---

## In plain English
Load the old site's database somewhere the new site can read from, so the import can pull real songs
straight out of it.

## Background
Path A: the v2 MySQL dump is the sole migration source. A copy is preserved in the v4 repo at
`legacy/db/legacy.sql.zip` (per the v2 as-built reference). It must be reachable from Drupal's Migrate
(a second DDEV database is the clean option).

## Technical requirements
- Add a **second database** to DDEV (e.g. `legacy`) and import the v2 dump into it (`ddev import-db --database=legacy --file=…`).
- Expose it to Migrate via a `migrate_plus` SQL source connection (a `Database::addConnectionInfo('legacy', …)` in settings, or a dedicated migrate connection) — wired for real in INT8-012/013.
- Keep credentials in `settings.local.php`; the dump itself is **not** committed (large / already in the v4 repo).

## Definition of done (acceptance criteria)
- [ ] The `legacy` DB is importable via a documented `ddev` command and holds the `I8_*` tables.
- [ ] A `ddev drush` one-liner (or SQL) confirms `I8_Songs` / `I8_SongType` row counts.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **build-plumbing.** Verified by the documented import command succeeding and
a row-count query against `I8_Songs` returning the expected ~412 songs.
