# Interstate-8 — System Architecture (v5, `5.0.x-dev`)

| | |
|---|---|
| **Document** | System architecture |
| **Repository location** | `spec/architecture/architecture.md` |
| **Status** | Binding specification — Milestone 3 signed off (2026-07-07) |
| **Companions** | `content-model.md` (content types + Drupal field mapping — the data contract), `api-contract.md` (read/interface surface) |
| **Grounding** | Prior v5 proposals (stack-migration, front-end/theme) and the v2 code/schema (`I8_Songs`) |

> **Purpose.** This document fixes the module layout, the **dependency rule**, the data model, and the
> key flows. Where code and this document disagree on structure, this document wins. The detailed
> field-level data contract lives in `content-model.md`; the read/interface surface in
> `api-contract.md`. The dependency rule here is enforced by tooling in the scaffolding milestone.

---

## 1. Architectural overview

Interstate-8 v5 is a **Drupal 11 monolith**, developed locally on **Lando**, rebuilding the v2 archive
one vertical slice at a time. Content enters through the **Migrate API** from the v2 MySQL dump (the
sole source of truth); it is stored in Drupal's entity/field system; it is presented through an owned,
code-first theme.

The single most important structural decision (from the front-end/theme proposal): **the uniform,
structured archive pages are themed in code** — Drupal **view modes + Twig overrides + SDC
components**, styled with **Tailwind v4** over **CSS-custom-property design tokens** — rather than
composed in Layout Builder. **Layout Builder is reserved for bespoke editorial pages — the `page`
content type, and nothing else** (`content-model.md` §9.1, settled at M12). Keeping entity pages
code-themed keeps the future JSON surface clean and the site page-builder-agnostic.

> **The line, since it is the one people get wrong.** It is **not** "Layout Builder for one page" — it is
> *Layout Builder for the kind of content that is composed, never for the kind that is structured.* The
> homepage, About, Terms and Privacy are the former; songs, releases, setlists and news are the latter.
> Slice 1 stated this as "only the home page" because `page` did not exist yet.

For slice 1 the concrete surface is: the **Song** content type, a **Song type** taxonomy, a Migrate
source plugin for Songs, a Songs **landing** (a View) and a **song page** (a view mode + Twig),
including the parent/version side-by-side lyrics behaviour.

---

## 2. Component breakdown

### 2.1 Module layout and the dependency rule

Kept **identical to the root `CLAUDE.md`**. The Drupal-oriented layering, settled at this milestone:

```
content-model → services → theme,   with  migration  populating  content-model
```

| Layer | May import / depend on | Notes |
|-------|------------------------|-------|
| `content-model/` | (nothing project-internal) | Entity, field, content-type and taxonomy definitions (Drupal config). The data foundation. |
| `migration/` | `content-model` | Migrate API source/process plugins populating the content model from the v2 MySQL dump. |
| `default-content/` | `content-model` | *(slice 2, M12.)* The seeded install content — menu links, the hero blocks, the homepage node and its layout — shipped via the `default_content` module (`content-model.md` §11). A **sibling of `migration`**: both populate the content model from outside and depend only on its definitions. Distinct from `migration` because its source is the repository rather than the v2 dump, and it runs at install rather than on demand. |
| `services/` | `content-model` | Custom-module logic (e.g. filter/sort helpers, version-display logic). |
| `theme/` | consumes rendered content | SDC components, Twig templates, Tailwind. **Nothing imports `theme`.** |
| `config/`, `tooling/`, `docs/` | cross-cutting | Exported config, build/test tooling, documentation. |

**The dependency rule (enforced, not aspirational).** `content-model → services → theme`, with
`migration` **and `default-content`** depending only on `content-model`, and nothing importing `theme`.
This is checked by a boundary tool wired in during the **scaffolding milestone** (§8), and the ticket
`depends_on` graph (`spec/tickets/CONVENTIONS.md`) must respect the same ordering. A violation fails the
default gate.

> **`default-content` is new at M12** and the boundary check does not know about it yet. Teaching
> `tooling/check-boundary.sh` the new layer is **M17 tooling work**, not part of a feature ticket — the
> same reasoning that puts the Composer standardisation there.

### 2.2 Content model (the foundation)

