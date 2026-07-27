---
id: INT8-001
title: Initialise repo + Lando environment
type: task
status: done
milestone: 8
batch: scaffolding
layer: repo
depends_on: []
implements: []
tests_required: false
estimate: 2
---

## In plain English
Make the project start with one command on any machine — the foundation everything else installs into.

## Background
The repo has the spec but no application. Stand up the Lando environment and the Composer project skeleton
so Drupal can be installed (INT8-002).

## Technical requirements
- Lando `drupal11` recipe for a Drupal 11 project (PHP 8.3, nginx via, MariaDB 10.11 to match the v2 dump), docroot `web/`.
- Composer project scaffold (`drupal/core-recommended`, `drupal/core-composer-scaffold`, `drush`); do **not** install the site yet.
- Root `config/sync` directory reserved **outside** docroot (wired in INT8-002).
- `.gitignore` already covers `/vendor/`, build artefacts; confirm `web/sites/*/settings.local.php`, `web/sites/*/files` ignored.
- Directory layout to match architecture §2.1 layers (`web/modules/custom`, custom theme) — created as work lands.

## Definition of done (acceptance criteria)
- [x] `lando start` brings the environment up cleanly; `lando composer install` succeeds.
- [x] `lando drush status` runs (bootstrap not required yet).
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **build-plumbing.** Verified by `lando start` + `lando composer install`
succeeding and `lando drush status` responding.

## Notes
2026-07-12 — Created `.lando.yml` (recipe `drupal11`; PHP 8.3, MariaDB 10.11, `via: nginx`, docroot
`web/`; a `legacy` MariaDB service for the v2 dump), `composer.json` Drupal 11 manifest (core-recommended
^11.0 + drush ^13.0 + core-dev in require-dev; no install yet), `config/sync/` and
`web/modules/custom/` placeholder dirs, and expanded `.gitignore` with Drupal/build-artefact patterns.
**Sanity test:** `lando start && lando composer install && lando drush status` — requires Lando
installed on the machine first (`docs.lando.dev/getting-started/installation.html`).

2026-07-27 — **correction (INT8-023).** This record originally described a DDEV environment
(`ddev config`/`ddev start`, `.ddev/config.yaml`, `.ddev/.gitignore`) that was never actually built —
DDEV was tried and abandoned in favour of Lando (WSL/mutagen made it roughly 90% slower) before this
ticket's work was committed, and the record was never reconciled after the switch. Corrected above to
the real artefact (`.lando.yml`) and commands (`lando ...`); the filename
(`INT8-001-init-repo-ddev.md`) is left as-is per CONVENTIONS §1.3 (ids/filenames are permanent).
