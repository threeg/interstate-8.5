# Interstate-8 — Content Model (v5, `5.0.x-dev` slice 1)

| | |
|---|---|
| **Document** | Content model — content types, fields, taxonomy (the data contract) |
| **Repository location** | `spec/architecture/content-model.md` |
| **Status** | Binding specification — Milestone 3 signed off (2026-07-07) |
| **Companion to** | `architecture.md` (§3 data model overview) |
| **Grounding** | v2 `I8_Songs` / `I8_SongType` (validated schema) and the requirements (`FR`/`NFR`) |

> **Purpose.** The authoritative field-by-field design for slice 1: the **Song** content type, the
> **Song type** taxonomy, the **Remote video** media use, and the **Restricted HTML** text format. Per
> the project non-negotiable, this config is **generated in the Drupal admin UI/API and exported**,
> then the exported config is verified against this document — never hand-authored. Machine names below
> are proposed; confirm on review.

---

## 1. Decisions (this milestone)

- **Song = node content type** (`song`) — pragmatic Drupal default; view modes + Twig + Pathauto.
- **Song type = taxonomy vocabulary** (`song_type`) — entity reference; add/reorder via UI.
- **Music video = Core Media "Remote video"** (oEmbed) — reference a Media entity, not raw markup.
- **Rich text = a "Restricted HTML" text format** — the FR-21 cleanup target.

---

## 2. Content type: `Song` (node)

| Label | Machine name | Drupal type | Card. | Req. | v2 source | Notes |
|-------|--------------|-------------|:----:|:----:|-----------|-------|
| Title | `title` (node) | node title | 1 | ✔ | `Song_Name` | Display + basis for the sort key (§6). |
| Lyrics | `field_lyrics` | Text (formatted, long) | 1 | — | `Song_Lyrics` | Restricted HTML (§5); normalised on import (FR-21). |
| Notes | `field_notes` | Text (formatted, long) | 1 | — | `Song_Notes` | Restricted HTML; FR-21. |
| Quotes | `field_quotes` | Text (formatted, long) | 1 | — | `Song_Quotes` | Restricted HTML; FR-21. |
| Music video | `field_video` | Entity reference → Media (Remote video) | 1 | — | `Song_Video` | oEmbed (§4). Single in v2; multi later if needed. |
| Song type | `field_song_type` | Entity reference → `song_type` term | 1 | ✔ | `FK_SongType_ID` | The band/group (FR-9). |
| Parent song | `field_parent_song` | Entity reference → node `song` | 1 | — | `FK_Song_ID` (self) | Non-empty ⇒ this is an **alternate version** (§7). |
| Lyrics same as parent | `field_lyrics_same_as_parent` | Boolean | 1 | — | `Song_LyricsSameAsNormal` | Drives "[same as normal version]" (FR-20); only meaningful with a parent. |
| Exclude from song list | `field_exclude_from_list` | Boolean | 1 | — | `Song_Live` | Hides the song from the landing (FR-6). The v5 rename of the `Song_Live` misnomer. |
| Legacy id | `field_legacy_id` | Integer (indexed) | 1 | — | `PK_Song_ID` | Permanent v2 primary key. Cross-cutting convention (§2.1 note); populated for migrated content, empty for natively-created. |

**Legacy id (cross-cutting convention).** Migration idempotency (FR-4) is handled by the Migrate map
table, but that map is transient and per-migration. Separately, **every migrated content entity carries
a permanent `field_legacy_id`** (its v2 primary key) because it is needed at *runtime*, long after
import: (1) to **repair cross-entity joins** when later slices import data that references songs by
their v2 key; and (2) to **redirect legacy URLs and inline links** (`songlist.php?songid=N`, and
rich-text links in later migrated content) to the correct v5 entity via the **Redirect** module,
preserving link equity instead of 404ing (the redirect **build is deferred to a future SEO slice**;
slice 1 captures the field only). Because v2 primary keys are only unique *within* a table, redirect
resolution keys on **entity type + legacy id**. See `architecture.md` §3 for the convention.

