---
id: INT8-E01
title: Foundation & tooling (scaffolding)
type: epic
status: done
milestone: 8
batch: scaffolding
layer: repo
depends_on: []
implements: []
tests_required: false
estimate: 8
---

## In plain English
Get a working Drupal 11 development site standing up on one command, with the tools and safety nets
in place so every later piece of work is checked automatically. Nothing the public sees yet — this is
the workshop everything else is built in.

## Summary
Delivers the buildable environment: Lando, Drupal 11, the essential contrib + admin theme, the owned
theme with Tailwind + tokens, the test/quality gate, and the v2 database mounted for import. This is
Milestone 8 (scaffolding).

## Scope
- **In scope:** repo + Lando, Drupal install, essential contrib, Gin admin theme, starterkit theme +
  Tailwind v4 + `tokens.css`, the test gate (PHPUnit/PHPCS/PHPStan/Playwright+Axe/boundary check), the
  v2 MySQL dump mounted as a migration source, `sfk-verify` filled in.
- **Out of scope:** any content model, migration, or public-facing UI (Milestone 9).

## Success criteria
All children done; `lando start` brings the site up; the empty `lando test` gate passes; the dependency
rule is enforced.

## Children
- INT8-001 — Initialise repo + Lando environment
- INT8-002 — Install Drupal 11 (minimal profile) + config/sync
- INT8-003 — Essential contrib + Gin admin theme
- INT8-004 — Mount the v2 MySQL dump as a migration source
- INT8-005 — Owned theme from starterkit + Tailwind v4 + `tokens.css`
- INT8-006 — Test tooling + the default gate
- INT8-007 — Fill in `sfk-verify` for the stack

## References
- spec/architecture/architecture.md §2.1 (layers), §5 (runtime), §6 (stack)
- spec/test-strategy/test-strategy.md §2 (tooling), §5 (boundary rule)
- Root CLAUDE.md (Commands, Stack)