Drupal configuration: content types, fields, and taxonomy vocabularies. It imports nothing
project-internal and is the base every other layer builds on. The slice-1 detail — the **Song**
content type and **Song type** taxonomy, their exact field types, and the version self-reference — is
specified in `content-model.md`. Per the project non-negotiable, this config is **generated via the
Drupal admin UI/API and exported**, then verified against `content-model.md` — never hand-authored.

### 2.3 Migration layer

Migrate API source plugins reading the v2 MySQL directly (Path A), porting and improving the v3 plugin
set. **Slice 1 = Songs + SongType only.** Responsibilities: map `I8_Songs` → the Song content type and
`I8_SongType` → the Song type taxonomy; preserve the `FK_Song_ID` self-reference (FR-3); apply the
legacy rich-text cleanup (FR-21) as a process step; be **idempotent and rollbackable** (FR-4),
keyed on the v2 primary key. No custom migration tests where the Migrate module's own mechanisms
suffice (NFR-3).

### 2.4 Services

Thin in slice 1. The custom logic amounts to the landing's article-insensitive sort key (FR-8), the
type/alternate-titles filters (FR-9/FR-10) — mostly expressible as a **View** with an exposed filter —
and the parent/version resolution for the song page (FR-13/FR-20). Anything not naturally a View lives
in a small custom module under `services`.

### 2.5 Theme (front end)

An **owned theme built on the starterkit model** (not a subtheme of Olivero, not a contrib Tailwind
base), with **SDC** as the component layer, **Tailwind v4** wired by hand (CSS-first `@theme`, no
SASS), and **design tokens as CSS custom properties** as the single source of truth. The **Songs
landing** is a View rendered through SDC; the **song page** is a dedicated view mode + Twig override.
Accessibility is **structural and day-one** (semantic markup, heading order, labelled filter controls,
visible focus, token-level contrast) to meet NFR-1 (WCAG 2.1 AA). Interactivity in slice 1 is minimal
(filter submits); the broader JS ceiling (Drupal behaviours + vanilla / Alpine) is deferred, not needed
here.

**Theme provenance (INT8-034).** The theme was hand-scaffolded rather than run through core's
`generate-theme` script (INT8-005: the script is incompatible with the recommended-project vendor
layout). It correctly carries `'base theme': false` — the starterkit model's whole point, since it
means the theme owns its markup and core can never change it underneath the theme — but the manual
scaffold skipped the other half of that bargain: the generator normally **copies its ~84 templates
into the theme** so there is markup to own. This theme has only its own few hand-added overrides;
everything else falls through to Drupal core's module-level templates, which are deliberately
class-less.

Measured, not assumed: of starterkit's 84 templates, 77 differ in content from the module-level
fallback the theme actually renders, and 7 have no module fallback at all (those degrade to a generic
template — `block.html.twig`, `links.html.twig`, `item-list.html.twig`, `field.html.twig`). The
accessibility semantics are **not** part of the gap — `role="contentinfo"`, `aria-label`,
`aria-labelledby`, `aria-current` and the visually-hidden pagination heading are already present in
core's module templates; starterkit's own additions on the a11y-sensitive templates
(`status-messages`, `pager`, `views-mini-pager`, `item-list`) are purely CSS hooks, which a
Tailwind + SDC theme mostly does not need. Bulk-copying all 84 templates was assessed and rejected as
net-negative — it would import a maintenance surface the theme does not use.

What *is* load-bearing is the small set of templates whose classes carry **state**, not decoration:

| Starterkit template | State class | Status |
|---|---|---|
| `navigation/menu.html.twig` | `menu-item--active-trail` | **Restored** (INT8-034) — the missing hook that made the INT8-031 investigation expensive |
| `navigation/pager.html.twig` | `pager__item is-active` | Deferred — see trigger below |
| `views/views-mini-pager.html.twig` | `pager__item is-active` | Deferred — see trigger below |
| `dataset/table.html.twig` | `is-active` on the sorted column | Not needed — no sortable table View exists |
| `navigation/menu-local-task.html.twig` | `is-active` tab | Not needed — admin runs on Gin; no local-tasks block is placed on the front end |
| `views/views-view-summary*.html.twig` | `is-active` | Not needed — no summary/attachment display exists |

**Named trigger.** When the first paginated View lands (discography, tour dates or news, whichever
ships first — no View paginates today; `config/sync/views.view.songs.yml` sets `pager: type: none`),
that ticket must copy `navigation/pager.html.twig` and `views/views-mini-pager.html.twig` into the
theme as part of its own work, and test the `pager__item is-active` marking against a real pager.

