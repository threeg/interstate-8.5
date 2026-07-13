---
id: INT8-002
title: Install Drupal 11 (minimal profile) + config/sync
type: task
status: in-review
milestone: 8
batch: scaffolding
layer: config
depends_on: [INT8-001]
implements: []
tests_required: false
estimate: 2
---

## In plain English
Install the actual Drupal software and point it at a versioned config folder, so every setting we make
later is captured in the repo rather than trapped in the database.

## Background
Drupal must be installed before contrib, theme or content-model work. Use the **minimal** profile
(stack proposal) and route configuration to a root `config/sync` outside the docroot.

## Site-building steps (operator) — terse
1. `ddev drush site:install minimal --account-name=admin -y`.
2. Set `$settings['config_sync_directory'] = '../config/sync';` in `settings.php` (repo-committed settings; secrets in `settings.local.php`).
3. Enable core essentials only as needed later; leave the profile minimal.
4. `ddev drush cex -y` → commit `config/sync`.

## Technical requirements
- Minimal install profile; `config/sync` outside docroot; trusted-host + hash salt in `settings.php`/`.local`.
- No contrib yet (INT8-003).

## Definition of done (acceptance criteria)
- [ ] Site installs and loads; `ddev drush status` shows bootstrap successful.
- [ ] `config/sync` populated and committed; a clean `ddev drush cim` is a no-op (config matches DB).
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **build-plumbing / config.** Verified by a no-op `ddev drush cim` and the
exported `core.extension` / system config committed. **Claude verifies** the exported config is the
minimal profile with the config/sync location set.

## Notes
2026-07-12 — Installed Drupal 11.4.2 (minimal profile) via `ddev drush site:install minimal
--account-name=admin -y`. Set `config_sync_directory = '../config/sync'` and enabled the
`settings.local.php` include in `settings.php`. Exported 67 config files to `config/sync/` via
`ddev drush cex -y`. Hash salt is provided by DDEV via `settings.ddev.php` (not committed);
production deployments will need it configured separately. **Sanity test:** `ddev drush cim -y`
should report "There are no changes to import" (run after `ddev start` from WSL filesystem).
