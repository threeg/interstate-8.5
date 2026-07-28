---
id: INT8-025
title: Harden the migration count-parity check to verify FR-5 literally (published == active source)
type: task
status: done
milestone: 9
batch: cleanup
layer: migration
depends_on: [INT8-014]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Make the "did every song come across?" check count the songs that are actually *live* on the site and
compare that to the number of *active* songs in the old database — so the check proves the real promise,
not just that some node exists for every old row.

## Background
`requirements.md` FR-5 requires that **the count of imported songs equals the count of active songs in
the source**. The `song` migration deliberately imports **every** `I8_Songs` row and maps
`Song_Active → status` (published/unpublished) rather than filtering the source — a lossless choice,
reconciled into `content-model.md` §8/§9 and `requirements.md` §7 by `sfk-verify` on the migration
batch.

But `tooling/migration-verification-checks.php` asserts:

```php
$sourceSongs = (int) $legacy->query('SELECT COUNT(*) FROM I8_Songs')->fetchField();
$destSongs   = count(\Drupal::entityQuery('node')->condition('type','song')->accessCheck(FALSE)->execute());
i8_check('Song node count == I8_Songs count', $destSongs, $sourceSongs);
```

That compares **total** source rows to **total** song nodes. Today all 492 dump rows are
`Song_Active = 1`, so total==total==active and the check passes — but it does **not** verify FR-5's
actual guarantee (imported *published* count == *active*-source count). If an inactive row were ever
introduced, the check would still pass (the inactive row imports as an unpublished node, so both totals
rise together) while the FR-5 promise went unverified. This is exactly the "the check passes over the
drift" gap the contractual-value sweep exists to catch — low practical risk now, worth closing.

Surfaced by `sfk-verify` after the migration batch (INT8-011…014).

## Technical requirements
- In `tooling/migration-verification-checks.php`, tighten the count-parity assertion to verify FR-5
  literally:
  - **Published** song nodes == `SELECT COUNT(*) FROM I8_Songs WHERE Song_Active = 1`.
  - Keep (or add alongside) a **total** node == total row assertion, so the lossless "every row imported"
    property is also covered — label the two distinctly so a future failure says which invariant broke.
- Apply the same treatment to the `song_type` term parity check (`SongType_Active`) for consistency.
- No source-plugin or migration-config change — the migration's import-all + `status`-map behaviour is
  correct and stays as-is (see `content-model.md` §9, 2026-07-19).

## Definition of done (acceptance criteria)
- [x] The verification script asserts published-node count == active-source count (FR-5), and separately
      total-node count == total-source count.
- [x] `lando ssh -c "bash tooling/verify-migration.sh"` ends with "Migration verification passed (0
      failures)" against the real `legacy` DB (all rows active → both assertions hold at 492 / 4).
- [x] Default gate green (the `tooling/*` files remain outside PHPCS/PHPStan scope, as today).
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — the deliverable **is** verification tooling (test-strategy §4's documented
`drush` check form, not a per-commit gate test — it needs the real seeded `legacy` DB). Run on demand
via `tooling/verify-migration.sh`. Adds no requirement (`implements: []`); it hardens the FR-5 check that
INT8-014 delivered.

## Notes
2026-07-19 — created by `sfk-verify` (migration batch INT8-011…014).

2026-07-27 — **implemented, in review.** `tooling/migration-verification-checks.php`'s count-parity
section now runs four assertions instead of two: total-node == total-source (the lossless
"every row imported" property) and published-node == active-source (FR-5's literal promise), for both
`song` and `song_type`. Applied the same treatment to `song_type` for consistency, per the ticket.
No migration source/config change, as scoped — the import-all + `status`-map behaviour stays as-is.

Ran the full verification against the real seeded `legacy` DB
(`lando ssh -c "bash tooling/verify-migration.sh"`): all four count-parity checks pass at their expected
values (492 total/492 active songs; 4 total/4 active types — every source row is active today, so total
and active parity coincide, exactly as the ticket anticipated), all 20 field-mapping spot-checks pass,
and idempotency/rollback/restore (sections 2–4) are unaffected. Default gate re-run clean
(`tooling/*` stays outside PHPCS/PHPStan scope, unchanged).

**Summary:** the migration's "did every song come across?" check now verifies FR-5's actual guarantee —
published count against the *active* source count — rather than a total-vs-total comparison that would
stay green even if an inactive source row's published status ever drifted.

**Sanity test:** `lando ssh -c "bash tooling/verify-migration.sh"` → ends "Migration verification passed
(0 failures)".