---

## 3. Data model

### 3.1 Entities (slice 1)

The authoritative field-by-field mapping is in `content-model.md`; this is the overview.

| Entity | Field (logical) | Kind | Notes |
|--------|-----------------|------|-------|
| **Song** | Title | text | The song name; sort/display key (FR-8). |
| | Lyrics | rich text | Normalised on import (FR-21). |
| | Notes | rich text | Normalised on import (FR-21). |
| | Quotes | rich text | Normalised on import (FR-21). |
| | Music video | media/embed | From `Song_Video` (FR-17); Core Media *Remote video* via `field_video`, import descoped to manual pre-launch entry (`content-model.md` §4). |
| | Song type | reference → Song type taxonomy | The band/group (FR-9). |
| | Parent song | self-reference → Song | Makes this an alternate version (FR-13/FR-20). |
| | Lyrics same as parent | boolean | Drives the "[same as normal version]" display (FR-20). |
| | Exclude from list | boolean | v2 `Song_Live`; hides the song from the landing (FR-6). Shipped as `field_exclude_from_list`. |
| | Legacy id | integer (indexed) | v2 `PK_Song_ID`; cross-cutting convention (§3.3). |
| **Song type** | Name | taxonomy term | e.g. Modest Mouse, Ugly Casanova, Side Projects, Covers (§2.1 of requirements). |
| **Page** *(slice 2)* | Title | node title | Bespoke editorial pages — the homepage, and later About/Terms/Privacy. Not rendered as the homepage's visible heading (`content-model.md` §9). |
| | Body | rich text | Restricted HTML. Optional; the homepage may leave it empty. |
| | *(layout)* | `layout_builder__layout` | Per-node Layout Builder override — **content, not config** (`content-model.md` §9.1). |
| **Homepage hero** *(slice 2)* | Message | rich text | The set editorial line (FR-23). The only new field the slice's hero needs. |
| | Background images | reference → Media (image), unlimited | **Shared storage** with `page_hero`; rendered by the existing `i8_hero_background` formatter (FR-25). |

**Deferred seams.** The deferred relationships (a song's releases, live performances, tabs, studio
sessions) are **inbound** from other entities not built in slice 1, so the Song type needs no seam
fields for them now. The `setlistfm_id` seam belongs on the tour-date entity, not Song.

### 3.2 Storage

Drupal's entity/field storage on MySQL (via Lando). No bespoke storage. Legacy media assets are handled
by Core Media in later slices; slice 1's only media is the song video (see `content-model.md`).

### 3.3 Legacy identifiers (cross-cutting convention)

**Every migrated content entity carries a permanent `field_legacy_id`** holding its v2 primary key.
It is populated by migration for all imported content (empty for content created natively in v5) and
is indexed. Two runtime purposes justify it beyond the (transient) Migrate map:

1. **Cross-entity join repair.** Later slices import data that references songs/releases/etc. by their
   v2 key; the persistent legacy id lets those migrations resolve the reference to the right v5 entity.
2. **Legacy URL and inline-link redirects.** Old URLs (`songlist.php?songid=N`) and rich-text links in
   later-migrated content are redirected to the correct v5 entity via the **Redirect** module,
   preserving link equity instead of 404ing. *Building these redirects is **deferred to a future SEO
   slice**; slice 1 captures only the enabling `field_legacy_id`.*

Because v2 primary keys are unique only *within* a table, resolution keys on **entity type + legacy
id**. Detailed per-entity mapping is in `content-model.md`.

---

## 4. Key flows

### 4.1 Songs migration (FR-1–FR-5, FR-21)

1. `migration` — a Migrate source plugin reads active `I8_Songs` / `I8_SongType` rows from the v2 dump.
2. `migration` — process steps map fields, resolve `FK_SongType_ID` and the `FK_Song_ID` self-reference, and apply the rich-text cleanup (FR-21).
3. `content-model` — rows land as Song nodes / Song type terms, keyed on the v2 PK for idempotency (FR-4).
4. Verification — imported count equals source active count; spot-checks (FR-5).

### 4.2 Songs landing render (FR-6–FR-11, FR-8, FR-9)

