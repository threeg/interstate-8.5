---
id: INT8-003
title: Essential contrib + Gin admin theme
type: task
status: todo
milestone: 8
batch: scaffolding
layer: config
depends_on: [INT8-002]
implements: []
tests_required: false
estimate: 2
---

## In plain English
Add the small set of add-on modules we actually need now — the import tools, tidy URLs, and a better
editing screen — and nothing speculative.

## Background
Keep contrib minimal (own-the-stack principle). Only what slice 1 needs; **no** Search API (deferred),
**no** Metatag (SEO slice).

## Site-building steps (operator) — terse
1. `lando composer require` + enable: **migrate_plus**, **migrate_tools**, **pathauto** (+ **ctools**, **token** deps), **redirect**, **admin_toolbar**, **gin** (admin theme) + **gin_toolbar**.
2. Set Gin as the admin theme; keep the default front-end theme until INT8-005.
3. Core **Media** + **Media Library** enabled (for Remote video, INT8-009).
4. `lando drush cex -y` → commit.

## Technical requirements
- Pin all contrib in `composer.json`; enable via config (exported), not code.
- No Search API, no Metatag, no Layout Builder enablement beyond core defaults.

## Definition of done (acceptance criteria)
- [ ] The listed modules are enabled and pinned; Gin is the admin theme.
- [ ] `config/sync` updated (`core.extension` etc.) and committed; `lando drush cim` is a no-op.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **config.** **Claude verifies** the exported `core.extension` matches this
list (no extras) and pins are present in `composer.json`.
