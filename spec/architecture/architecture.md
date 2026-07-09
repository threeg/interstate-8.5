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

Interstate-8 v5 is a **Drupal 11 monolith**, developed locally on **DDEV**, rebuilding the v2 archive
one vertical slice at a time. Content enters through the **Migrate API** from the v2 MySQL dump (the
sole source of truth); it is stored in Drupal's entity/field system; it is presented through an owned,
code-first theme.

The single most important structural decision (from the front-end/theme proposal): **the uniform,
structured archive pages are themed in code** — Drupal **view modes + Twig overrides + SDC
components**, styled with **Tailwind v4** over **CSS-custom-property design tokens** — rather than
composed in Layout Builder. Layout Builder is reserved for the one genuinely bespoke page (the home
page), which is design-only in slice 1. Keeping entity pages code-themed keeps the future JSON surface
clean and the site page-builder-agnostic.

For slice 1 the concrete surface is: the **Song** content type, a **Song type** taxonomy, a Migrate
source plugin for Songs, a Songs **landing** (a View) and a **song page** (a view mode + Twig),
including the parent/version side-by-side lyrics behaviour.

---

## 2. Component breakdown

### 2.1 Module layout and the dependency rule

Kept **identical to the root `CLAUDE.md`**. Provisional Drupal-oriented layering, finalised here:

```
content-model → services → theme,   with  migration  populating  content-model
```

| Layer | May import / depend on | Notes |
|-------|------------------------|-------|
| `content-model/` | (nothing project-internal) | Entity, field, content-type and taxonomy definitions (Drupal config). The data foundation. |
| `migration/` | `content-model` | Migrate API source/process plugins populating the content model from the v2 MySQL dump. |
| `services/` | `content-model` | Custom-module logic (e.g. filter/sort helpers, version-display logic). |
| `theme/` | consumes rendered content | SDC components, Twig templates, Tailwind. **Nothing imports `theme`.** |
| `config/`, `tooling/`, `docs/` | cross-cutting | Exported config, build/test tooling, documentation. |

**The dependency rule (enforced, not aspirational).** `content-model → services → theme`, with
`migration` depending only on `content-model` and nothing importing `theme`. This is checked by a
boundary tool wired in during the **scaffolding milestone** (§8), and the ticket `depends_on` graph
(`spec/tickets/CONVENTIONS.md`) must respect the same ordering. A violation fails the default gate.

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

An **owned starterkit-generated theme** (not a subtheme of Olivero, not a contrib Tailwind base),
with **SDC** as the component layer, **Tailwind v4** wired by hand (CSS-first `@theme`, no SASS), and
**design tokens as CSS custom properties** as the single source of truth. The **Songs landing** is a
View rendered through SDC; the **song page** is a dedicated view mode + Twig override. Accessibility is
**structural and day-one** (semantic markup, heading order, labelled filter controls, visible focus,
token-level contrast) to meet NFR-1 (WCAG 2.1 AA). Interactivity in slice 1 is minimal (filter
submits); the broader JS ceiling (Drupal behaviours + vanilla / Alpine) is deferred, not needed here.

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
| | Music video | media/embed | From `Song_Video` (FR-17); modelling TBD in `content-model.md`. |
| | Song type | reference → Song type taxonomy | The band/group (FR-9). |
| | Parent song | self-reference → Song | Makes this an alternate version (FR-13/FR-20). |
| | Lyrics same as parent | boolean | Drives the "[same as normal version]" display (FR-20). |
| | Exclude from list | boolean | v2 `Song_Live`; hides the song from the landing (FR-6). Rename pending. |
| | Legacy id | integer (indexed) | v2 `PK_Song_ID`; cross-cutting convention (§3.3). |
| **Song type** | Name | taxonomy term | e.g. Modest Mouse, Ugly Casanova, Side projects, Covers (§2.1 of requirements). |

**Deferred seams.** The deferred relationships (a song's releases, live performances, tabs, studio
sessions) are **inbound** from other entities not built in slice 1, so the Song type needs no seam
fields for them now. The `setlistfm_id` seam belongs on the tour-date entity, not Song.

### 3.2 Storage

Drupal's entity/field storage on MySQL (via DDEV). No bespoke storage. Legacy media assets are handled
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

## 5. Startup and runtime topology

Local development is **DDEV** (nginx + PHP-FPM + MySQL). `ddev start` brings the environment up in one
command; `ddev composer install` installs pinned PHP dependencies; `ddev launch` opens the site;
`ddev npm run watch` runs the theme build once scaffolded. Drush runs inside DDEV (`ddev drush`). The
default gate is `ddev exec phpunit`. Production hosting is out of scope for `5.0.x-dev` (VPS-lean,
Pantheon late-bindable per the stack proposal).

---

## 6. Technology choices

Settled in the prior proposals; made contractual here.

| Area | Choice | Rationale / exclusions |
|------|--------|------------------------|
| Platform | **Drupal 11** on PHP | Maintainable upgrade path (the v2 PHP-5 EOL trap). |
| Local dev | **DDEV** | Over Lando; single-command environment. |
| Migration | **Migrate API**, Path A (v2 dump sole source) | Porting the v3 plugin set; external services are not a v5 source. |
| Content editing | Core entity/field + **Gin** admin theme | Faster editing than v2. |
| Media | **Core Media** | Nothing to install; modelling is the work (later slices). |
| Search | **Search API + DB backend** — **deferred** | Not in slice 1; a View covers the landing (lazy adoption). |
| URLs | **Pathauto + Redirect** | Preserve the v2→v5 path map at migration (link equity). |
| Theme | **Owned starterkit theme**, **SDC**, **Tailwind v4** (no SASS), **CSS-custom-property tokens** | Own the stack, minimise contrib. |
| Layout | **Code-theme entity pages**; **Layout Builder only for the home page** | No per-instance variance on archive pages; keep the entity API clean. |
| Excluded | Layout Builder for entity pages, **Drupal Canvas** (immature), **SASS**, **React/headless**, contrib Tailwind base themes | Reversible "not now" where relevant (all SDC underneath). |

Pinned majors: Drupal 11, Tailwind v4. Keep this section in step with the root `CLAUDE.md` *Stack*.