1. `services`/View — query Songs, **excluding `Song_Live = 1`** (FR-6), ordered by the article-insensitive sort key (FR-8), filtered by Song type (default **Modest Mouse**, FR-9) and the Alternate-titles filter (FR-10). *Released*/*Played live* controls are shown non-functional (FR-11).
2. `theme` — render the list as links through an SDC component; mark alternates.

### 4.3 Song page render (FR-12–FR-17, FR-20)

1. `content-model`/`services` — load the song; if it has a **parent** (`FK_Song_ID`), load the parent's lyrics for the side-by-side display (FR-20); resolve child versions for a parent (FR-13).
2. `theme` — view mode + Twig render name, quotes, lyrics (or alt-vs-normal side-by-side), notes, and the embedded video (FR-17). Type/group is **not** shown (FR-12). Deferred sections (releases, live, tabs, studio) are omitted (FR-14).

---

### 4.4 Homepage render (FR-22–FR-25) — slice 2

1. `content-model` — `system.site.yml`'s `front` resolves to the homepage **`page` node**'s stable path
   alias (`content-model.md` §11.4). The `INT8-017` stub controller, its route and the `/home` value are
   gone (FR-22).
2. `content-model` — the node's `layout_builder__layout` field supplies the composition (per-node
   override, `content-model.md` §9.1), referencing the reusable **`homepage_hero`** block.
3. `services` — `HeroBackgroundFormatter` renders one deterministic background candidate and emits the
   full candidate set for the client-side reroll (FR-25), exactly as it already does for `page_hero`.
4. `theme` — the hero renders its `field_message` (FR-23); the site header renders in its
   `site-header--transparent` variant, solidifying past 24px (FR-24). The `page_hero` region block does
   **not** render here — its `<front>` exclusion holds (`content-model.md` §10.2).

### 4.5 Fresh-install content seeding (NFR-9, NFR-10) — slice 2

1. `site-install` → `config:import` — brings up the site and its **configuration**, including the block
   placements that reference content by UUID.
2. `default-content` — installing the owned default-content module imports the seeded entities **by
   UUID** (`content-model.md` §11.2), so those config references resolve.
3. **Nothing re-runs.** Later deployments and config imports do not re-import content, so operator edits
   survive (NFR-10, `content-model.md` §11.3).

---

## 5. Startup and runtime topology

Local development is **Lando** (nginx + PHP-FPM + MySQL). `lando start` brings the environment up in one
command; `lando composer install` installs pinned PHP dependencies; `lando drush uli` opens the site;
`lando npm run watch` runs the theme build once scaffolded. Drush runs inside Lando (`lando drush`). The
default gate is `lando test` (PHPUnit + PHPCS + PHPStan on custom code + the boundary check; see
test-strategy §2.2). Production hosting is out of scope for `5.0.x-dev` (VPS-lean, Pantheon
late-bindable per the stack proposal).

---

## 6. Technology choices

Settled in the prior proposals; made contractual here.

| Area | Choice | Rationale / exclusions |
|------|--------|------------------------|
| Platform | **Drupal 11** on PHP | Maintainable upgrade path (the v2 PHP-5 EOL trap). |
| Local dev | **Lando** | Switched from DDEV: runs natively on Windows, no WSL/mutagen overhead, proven stable on this machine. |
| Migration | **Migrate API**, Path A (v2 dump sole source) | Porting the v3 plugin set; external services are not a v5 source. |
| Content editing | Core entity/field + **Gin** admin theme | Faster editing than v2. |
| Media | **Core Media** | Nothing to install; modelling is the work (later slices). |
| Search | **Search API + DB backend** — **deferred** | Not in slice 1; a View covers the landing (lazy adoption). |
| URLs | **Pathauto + Redirect** | Clean URLs now; the v2→v5 path map itself is **deferred to a future SEO slice** (§3.3). |
| Theme | **Owned starterkit theme**, **SDC**, **Tailwind v4** (no SASS), **CSS-custom-property tokens** | Own the stack, minimise contrib. |
| Layout | **Code-theme archive entity pages**; **Layout Builder on the `page` content type only**, with per-node override | *Amended M12 (`D-h`).* Bespoke editorial pages (home, About, Terms, Privacy) are composed; archive entities are structured and must not acquire per-instance variance. See `content-model.md` §9.1 for the scoping table and the cost of override. |
| Default content | **`default_content` 2.x**, seeded once on module install | *Added M12 (`D-d`).* Makes a fresh install reproducible (NFR-9) while leaving content editable afterwards (NFR-10). Chosen on **UUID preservation**, which exported config requires. Beta; install-time dependency only — see `content-model.md` §11.1. |
| Excluded | Layout Builder on **archive** content types (`song`, and later releases/setlists/news), **Drupal Canvas** (immature), **SASS**, **React/headless**, contrib Tailwind base themes | *Exclusion sharpened M12:* it was "entity pages", which `page` is too — the real bar is structured-vs-composed. Reversible "not now" where relevant (all SDC underneath). |

Pinned majors: Drupal 11, Tailwind v4. Keep this section in step with the root `CLAUDE.md` *Stack*.

---

## 7. Decisions log

> Dated record of changes to this document — what changed and why. Append per amendment.
>
> **Started 2026-08-01, not backfilled.** `content-model.md`, `design-system.md` and
> `wireframes/overview.md` have carried a log since their milestones; this document did not, so the
> Milestone 3 decisions are recorded in §6's *Rationale / exclusions* column and in the milestone's
> sign-off rather than here. The log runs forward from this entry.

- **2026-08-02** — **Slice 2 architecture deltas (Milestone 12).** The content-model detail and the full
  reasoning for `D-h`/`D-b`/`D-d` live in `content-model.md` §9–§11 and its own log; recorded here are the
  four changes to *this* document:
  - **§1 and §6 — the Layout Builder line moved from a page to a content type.** It read *"Layout Builder
    only for the home page"*; it now reads **"the `page` content type only, and nothing else"**. This is a
    **widening in letter and a tightening in principle**: slice 1 could say "one page" because `page` did
    not exist, but the real bar was always *composed vs structured* content, and stating it that way is
    what makes it enforceable when About and Terms arrive. The **binding half is the exclusion** — Layout
    Builder never on `song` or any later archive type, because per-instance layout variance on structured
    content is what would dirty the future JSON surface (§1).
  - **§6's *Excluded* row sharpened** from "Layout Builder for entity pages" — `page` is an entity page
    too, so the old wording now excluded the very thing §6 permits.
  - **§2.1 — new `default-content/` layer**, a sibling of `migration`: both populate `content-model` from
    outside and depend on nothing else. Kept separate from `migration` because its source is the
    repository rather than the v2 dump and it runs at install rather than on demand. **The boundary check
    does not know this layer yet** — teaching `tooling/check-boundary.sh` about it is **M17 tooling
    work**, flagged in §2.1 so it cannot be quietly absorbed into a feature ticket.
  - **§4.4/§4.5 — two new flows**, the homepage render and fresh-install seeding, so every slice-2 `FR`
    and `NFR` has a traced path through the layers as §4's other flows do.
- **2026-08-01** — **Dropped "provisional" from §2.1.** The layering was described as *"Provisional
  Drupal-oriented layering, finalised here"*, which contradicted itself, and the root `CLAUDE.md` and
  `spec/tickets/CONVENTIONS.md` §3 both said the layer set would be *"finalised in the Architecture
  milestone"* — future tense, for a milestone signed off on 2026-07-11. The layering itself is
  **unchanged**: `content-model → services → theme`, `migration → content-model`, nothing imports
  `theme`. Only the label changed, in all three places at once, so the three stay identical as §2.1
  requires. Prompted by the v1.4.3 kit update's rule that anything temporary must name the condition
  that retires it — this one's condition had been met for three weeks. (Operator approval, 2026-08-01.)
- **2026-08-02** — **Corrected two stale cells in §3.1's data-model table (INT8-044).** Both described
  a state the project had already left behind:
  - **Music video** read *"modelling TBD in `content-model.md`"*. `content-model.md` §4 settled this on
    2026-07-07 and revised it at INT8-013: Core Media *Remote video* entities referenced by `field_video`
    (oEmbed). Because v2 `Song_Video` stored raw embed markup rather than a bare URL, `content-model.md`
    §9's 2026-07-19 entry descoped the import to **manual, pre-launch entry**; §8's source-mapping table
    already read *"not imported — `field_video` populated manually, pre-launch"*.
  - **Exclude from list** read *"Rename pending"*. The rename shipped at INT8-010: `field_exclude_from_list`
    exists in exported config (`field.storage.node.field_exclude_from_list.yml`), the migration
    (`migrate_plus.migration.song.yml:75`) and `views.view.songs.yml`'s filter.
  Neither decision is reopened — both were correct and complete in `content-model.md`; only this
  document's overview table had not caught up. (`sfk-verify` finding, 2026-08-01; corrected 2026-08-02.)