**No seam fields on Song.** The deferred relationships (releases, setlists/live, tabs, studio) are
**inbound** from other entities built in later slices, so Song carries no fields for them now. The
`setlistfm_id` seam belongs on the tour-date entity, not here.

---

## 3. Taxonomy vocabulary: `Song type`

| Property | Value |
|----------|-------|
| Vocabulary | `song_type` |
| Terms (working set) | Modest Mouse, Ugly Casanova, Side Projects, Covers |
| Term order | Preserve v2 `SongType_Order` as term weight. |
| Legacy id | `field_legacy_id` (Integer, indexed) on the term ← `PK_SongType_ID`. Cross-cutting convention (architecture.md §3.3) — applies to every migrated content entity, not just Song. |
| Source | `I8_SongType` (`PK_SongType_ID`, `SongType_Name`, `SongType_Order`). |

The term set and spelling are confirmed against the dump: `Modest Mouse` (PK 1), `Ugly Casanova`
(PK 2), `Covers` (PK 3), `Side Projects` (PK 4, capital P). The landing's **default view is the
*Modest Mouse* term** (FR-9). Taxonomy leaves room for per-type pages/metadata later without
remodelling.

---

## 4. Media: Remote video (oEmbed)

Videos are **Core Media "Remote video"** entities (YouTube/Vimeo via oEmbed URL), referenced by
`field_video`. **Migration note:** v2 `Song_Video` stored raw **embed markup**, not a bare URL — the
migration MUST extract the video URL/ID from that markup to create the Media entity (a process step;
rows it can't parse are reported, not silently dropped). Alt/label handling follows the Media defaults.

---

## 5. Text format: Restricted HTML

A dedicated **Restricted HTML** format is the target for `field_lyrics` / `field_notes` /
`field_quotes` and the destination of the FR-21 cleanup: legacy inline markup is stripped to a small
allowed set while line/paragraph breaks are preserved. Allowed tags: `<p> <br> <em> <strong> <a href
hreflang>`. No image or script tags. Composition: `filter_html` (the allow-list) + `filter_autop`
(line-break conversion) + `filter_url` (link-ify plain URLs) + `filter_htmlcorrector` (malformed-markup
correction).

**Authoring UI.** A **CKEditor 5** text editor is attached to the format (toolbar: bold, italic, link
only — exactly the tags the allow-list permits, so the editor and the filter never disagree) so
editors get a WYSIWYG experience rather than hand-typed HTML in a plain textarea.

---

## 6. Sorting — article-insensitive (FR-8)

FR-8 requires ordering by the first significant word, dropping a leading "A"/"An"/"The".
**Decision (operator): sort at query time — no duplicated sort field on the content model.** Candidate
mechanisms, with verified status:

- **Views Sort Expression (contrib) — preferred.** Adds a SQL `ORDER BY` expression to the View (e.g.
  strip a leading article), with no stored/duplicated data. **Stable, security-covered** release
  (2.0.1), but currently declares **Drupal `^9 || ^10`** — D11 support must be verified or a constraint
  bump applied before adoption.
- **Owned custom Views sort handler — fallback.** A small (~20–30 line) sort plugin doing the same
  query-time normalisation. No dependency, guaranteed D11, fully owned; use if Views Sort Expression
  isn't D11-ready.
- **Views Natural Sort (contrib) — de-prioritised.** Declares D11 but is **alpha-only**, and builds its
  own index table (so it *also* duplicates the normalised string), giving richer number/symbol sorting
  not needed at ~400 rows.

**The final mechanism is chosen at the build milestone, tested against the actual D11/Lando stack.**
Either way the content model carries **no sort field**.

---

## 7. Version modelling (self-reference)

- **Direction.** A child (alternate version) references its parent via `field_parent_song` (mirrors v2
  `FK_Song_ID`). A parent finds its children by reverse query (`field_parent_song = this`).
- **Alternate version page (FR-20).** When `field_parent_song` is set, the page shows this song's
  lyrics beside the parent's; if `field_lyrics_same_as_parent` is true, the alt column reads "[same as
  normal version]" (linking the parent) instead of repeating them.
