# Interstate-8 — Content Model (v5, `5.0.x-dev` line)

| | |
|---|---|
| **Document** | Content model — content types, fields, taxonomy (the data contract) |
| **Repository location** | `spec/architecture/content-model.md` |
| **Status** | Binding specification — Milestone 3 signed off (2026-07-07); **amended at Milestone 12 for slice 2 (`5.0.x-dev2`), 2026-08-02** |
| **Companion to** | `architecture.md` (§3 data model overview) |
| **Grounding** | v2 `I8_Songs` / `I8_SongType` (validated schema) and the requirements (`FR`/`NFR`) |

> **Purpose.** The authoritative field-by-field design. **Slice 1** (§2–§8): the **Song** content type,
> the **Song type** taxonomy, the **Remote video** media use, and the **Restricted HTML** text format.
> **Slice 2** (§9–§11): the **Page** content type and its Layout Builder scoping, the **Homepage hero**
> block type, and the **default content** that makes a fresh install reproducible. Per the project
> non-negotiable, this config is **generated in the Drupal admin UI/API and exported**, then the exported
> config is verified against this document — never hand-authored.
>
> **Section numbering note (M12).** Slice 2's sections were inserted as §9–§11 and the decisions log moved
> from §9 to **§12**. One citation was updated to match (`requirements.md`'s 2026-07-19 log entry). Prefer
> citing this file rather than a section number — see *Resolving an id* in `spec/README.md`.

---

## 1. Decisions

**Milestone 3 (slice 1):**

- **Song = node content type** (`song`) — pragmatic Drupal default; view modes + Twig + Pathauto.
- **Song type = taxonomy vocabulary** (`song_type`) — entity reference; add/reorder via UI.
- **Music video = Core Media "Remote video"** (oEmbed) — reference a Media entity, not raw markup.
- **Rich text = a "Restricted HTML" text format** — the FR-21 cleanup target.

**Milestone 12 (slice 2):**

- **A general `page` content type, not a single-use `homepage` type** (§9, `D-h`) — the homepage is one
  node of it; About, Terms and Privacy are later nodes of the same type.
- **Layout Builder is enabled on `page` with per-node override** (§9, `D-h`) — and on **nothing else**.
- **Homepage hero = its own block type** `homepage_hero` (§10, `D-b`), **reusing** `page_hero`'s existing
  `field_background_images` storage and the `i8_hero_background` formatter (FR-25).
- **Default content = the `default_content` module** (§11, `D-d`, `TODO-002`) — seeds on install,
  preserves UUIDs, never re-imports over an operator's edits.

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
`field_video`. Alt/label handling follows the Media defaults.

**Migration note (revised at INT8-013).** v2 `Song_Video` stored raw **embed markup**, not a bare URL.
Automated extraction was originally planned but **descoped**: only 15 of 492 `I8_Songs` rows have a
video (14 YouTube, 1 Vimeo, all clean `<iframe src="...">` markup, one row with two videos), too small
a volume to justify parser complexity/risk. `field_video` is left empty by the migration; populating it
is a **manual, pre-launch task** — create a Remote video Media entity per song from the source
`Song_Video` markup (the video URL is trivially readable from the `src` attribute) and set `field_video`
via the admin UI. Not modelled as its own ticket given the small, one-time, manual nature of the work.

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
| every `I8_Songs` row | `song` node, keyed on `PK_Song_ID` (FR-4). The migration does **not** filter on `Song_Active`; it imports every row and maps `Song_Active → status` (see below), so an inactive row is imported **unpublished** rather than dropped. All 492 dump rows are active, so this is equivalent to importing the active set today (FR-1/FR-5). |
| `PK_Song_ID` | `field_legacy_id` (permanent; join-repair + redirects) |
| `Song_Name` | `title` |
| `Song_Lyrics` / `_Notes` / `_Quotes` | `field_lyrics` / `field_notes` / `field_quotes` (Restricted HTML, FR-21 cleanup) |
| `Song_Video` (embed markup) | **not imported** — `field_video` populated manually, pre-launch (§4) |
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

## 9. Content type: `Page` (node) — slice 2

Settles `D-h`. Realises **FR-22** (the front page is editable content, not a controller).

**A general type, not a homepage type.** The site needs one homepage but several other bespoke pages —
About, Terms, Privacy — and they are the same *kind* of thing: hand-composed editorial pages, as opposed
to the uniform archive entities (`song`, and later releases/setlists/news) that are code-themed. A
single-use `homepage` type would be a content type per node. **The homepage is simply the `page` node
that `system.site.yml` points `front` at.** (Operator decision, M12.)

| Label | Machine name | Drupal type | Card. | Req. | Notes |
|-------|--------------|-------------|:----:|:----:|-------|
| Title | `title` (node) | node title | 1 | ✔ | Not necessarily rendered — the homepage's visible heading comes from its hero (§10), not the node title. |
| Body | `body` | Text (formatted, long) | 1 | — | Restricted HTML (§5). The default content region for a plain page (About, Terms). The homepage may leave it empty. |

**No `field_legacy_id`.** The cross-cutting convention (§2, `architecture.md` §3.3) applies to **migrated**
content; `page` nodes are authored natively in v5 and have no v2 primary key. Adding the field would leave
it permanently empty and imply a migration that does not exist.

### 9.1 Layout Builder scoping (`D-h`) — the precedent every later page inherits

| Setting | Value | Why |
|---|---|---|
| Layout Builder enabled | **`page` only** | The northstar scopes Layout Builder *"narrowly"* (`brief.md` §8) and `architecture.md` §6 excludes it from entity pages. **The bound that keeps "narrowly" meaningful is the content type, not the page count:** LB is for bespoke editorial composition; archive entities stay code-themed. |
| Enabled on `song` or any archive type | **Never** | Uniform structured content must not acquire per-instance layout variance — that is what keeps the future JSON surface clean (`architecture.md` §1). This is the binding half of the rule. |
| Per-node override (`allow_custom`) | **On** | Each bespoke page differs by definition; a shared default layout that every node overrides is a default in name only. |

**The cost of override, stated plainly.** With `allow_custom: true` the layout lives in the **node**
(`layout_builder__layout`), not in the view display — so it is **content, not config**. Two consequences
follow and both are handled rather than accepted silently:

1. **It is invisible to config diffs.** A layout change will not appear in a `config:export` review. This
   is the deliberate trade for editorial freedom on bespoke pages, and it is bounded by the rule above —
   nothing structured is ever laid out this way.
2. **It must be seeded** (§11), because `NFR-9` requires a fresh install to produce a working homepage.
   This is why §10's hero is a **reusable** block rather than an inline one.

## 10. Block type: `Homepage hero` — slice 2

Settles `D-b`. Realises **FR-23** (set editorial message) and inherits **FR-25** (random background).
That this is a *separate* block type rather than an extension of `page_hero` was settled in the version
brief §2 B, not here.

| Label | Machine name | Drupal type | Card. | Req. | Notes |
|-------|--------------|-------------|:----:|:----:|-------|
| Message | `field_message` | Text (formatted, long) | 1 | ✔ | Restricted HTML (§5). The set editorial line (FR-23) — **this is the only genuinely new field in slice 2's hero.** Replaces the page title `page_hero` renders. |
| Background images | `field_background_images` | Entity reference → Media (image), **unlimited** | −1 | — | **Reuses the existing field storage** `block_content.field_background_images` (created for `page_hero` at INT8-028) on a second bundle. Rendered through the existing `i8_hero_background` formatter. |

**Why the reuse is safe, and why it is not laziness.** A field *storage* in Drupal is per entity type, so
`block_content.field_background_images` is already available to any `block_content` bundle — attaching it
to `homepage_hero` creates a new `field.field.*` instance against the **same storage**, which is the
normal Drupal pattern, not a workaround. `HeroBackgroundFormatter` is a **field formatter on an
entity-reference field** and its docblock is explicit that *"nothing here knows it is inside a block"* —
so it carries to the new bundle unchanged, and **FR-25 is satisfied without new code**. Re-modelling the
image library for the second hero would duplicate a solved problem and give the two heroes divergent
behaviour for no gain.

### 10.1 Placement — reusable block, not inline

The homepage hero MUST be a **reusable `block_content` entity referenced from the layout**, not a Layout
Builder *inline* block.

- **Inline blocks are `block_content` entities with `reusable: false`, owned by the layout field.** They
  are the awkward case for content export (§11) precisely because they have no independent existence —
  they travel inside the node's serialised layout rather than as entities in their own right.
- **A reusable block is an ordinary entity with a stable UUID**, exported and seeded exactly like the
  `page_hero` block already is, and editable without entering Layout Builder at all.
- It also keeps the two heroes structurally parallel, which is what makes the shared field storage and
  shared formatter above coherent rather than coincidental.

### 10.2 The existing `page_hero` region block

`block.block.interstate_85_pageherobackground.yml` already carries
`visibility.request_path: { negate: true, pages: '<front>' }` — it renders on every page **except** the
front page. **That exclusion is what stops the two heroes colliding, and it already works.** M12's only
obligation, per the version brief, was to confirm it still holds once `<front>` resolves to a `page` node
rather than the `/home` stub route: **it does** — `request_path`'s `<front>` token matches whatever the
front page currently is, so it follows the change rather than needing to be re-pointed.

## 11. Default content — reproducible install content — slice 2

Settles `D-d`, resolving the gap `TODO-002` named. Realises **NFR-9** (reproducible) and **NFR-10**
(seeded, not enforced).

**Mechanism: the `default_content` module** (2.x), with the content shipped inside a small owned module.
(Operator decision, M12.)

### 11.1 Why this one — the survey `D-d` required

The hard constraint first: **`block.block.interstate_85_pageherobackground.yml` hard-references the hero
block's UUID** in both `dependencies.content` and its `plugin` key. Any mechanism that creates entities
with fresh UUIDs produces a site whose exported config points at nothing. **UUID preservation is
therefore a gate, not a preference**, and it eliminates most of the field.

| Candidate | Verdict |
|---|---|
| **`default_content` 2.x** | **Chosen.** Imports **by UUID**; seeds **once, when its module is installed**, which makes `NFR-10` true *by construction* rather than by policy; covers `node`, `block_content`, `menu_link_content` and `media` through one mechanism. |
| `default_content_deploy` | Rejected. Built on the same base, but its purpose is **repeated** content deployment between environments — the enforce direction `NFR-10` warns against, and materially more surface than a one-time seed needs. |
| `single_content_sync` | Rejected. Manual YAML/ZIP snippets for ad-hoc transfers. The wrong shape for install-time seeding. |
| `structure_sync` | Rejected. Covers menus and custom blocks but **not nodes or layouts**, so it would need a second mechanism beside it. Its D11 status was not pursued, the coverage gap being decisive on its own. |
| Owned `hook_install()` | Rejected as the **starting point**, per the brief's lazy-adoption reading: the trigger now exists, contrib covers it, and hand-writing entity creation for UUID-pinned blocks and a serialised `layout_builder__layout` field is the likelier failure than over-engineering. Remains the fallback if `default_content` proves unworkable at M17. |

**The accepted risk, named.** `default_content` 2.x is at **beta** with no stable release. This is
tolerable because it is an **install-time dependency, not a runtime one** — nothing on a running site
calls it, so a defect affects standing up a *new* site, which is exactly the scenario that has no working
alternative today. Confirm the current release state at M17 before adding the dependency.

### 11.2 What is seeded

Everything a fresh `site-install` + `config:import` needs in order to satisfy the requirements and design:

| Content | Entity type | Why it must be seeded |
|---|---|---|
| Primary nav **Home** and **Songs** links | `menu_link_content` | The Songs link is the concrete realisation of **FR-16**. |
| The five footer labels | `menu_link_content` | `block.block.interstate_85_footermenu.yml` renders an empty row without them. |
| `page_hero` background block | `block_content` | **UUID-pinned** by exported config (above). |
| The **homepage** `page` node, including its `layout_builder__layout` | `node` | The layout is content, per §9.1. |
| The **homepage hero** block | `block_content` | Reusable (§10.1), referenced from that layout. |
| Hero background images | `media` + `file` | Referenced by `field_background_images`; the images themselves must travel. |

### 11.3 Seed, not enforce (`NFR-10`)

`default_content` imports when its module is installed and **does not re-import on subsequent config
imports or deployments**. An operator who rewrites the homepage hero's message keeps that edit through
every later deploy. **This is deliberately the opposite of how `NFR-6` treats configuration**, and it is
why the module is installed once rather than wired into a recurring deploy step.

> **The failure this avoids.** A mechanism that re-asserts content on every deploy silently discards real
> editorial work — worse than having no mechanism, because the loss is invisible until someone notices
> their words are gone.

### 11.4 The front-page pointer

`system.site.yml`'s `front` value MUST point at a **stable path alias** for the homepage node, not at
`/node/N`. Node ids are assigned at install time and are not stable across installs; the alias is seeded
with the node and is. This replaces the `/home` value the `INT8-017` stub owned (**FR-22**).

## 12. Decisions and superseded wording

> Not here — see **[`decisions.md`](decisions.md)** beside this file. This document holds **builder
> instructions only**: rules, contractual values, and operational hazards. Why a rule is what it is, and
> what it used to say, live in the archive so they are out of the reading path (`spec/README.md`, *How
> versions evolve*). The reference runs **one way** — entries there name rules here; a rule never cites
> an entry.
