---
id: INT8-041
title: Scope the Songs landing's Type-filter term lookup to published terms
type: task
status: todo
milestone: 9
batch: cleanup
layer: services
depends_on: [INT8-018, INT8-035]
implements: []
tests_required: true
estimate: 1
---

## In plain English
The band/group dropdown on the song list is built from every song-type we hold, including any an
editor has unpublished. An unpublished one would still show up as a choice, and picking it would
return an empty list — a dead option. All four types are published today, so nobody can hit this yet.

## Background

Raised by `sfk-verify` on the cleanup batch (2026-07-28).

`Drupal\i8_services\SongTypeOptions::getTerms()` builds the Type filter's options with:

```php
$terms = $storage->loadByProperties(['vid' => 'song_type']);
```

No `status` condition, and no access check. Meanwhile the **songs** the filter selects over are
published-scoped, and the migration deliberately maps activity to status: `content-model.md` §9 records
that the `song_type` migration *"runs unfiltered and lets `SongType_Active` set published/unpublished
— lossless (a future inactive row becomes an unpublished term, recoverable, not a dropped type)"*.

So the model already anticipates unpublished types; the filter does not. An unpublished `song_type`
term would appear in the public dropdown and, when selected, match zero songs — landing the visitor on
FR-19's empty state via an option that should never have been offered.

**This is pre-existing, and INT8-035 was right not to fix it.** The code arrived in INT8-018 as a
direct `loadByProperties()` call in `interstate_85_preprocess_views_view__songs()`; INT8-035 moved it
into the services layer under an explicit *behaviour-preserving* mandate, and preserved it verbatim —
including this. Changing semantics during that refactor would have violated its own definition of
done. This ticket is where the semantics change belongs.

**Not live today:** all four `song_type` terms (Modest Mouse, Ugly Casanova, Side Projects, Covers)
are published, so the dropdown is correct as rendered. This is a latent defect, filed before an editor
unpublishes a type and produces a dead option nobody expects.

## Technical requirements

1. **Filter to published terms** in `SongTypeOptions::getTerms()`. Prefer an entity query with an
   explicit `->condition('status', 1)` and a deliberate `accessCheck()` choice over post-filtering a
   full `loadByProperties()` result — and state in a comment which access semantics were chosen and
   why, the way `SongVersions` documents its own two different choices.
2. **Decide and record the access-check posture.** `SongVersions::getAlternates()` uses
   `accessCheck(TRUE)` for a many-entity search and `getParent()` uses a per-entity `access('view')`
   for a single resolved reference. This lookup is a many-entity search, so `accessCheck(TRUE)` is the
   consistent choice — but confirm it does not change what an anonymous visitor sees for the four
   published terms before adopting it.
3. **The rendered filter bar must be unchanged for today's data** — four types plus *All*, same order
   (weight), same labels. This ticket changes what *would* happen to an unpublished type, not what
   renders now.
4. **Consider the FR-9 reading in `## Notes`.** FR-9 requires the filter offer *"All plus each type in
   §2.1"*, and §2.1 lists all four by name. Publishing status is not mentioned, so this is an
   implementation-semantics fix rather than a requirement change — say so explicitly, and do **not**
   edit `requirements.md`.

Out of scope: the Type filter's *matching* behaviour (`SongTypeFilter`, case-insensitivity — pinned by
INT8-032, unchanged); term ordering; the `All` option; anything about the songs query itself.

## Definition of done (acceptance criteria)
- [ ] `SongTypeOptions::getTerms()` returns published terms only, with the access posture chosen
      deliberately and documented in a comment.
- [ ] Kernel coverage: a vocabulary with one unpublished term returns only the published ones, and the
      published set comes back in weight order. Written test-first and confirmed red for the right
      reason.
- [ ] `/songs` renders the identical filter bar it renders today (All + the four types, same order) —
      compared against a real response, not asserted from the code.
- [ ] `lando test` green with zero warnings; `lando playwright` green with the existing
      `songs-landing.spec.ts` Type-filter assertions passing **unmodified**.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: true`. `SongTypeOptions` has no PHPUnit coverage at all today — INT8-035 kernel-tested
`SongVersions` but not this class. A Kernel test alongside
`web/modules/custom/i8_services/tests/src/Kernel/SongVersionsTest.php` is the right level and the
right precedent to follow (it needs real taxonomy storage, so a Unit test will not do).

Manual confirmation of the defect, for the red step — create an unpublished fifth term, load `/songs`,
and see it offered in the dropdown:

```
lando drush php:eval '$t = \Drupal\taxonomy\Entity\Term::create(["vid" => "song_type", "name" => "ZZ Test", "status" => 0]); $t->save(); echo $t->id() . PHP_EOL;'
curl -s http://interstate-8-5.lndo.site/songs | grep -c 'ZZ Test'
```
→ today: `1` (offered, and selecting it matches no songs). Delete the term afterwards.

## Notes
- 2026-07-28 — created by `sfk-verify` on the cleanup batch (INT8-023–026, 032–037). Found while
  auditing INT8-035's extraction: the move itself was faithful, and reading the moved code against
  `content-model.md` §9's status-mapping decision is what exposed the mismatch. Cleanup backlog rather
  than main sequence: it improves the internal correctness of already-shipped behaviour and changes
  nothing a user can see with the current data (CONVENTIONS §6.6).