- **Parent page (FR-13).** Lists its alternate versions as links.
- **Landing visibility.** Alternates appear by default (marked), hidden by the Alternate-titles filter
  (FR-10); any song with `field_exclude_from_list = true` is always excluded (FR-6).

---

## 8. Migration mapping summary (v2 → v5)

| v2 | v5 |
|----|----|
| `I8_Songs` row where `Song_Active = 1` | `song` node, keyed on `PK_Song_ID` (FR-4) |
| `PK_Song_ID` | `field_legacy_id` (permanent; join-repair + redirects) |
| `Song_Name` | `title` |
| `Song_Lyrics` / `_Notes` / `_Quotes` | `field_lyrics` / `field_notes` / `field_quotes` (Restricted HTML, FR-21 cleanup) |
| `Song_Video` (embed markup) | `field_video` → Remote video Media (URL extracted, §4) |
| `FK_SongType_ID` | `field_song_type` (→ `song_type` term) |
| `FK_Song_ID` | `field_parent_song` |
| `Song_LyricsSameAsNormal` | `field_lyrics_same_as_parent` |
| `Song_Live` | `field_exclude_from_list` |
| `Song_Active` | node `status` (published/unpublished): 1 → published, 0 → unpublished; all 492 dump rows are 1 |
| `Song_Download` | — (dropped; defunct iTunes referral) |
| `I8_SongType` row | `song_type` term, keyed on `PK_SongType_ID` |
| `PK_SongType_ID` | `field_legacy_id` on the term (see §3) |
| `SongType_Name` | term name |
| `SongType_Order` | term weight, **verbatim** (not reindexed) |
| `SongType_Active` | term `status` (published/unpublished), mirroring the `Song_Active` → node `status`
  pattern above — taxonomy terms carry the same core published/unpublished base field. All 4
  `I8_SongType` dump rows are `1`. |

Migration is idempotent and rollbackable (FR-4); imported count is verified against the source (FR-5).

---

## 9. Decisions log

- **2026-07-12** — **CKEditor 5 attached to the Restricted HTML format** (§5 "Authoring UI"): toolbar
  limited to bold / italic / link, matching the `filter_html` allow-list exactly so the editor and the
  filter cannot drift. Discovered during INT8-010 (the format from INT8-009 had no editor, leaving a
  bare-HTML textarea); the editor is part of the format's spec, not optional.
- **2026-07-12** — **`field_legacy_id` extended to the Song type taxonomy term** (§3), closing a gap
  where the cross-cutting convention (architecture.md §3.3, "every migrated content entity") wasn't
  reflected here — only Song had the field listed. Also corrected the working term set's spelling to
  **"Side Projects"** (capital P), confirmed against the `I8_SongType` dump per INT8-008's own
  instruction to reconfirm at build time.
- **2026-07-07** — Song = **node** content type; Song type = **taxonomy**; video = **Core Media remote
  video** (oEmbed); rich text = **Restricted HTML**. (Operator decisions, Milestone 3.)
- **2026-07-07** — `Song_Live` becomes **`field_exclude_from_list`** — the rename away from the "live"
  misnomer; it is purely a "hide from the song list" control.
- **2026-07-07** — **Video migration extracts the URL from v2 embed markup** to build Media entities;
  unparseable rows are reported.
- **2026-07-07** — **FR-8 sort — query-time, no duplicated field** (operator decision). Preferred:
  **Views Sort Expression** (stable/security-covered, but declares `^9 || ^10` — verify D11), else a
  small **owned Views sort handler** (D11-safe). **Views Natural Sort** de-prioritised (alpha-only on
  D11 and duplicates into its own index). Final mechanism deferred to the build milestone, tested on
  the real stack.
- **2026-07-07** — **`field_legacy_id` adopted as a cross-cutting convention** (all migrated content
  entities), not optional: needed at runtime for **cross-entity join repair** in later slices and for
  **legacy-URL / inline-link redirects** (Redirect module), keyed on entity type + legacy id. Not
  required (natively-created content leaves it empty); indexed. Reversed the earlier "optional" call.
