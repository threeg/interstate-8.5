---
id: INT8-001
title: Initialise repo + DDEV environment
type: task
status: in-review
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
The repo has the spec but no application. Stand up the DDEV environment and the Composer project skeleton
so Drupal can be installed (INT8-002).

## Technical requirements
- `ddev config` for a Drupal 11 project (PHP 8.3+, nginx-fpm, MariaDB/MySQL to match the v2 dump), docroot `web/`.
- Composer project scaffold (`drupal/core-recommended`, `drupal/core-composer-scaffold`, `drush`); do **not** install the site yet.
- Root `config/sync` directory reserved **outside** docroot (wired in INT8-002).
- `.gitignore` already covers `/vendor/`, build artefacts; confirm `web/sites/*/settings.local.php`, `web/sites/*/files` ignored.
- Directory layout to match architecture §2.1 layers (`web/modules/custom`, custom theme) — created as work lands.

## Definition of done (acceptance criteria)
- [ ] `ddev start` brings the environment up cleanly; `ddev composer install` succeeds.
- [ ] `ddev drush status` runs (bootstrap not required yet).
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **build-plumbing.** Verified by `ddev start` + `ddev composer install`
succeeding and `ddev drush status` responding.

## Notes
2026-07-12 — Created `.ddev/config.yaml` (PHP 8.3, nginx-fpm, MariaDB 10.11, docroot `web/`),
`.ddev/.gitignore` for generated DDEV files, `composer.json` Drupal 11 manifest (core-recommended
^11.0 + drush ^13.0 + core-dev in require-dev; no install yet), `config/sync/` and
`web/modules/custom/` placeholder dirs, and expanded `.gitignore` with Drupal/DDEV patterns.
**Sanity test:** `ddev start && ddev composer install && ddev drush status` — requires DDEV
installed on the machine first (`ddev.readthedocs.io/en/stable/install/`).
