---
id: INT8-043
title: Declare `i8_services`' missing `drupal:media` dependency
type: task
status: todo
milestone: 9
batch: cleanup
layer: services
depends_on: [INT8-039]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Our custom services module works with Drupal's Media system but does not say so in its list of what it
needs. INT8-039 wrote that list and got eight of the nine entries right; this adds the one it missed.
Nothing is broken today — Media is installed — but the list exists so Drupal can warn someone before
they remove a part we depend on, and a list that is nearly complete gives exactly the false assurance
it was written to prevent.

## Background

Raised by `sfk-verify` on the INT8-038–042 cleanup batch (2026-08-01), with both gates green
(`lando test` 89 tests / 234 assertions, zero PHPCS/PHPStan warnings; `lando playwright` 565/565).

`web/modules/custom/i8_services/i8_services.info.yml` declares eight dependencies after INT8-039:
`block`, `field`, `file`, `image`, `node`, `responsive_image`, `taxonomy`, `views`. **`media` is not
among them**, while `HeroBackgroundFormatter` depends on it three ways:

- `isApplicable()` (line 97) hard-codes the requirement:
  `$field_definition->getFieldStorageDefinition()->getSetting('target_type') === 'media'` — the
  formatter offers itself for **no** field unless Media is installed and supplies that entity type.
- `viewElements()` treats every referenced entity as a media item and reads `field_media_image`, the
  field name core's Media module gives its own Image media type. The class docblock says so outright:
  *"the images are a plain entity-reference field on the `page_hero` block content type, selected with
  core's stock `media_library_widget`"*.
- Its own unit test type-hints `Drupal\media\MediaInterface`
  (`tests/src/Unit/Plugin/Field/FieldFormatter/HeroBackgroundFormatterTest.php:14`).

**This is INT8-039's own standard, not a new one.** That ticket did not simply sweep `use` statements
— it derived `drupal:image` from a dynamic `getStorage('image_style')` call and `drupal:responsive_image`
from a `'#type' => 'responsive_image'` render element. `isApplicable()`'s `'media'` string literal is
the same kind of dynamic reference and belongs on the same list; it was missed, not excluded. INT8-039's
definition of done reads *"declares every module the code requires, each one traced to the specific class
or hook that needs it"*, so this is that ticket finishing rather than a change of position.

**What it costs today: nothing.** `config/sync/core.extension.yml` has `media: 0` and `media_library: 0`
— both enabled — and the exported `core.entity_view_display.block_content.page_hero.default.yml` already
depends on `i8_services`. The exposure is the one INT8-039 was written to close: Drupal cannot order
install/uninstall correctly against an incomplete list, and nothing warns the person uninstalling Media
that the hero formatter is about to become a plugin definition pointing at an entity type that no longer
exists.

## Technical requirements

1. **Add `drupal:media` to `i8_services.info.yml`**, in the existing alphabetical position (between
   `image` and `node`).
2. **Re-derive the rest of the list rather than trusting it.** This finding exists because a
   `use`-statement sweep does not see a dynamic reference. Check the remaining plugin attributes,
   `isApplicable()`-style string literals, `getStorage()` / `\Drupal::service()` calls and render-element
   `#type` values across the module for any other module-owned name not on the list, and record the result
   in `## Notes` — including "nothing further found", which is the useful answer if it is the true one.
   Explicitly consider and state a position on `media_library` (used by the *widget* an editor picks images
   with, which is form/config-side, not this module's code) and `block_content` (the entity type the
   formatter's config attaches to, again not referenced by this module's code) — both are plausible
   additions and both may well be correct to leave off; the ticket wants the reasoning on disk, not a
   guess either way.
3. **Verify the declaration the same way INT8-039 did**, and expect the same cascade it documented:
   `lando drush pmu i8_services -y && lando drush en i8_services -y`, then `lando drush config:import`
   and `lando drush config:status` clean. INT8-039's notes record that uninstalling cascade-deletes
   `views.view.songs` and `block.block.interstate_85_songsidebar` and that `config:import` restores them —
   that is expected, not a regression, and re-reading those notes before starting will save rediscovering it.

Out of scope: any code change inside `i8_services`; splitting the module; `i8_migrate`'s info file
(correct since INT8-012); the `HeroBackgroundFormatter` logic itself.

## Definition of done (acceptance criteria)
- [ ] `i8_services.info.yml` declares `drupal:media`.
- [ ] The rest of the dependency list has been re-derived against dynamic references as well as `use`
      statements, with the outcome — including any deliberate omissions and why — recorded in `## Notes`.
- [ ] Uninstall + reinstall + `config:import` leaves `lando drush config:status` clean, and `/songs`
      and a song page both return 200 afterwards.
- [ ] `lando test` green with zero warnings.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: false` — **build-plumbing** exemption, the same category and the same reasoning as
INT8-039: this is module metadata with no numbered-requirement behaviour to assert. The uninstall /
reinstall / `config:import` cycle in requirement 3 is the verification, and an incomplete or wrongly
ordered list shows up there rather than in a unit test.

Sanity check that the declaration is real:

```
lando drush php:eval 'print_r(\Drupal::service("extension.list.module")->getExtensionInfo("i8_services")["dependencies"]);'
```
→ expected: nine entries, including `drupal:media`.

## Notes
- 2026-08-01 — created by `sfk-verify` on the INT8-038–042 cleanup batch. Found by checking the
  dependency list INT8-039 produced against the *dynamic* references in the module rather than only its
  `use` statements — the same method INT8-039 itself used for `image` and `responsive_image`. Cleanup
  backlog rather than main sequence: nothing a user can see is wrong, no gate fails, and Media is enabled
  (CONVENTIONS §6.6). Not a specification change (§5.5): no decision is reopened, and
  `architecture.md` §2.1 already places this kind of declaration in the services layer.
