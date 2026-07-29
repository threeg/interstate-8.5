---
id: INT8-039
title: Declare i8_services' module dependencies and correct its stale description
type: task
status: todo
milestone: 9
batch: cleanup
layer: services
depends_on: [INT8-017, INT8-035]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Our custom services module quietly relies on several parts of Drupal but never says so. Writing those
down means Drupal can install and uninstall things in the right order, and warns anyone who tries to
remove a part we depend on instead of letting the site break later. Its one-line description is also
left over from before the module had any real code in it.

## Background

Raised by `sfk-verify` on the cleanup batch (2026-07-28).

`web/modules/custom/i8_services/i8_services.info.yml` has **no `dependencies:` key at all**, while the
module:

- ships three Views plugins (`src/Plugin/views/sort/ArticleInsensitiveTitle.php`,
  `src/Plugin/views/filter/SongTypeFilter.php`, `src/Plugin/views/filter/AlternateTitlesFilter.php`)
  and implements `hook_views_data()`, `hook_views_data_alter()` and `hook_views_pre_render()` →
  **`drupal:views`**;
- implements `hook_ENTITY_TYPE_view()` for node and type-hints `Drupal\node\NodeInterface` in
  `SongVersions` and in `i8_services.module` → **`drupal:node`**;
- type-hints `Drupal\taxonomy\TermInterface` in `SongTypeOptions` and loads `song_type` terms →
  **`drupal:taxonomy`**;
- ships `src/Plugin/Block/SongSidebarBlock.php` → **`drupal:block`**;
- ships `src/Plugin/Field/FieldFormatter/HeroBackgroundFormatter.php` → **`drupal:field`** (and
  whatever the formatter's field type requires — check it rather than assuming).

This is not house style: its sibling `i8_migrate` declares all four of its dependencies
(`drupal:migrate`, `drupal:taxonomy`, `migrate_plus:migrate_plus`, `migrate_tools:migrate_tools`), so
the repo already has the convention and `i8_services` is the outlier.

**What it actually costs.** Nothing today — everything happens to be installed. The exposure is that
Drupal cannot order install/uninstall correctly, and nothing stops someone uninstalling Views or
Taxonomy and leaving broken plugin definitions and fatal type errors behind, with no warning at the
point of the mistake.

**The description is also stale.** It reads *"Custom services-layer logic: routes and controllers with
no direct data-model or theme ownership (architecture.md §2.1)."* The module has **no routes and no
controllers**. What it actually holds after INT8-018/028/035 is Views sort/filter plugins, a block
plugin, a field formatter, two entity-lookup services, and the build-time hooks that feed the theme.

## Technical requirements

1. **Add a `dependencies:` block** to `i8_services.info.yml` listing every module the code genuinely
   requires, in `drupal:<module>` form. Derive the list from the code — read each `use` statement, each
   plugin's base class and attribute, and each hook implementation — rather than copying the list
   above verbatim; the list above is the finding, not a verified inventory.
2. **Rewrite the `description:`** to state what the module contains now. One line, no aspiration.
3. **Verify the declaration is real, not decorative:** the module must uninstall and reinstall cleanly
   with the new dependency list in place (`lando drush pmu i8_services -y && lando drush en i8_services
   -y`), and `lando drush config:status` must report no differences afterwards.

Out of scope: any code change inside `i8_services`; splitting the module; the `i8_migrate` info file
(already correct).

## Definition of done (acceptance criteria)
- [ ] `i8_services.info.yml` declares every module the code requires, each one traced to the specific
      class or hook that needs it (record the mapping in `## Notes`).
- [ ] The description matches the module's actual contents.
- [ ] Uninstall + reinstall of `i8_services` succeeds and leaves `lando drush config:status` clean.
- [ ] `lando test` green with zero warnings.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: false` — **build-plumbing** exemption: this is module metadata, with no
numbered-requirement behaviour to assert. The uninstall/reinstall cycle in requirement 3 is the
verification, and it is a real one — a wrong or incomplete dependency list shows up there as a failed
or out-of-order uninstall.

Sanity check that the declaration is not merely present but correct:

```
lando drush pm:list --status=enabled --format=list | grep -E 'views|node|taxonomy|block|field'
lando drush php:eval 'print_r(\Drupal::service("extension.list.module")->getExtensionInfo("i8_services")["dependencies"]);'
```

## Notes
- 2026-07-28 — created by `sfk-verify` on the cleanup batch (INT8-023–026, 032–037). Surfaced while
  auditing the INT8-035 services extraction: the new `i8_services.services.yml` was correct, but the
  module's own `.info.yml` has not been touched since **INT8-017** created it (`1bb25b1`, its only
  commit), when the module genuinely was a near-empty shell — which is where the "routes and
  controllers" description comes from. Everything the module now contains arrived after that file was
  last written.
  Cleanup backlog rather than main sequence: nothing a user can see is wrong and no gate fails
  (CONVENTIONS §6.6).
