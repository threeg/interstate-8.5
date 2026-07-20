---
id: INT8-013
title: Songs migration (I8_Songs → nodes)
type: task
status: in-review
milestone: 9
batch: migration
layer: migration
depends_on: [INT8-010, INT8-011, INT8-012]
implements: [FR-1, FR-2, FR-3, FR-4, FR-21]
tests_required: true
estimate: 5
---

## In plain English
Bring every song from the old site into the new one — names, lyrics, notes, quotes, videos, categories,
and the links between alternate versions — tidying up the old inconsistent formatting on the way in.

## Background
Ports/improves the v3 Songs source plugin. Mapping in `content-model.md` §8; flow in architecture §4.1.

## Technical requirements
- Migrate config `song`: source = `I8_Songs` (active) on `legacy`; dest = `node:song`; keyed on `PK_Song_ID` → `field_legacy_id` for idempotency (FR-4).
- Field map (`content-model.md` §8): title←`Song_Name`; lyrics/notes/quotes (Restricted HTML) with the **FR-21 cleanup** process plugin (strip legacy markup, preserve line/paragraph breaks); `field_song_type`←`FK_SongType_ID` (migration_lookup → INT8-012); `field_parent_song`←`FK_Song_ID` (self-ref, stub/second-pass); `field_lyrics_same_as_parent`←`Song_LyricsSameAsNormal`; `field_exclude_from_list`←`Song_Live`.
- **`field_video` is NOT populated by this migration** — descoped to manual pre-launch entry, decided
  during this ticket (only 15/492 songs have a video; see `content-model.md` §4/§8/§9 and
  `requirements.md` FR-2/§2.3, both updated). Leave the field empty for every migrated row.
- Preserve the self-reference (FR-3) — run songs, then resolve `field_parent_song` (highwater/second migration or stubbing).
- `migration/` depends only on `content-model`.

## Definition of done (acceptance criteria)
- [x] `drush migrate:import song` imports all active songs; re-run idempotent; rollback clean (FR-4).
- [x] Fields map per §8 (excluding `field_video`, descoped); parent self-ref resolved (FR-3); rich text normalized (FR-21).
- [x] Unit test for the FR-21 transform + migration verification tests (per §4) pass in the default gate.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. **Unit test** on the FR-21 cleanup transform (deterministic, test-first). Import
verified in INT8-014 (counts/spot-checks). Fixtures per test strategy §8.

## Notes
2026-07-19 — **Scope change first:** during setup, checked the real `Song_Video` data — only 15/492
songs have a video, all clean single-pattern `<iframe>` embeds. User called it: not worth an automated
markup parser for that volume; `field_video` import is descoped to **manual pre-launch entry**.
Updated `requirements.md` (FR-2, §2.3) and `content-model.md` (§4, §8, decisions log) *before*
implementing, per the non-negotiable — this ticket's own technical requirements were rewritten to match
(field_video removed from the DoD).

**FR-21 transform — test-first, `i8_migrate`'s `CleanRichText` process plugin
(`web/modules/custom/i8_migrate/src/Plugin/migrate/process/CleanRichText.php`, id
`i8_clean_rich_text`).** Wrote the failing unit test first (10 cases drawn from real `I8_Songs` rows —
`PK_Song_ID` 1, 3, 159 shapes — plus edge cases), confirmed it failed on a missing class, then
implemented. Design, worked out by tracing real byte-level data (`cat -A` on the raw DB values, not
just the mysql CLI's re-escaped display): **when structural tags (`<br>`/`<p>`/`<li>`) are present, they
are the sole source of line/paragraph structure and all raw whitespace — including incidental CRLF
formatting noise — is collapsed as insignificant**, matching how a browser actually renders the
original malformed markup; **when no structural tags exist at all, the raw newlines themselves are the
only signal and are preserved** (nl2br-style — confirmed this case is real: 10 `Song_Notes` + 4
`Song_Lyrics` rows are plain multi-line text with zero HTML). `<script>`/`<style>` blocks are stripped
with their content (plain `strip_tags()` alone keeps a script's inner text, which would leak "alert(1)"
as visible text — caught in the test suite). Doc-comment `@covers`/`@dataProvider`/`@group` annotations
were flagged by `--display-phpunit-deprecations` as deprecated for PHPUnit 12 — converted to
`#[CoversClass]`/`#[DataProvider]`/`#[Group]` attributes; zero deprecations after.

**Migration (`song`)** added to `i8_migrate`'s `config/install/`. Source: `table` plugin on `I8_Songs`
(`key: migrate`). `nid` reconciled via `entity_lookup` on `field_legacy_id` (same pattern as
`song_type`, INT8-012). `field_song_type` via `migration_lookup` against the `song_type` migration.
**`field_parent_song` (FR-3, self-reference)** via `migration_lookup` against the **same** `song`
migration, relying on Migrate's built-in stub mechanism — verified the real data supports this cleanly
first (`0` self-references, `0` dangling parent references, `0` multi-level chains among the 26
parent/child rows). `field_lyrics`/`field_notes`/`field_quotes` each split into `/value` (`skip_on_empty`
→ `i8_clean_rich_text`) and `/format` (`default_value: restricted_html`) sub-properties.

**Verified against the real `legacy` DB (492 rows), not simulated:**
1. **Count parity:** 492 `song` nodes exist — but the import initially left **493**. Traced it to a
   stray `nid=2` "Test song" node left over from earlier ad-hoc testing (not from this migration; no
   `field_legacy_id`) — deleted it as cleanup, unrelated to the migration's own correctness. Confirmed
   492 both after that fix and after a full rollback+re-import cycle.
2. **Field mapping spot-check (`PK_Song_ID` 1, "Dramamine"):** title, `field_song_type` → Modest Mouse
   (legacy id 1), lyrics cleaned exactly as hand-traced (`<p>…<br />…</p>`, apostrophes as `&#039;`),
   notes' `<LI>` correctly folded to a single `<p>`.
3. **Self-reference (`PK_Song_ID` 135 "Your Life" → 66):** matches the source `FK_Song_ID` exactly; all
   26 parent-linked rows resolved (matches the source's `has_parent` count).
4. **Idempotency:** re-running `migrate:import song` → "Processed 0 items"; count stays 492.
5. **Rollback — behaves differently from `song_type`, correctly.** `migrate:rollback song` removes
   **all 492** nodes (down to 0), unlike `song_type`'s `ROLLBACK_PRESERVE` — because these nodes were
   genuinely created by this migration (no pre-existing Song content to protect), so
   `EntityContentBase` correctly takes the delete path. Re-ran `migrate:import` afterward; final state
   verified clean (492 nodes, 26 parents).

Exported config (`migrate_plus.migration.song`); `lando drush cim -y` no-op; default gate (PHPUnit +
PHPCS + PHPStan + boundary) passes clean. **Sanity test:** `lando drush migrate:status song` → Total
492 / Imported 492; `lando php vendor/bin/phpunit --filter CleanRichTextTest` → 10/10 passing.
