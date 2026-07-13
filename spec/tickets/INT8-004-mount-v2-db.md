---
id: INT8-004
title: Mount the v2 MySQL dump as a migration source
type: task
status: in-review
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
(a second Lando database is the clean option).

## Technical requirements
- A **second database** (`legacy`) is defined as a Lando service in `.lando.yml`; credentials `legacy/legacy/legacy`, host `legacy`.
- Expose it to Migrate via `$databases['migrate']['default']` in `settings.lando.php` — wired for real in INT8-012/013.
- The dump is **not committed** (gitignored under `/legacy/`); on a fresh checkout, copy it from the v4 repo (`legacy/db/legacy.sql.zip`) and import with: `lando db-import --host legacy legacy/db/legacy.sql.zip`.

## Definition of done (acceptance criteria)
- [x] The `legacy` DB is importable via a documented `lando` command and holds the `I8_*` tables.
- [x] A `lando drush` one-liner (or SQL) confirms `I8_Songs` / `I8_SongType` row counts.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **build-plumbing.** Verified by the documented import command succeeding and
a row-count query against `I8_Songs` returning the expected ~412 songs.

## Notes
2026-07-12 — Added `legacy` MariaDB 10.11 service to `.lando.yml`; wired `$databases['migrate']['default']`
in `settings.lando.php` (host `legacy`, credentials `legacy/legacy/legacy`). Import command:
`lando db-import --host legacy legacy/db/legacy.sql.zip` (handles zip natively). Actual row counts:
492 `I8_Songs` (all `Song_Active = 1`; the ~412 estimate was off), 4 `I8_SongType` rows. Discovered
`Song_Active` field not in spec — added to `content-model.md` §8 migration mapping; maps to node
`status` (published/unpublished), not a filter condition. The dump itself is gitignored (`/legacy/`). **Sanity test (fresh build):**
1. `lando db-import --host legacy legacy/db/legacy.sql.zip` (or `.sql` if already extracted)
2. `lando ssh -s legacy -c "mysql -u legacy -plegacy legacy -e 'SELECT COUNT(*) FROM I8_Songs;'"` → 492
