---
id: INT8-038
title: Fold accents in the ledger's sort key so one letter cannot split into two groups
type: task
status: todo
milestone: 9
batch: cleanup
layer: services
depends_on: [INT8-029, INT8-030]
implements: []
tests_required: true
estimate: 2
---

## In plain English
The song list groups titles under letter headings. If a song title ever starts with an accented
letter — "Émile", say — it would land under **E** in the heading but sort as if it came after **Z**,
which pushes it past the other E songs and makes a *second* "E" heading appear further down the page.
No song in the archive does this today, so nothing is broken on the live site; this closes the hole
before someone types a title that opens it.

## Background

Raised by `sfk-verify` on the cleanup batch (2026-07-28). `ArticleInsensitiveTitle` derives two
things from a title, and they disagree about accents:

- **`bucket()`** folds the first character to ASCII (`iconv('UTF-8', 'ASCII//TRANSLIT', …)`), so
  "Émile" → `E`.
- **`comparisonKey()`** does **not** fold — it returns `émile`, whose first byte is `0xC3`, sorting
  after every ASCII letter.

`interstate_85_preprocess_views_view__songs()` sorts on `[rank(letter), comparison_key]` and then
walks the sorted list building groups **sequentially** — starting a new group each time the letter
changes from the previous row. That pass is only correct if bucket order and sort order agree, and
accent folding is exactly where they don't.

**Reproduced in the Lando container** (not theorised) with titles `Em, Ez, Fa, The Éclair, Émile`:

```
Em           bucket=E key=em
Ez           bucket=E key=ez
Fa           bucket=F key=fa
The Éclair   bucket=E key=éclair
Émile        bucket=E key=émile
GROUPS: E(Em,Ez) F(Fa) E(The Éclair,Émile)
```

Two consequences, both real:

1. **Two elements carry `id="songs-e"`.** `$bucket_id()` derives the anchor id from the letter, so
   both E groups get the same id — a duplicate DOM id, which Axe's `duplicate-id` rule flags under
   **NFR-1** (WCAG 2.1 AA).
2. **The rail's E jump-link reaches only the first group** (INT8-030), so the songs in the second are
   unreachable by the navigation INT8-030 exists to provide.

**Why nothing is red today.** All 492 imported titles are pure ASCII — verified by querying every
published song node for a character outside `\x20-\x7E`: zero matches. The suite already *has* the
guard — `songs-landing.spec.ts:558`, *"every group header is A-Z or `#`, **appears once**, and `#`
comes last (INT8-029)"* — it passes because of the data, not because the grouping is safe. So this
would be caught eventually, by a red gate at an inconvenient moment, rather than by design.

**Also stale, fix while here.** `interstate_85.theme` (the comment above the rail-letters loop,
~line 184) still justifies the sequential grouping pass with *"SQL sorts the same way, so consecutive
same-letter rows are never split into two groups by this sequential pass"*. INT8-029's PHP re-sort
superseded the SQL order as the definitive one, so that sentence no longer describes what guarantees
contiguity — and it is the sentence a future reader would trust instead of re-deriving this.

## Technical requirements

1. **Add a folded sort key to `ArticleInsensitiveTitle`** — e.g.
   `public static function sortKey(string $title): string`, which applies the same
   `iconv('UTF-8', 'ASCII//TRANSLIT', …)` fold `bucket()` already uses to the **whole**
   `comparisonKey()` result, lowercased.

   **Add it; do not change `comparisonKey()`.** That method's unfolded return value is pinned by
   `ArticleInsensitiveTitleTest::testComparisonKey()` (`'Éclair'` → `'éclair'`), written independently
   from the INT8-029 ticket text — changing it would mean editing an independently-authored test to
   match new code, which is the wrong direction. `bucket()` stays untouched too.

2. **Sort on the new key in the theme.** `interstate_85_preprocess_views_view__songs()` puts
   `sortKey()` (not `comparisonKey()`) in each row and sorts on `[rank($letter), $sort_key]`.

   *Why this is provably contiguous, so the sequential grouping pass stays valid:* `bucket()` only
   returns a letter when the first character folds to exactly one `A-Z` character, and in that case
   the first character of `sortKey()` is that same letter lowercased. Anything else — a digit, a
   multi-character fold (`Æ` → `AE`), an untranslatable character, an empty key — buckets to `#`,
   which `rank()` sorts into one trailing block regardless of its key. So within the non-`#` region,
   sort order and bucket order cannot diverge.

3. **Correct the stale comment** in `interstate_85.theme` so it states what actually guarantees
   contiguity (requirement 2's argument), not the superseded SQL-order claim.

Out of scope: `query()`'s SQL expression (still a deliberate "good enough" baseline — see the class
docblock's MariaDB bracket-expression note); the bucket rule itself (FR-8 is unchanged — this is a
sort-order fix, not a rule change); anything about how the ledger looks.

## Definition of done (acceptance criteria)
- [ ] `ArticleInsensitiveTitle::sortKey()` exists, folds accents, and `comparisonKey()` / `bucket()`
      are byte-for-byte unchanged.
- [ ] The theme sorts on `sortKey()`; the reproduction above yields **one** `E` group
      (`E(Em, Émile, Ez) F(Fa)` or equivalent), not two.
- [ ] Unit coverage added for `sortKey()`, including the accent case and the multi-character-fold
      case (`Æ`), written test-first and confirmed red for the right reason.
- [ ] A test pins the contiguity property itself — that no bucket letter can appear as two separate
      groups — rather than only the folding, so the guard survives a future refactor of either method.
- [ ] The stale contiguity comment in `interstate_85.theme` is corrected.
- [ ] `lando test` green with zero warnings; `lando playwright` green (the existing
      `songs-landing.spec.ts` INT8-029/030 assertions must pass **unmodified** — this changes ordering
      only for titles the current data does not contain).
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: true`. New cases go in the existing
`web/modules/custom/i8_services/tests/src/Unit/Plugin/views/sort/ArticleInsensitiveTitleTest.php`
(pure static functions, no container — a Unit test is the right level and the file is already there).

The contiguity assertion is the important one and is best written as a small property check: feed a
list of titles mixing accented and unaccented first letters, apply the same
`[rank, sortKey]` sort the theme uses, and assert that the sequence of buckets never returns to a
letter it has already left.

Command: `lando test`, then `lando playwright`. Manual reproduction of the original defect, for the
red step:

```
lando drush php:eval 'use Drupal\i8_services\Plugin\views\sort\ArticleInsensitiveTitle as A;
foreach (["Em","Ez","Fa","The Éclair","Émile"] as $t) { echo "$t bucket=" . A::bucket($t) . " key=" . A::comparisonKey($t) . PHP_EOL; }'
```

## Notes
- 2026-07-28 — created by `sfk-verify` on the cleanup batch (INT8-023–026, 032–037). Found by reading
  `bucket()` and `comparisonKey()` against each other rather than by a failing test, then confirmed by
  running the real classes in the container. Cleanup backlog rather than main sequence: it is a latent
  correctness hole in already-shipped behaviour that changes nothing a user can see today
  (CONVENTIONS §6.6), and no `FR` text changes — FR-8's rule is right, its ordering key is
  inconsistent with it.
