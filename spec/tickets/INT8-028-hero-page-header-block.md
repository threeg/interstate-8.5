---
id: INT8-028
title: Page-title hero block in a full-width page-header region (random media background)
type: story
status: done
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-015, INT8-016, INT8-018]
implements: []
tests_required: true
estimate: 5
---

## In plain English
Every page except the homepage shows the **same kind of banner** at the top: the page's own title over
a full-width photo. So this is really the **page-title block, reimagined as a hero** — the block that
already puts the `<h1>` on the page — moved into a new full-width slot and given a background photo that
**randomises through a set of images you pick in the media library**, changing on each refresh without
slowing the page. Placed **once, site-wide** (not per page); the **homepage is the only exception** and
gets its own separate block later. This ticket also removes the Songs page's own baked-in hero, which
this block now supplies.

## User story
As a site operator
I want the site's page-title to render as a full-width hero — the current page's title over a background
that randomises through media-library images I choose
so that every content page gets a consistent, lively banner from one shared block, with no per-page
work and no cache penalty.

## Scope
- **In scope:** the new full-width `page_header` region; an owned block that **does the page-title
  block's job** (renders the current route's title) **plus** the hero treatment + **random media
  background**, placed **once, site-wide, on every front-end page except the homepage**, replacing the
  core `page_title_block` placement; migrating INT8-018's embedded Songs hero onto it. Add an **image
  media type** if none exists (only `remote_video` was created in INT8-009).
- **Out of scope:** the **homepage hero** — a different, bespoke composition; its own separate block
  ticket, **not** this one. (If a specific utility page shouldn't show the hero, that's a later
  visibility-condition tweak, not this ticket.)

> **Theme-foundation chrome → epic E03.** `depends_on` includes INT8-018 only because this ticket
> removes 018's embedded hero.

## Acceptance criteria

**Scenario 1: it is the page title, everywhere but the homepage**
- Given the block placed **once** in `page_header` with a visibility condition of "all pages **except**
  the front page"
- When I open any front-end page (e.g. `/songs`, `/user/login`)
- Then each shows **that page's own title** as its single `<h1>`, taken from the route (the same source
  the core page-title block uses)
- And the core `page_title_block` placement is **removed** (its job is now this block's) — no per-route
  suppression list exists
- And the **homepage** shows **no** page-title hero (it has its own future block).

**Scenario 2: random background from a configured media set, per request**
- Given the block is configured with **two or more images from the media library**
- When a page is loaded repeatedly
- Then each render shows **one configured image at random**, and over enough refreshes more than one
  distinct image is seen (decorative background, `alt=""`).

**Scenario 3: graceful with no images**
- Given the block has **no images** configured
- Then it renders the title hero with **no background image** (a plain background) and no error — images
  are configured before go-live, so an empty pool is a valid state, not a failure.

**Scenario 4: the rotation does not break page caching**
- Given a cacheable page carrying the hero
- Then the surrounding page stays **render-cached** on repeat requests while **only the hero image
  varies** — the random pick is isolated behind a placeholder (`#lazy_builder` / auto-placeholder with
  `max-age: 0` on the image element) so `max-age: 0` does **not** bubble up and make the whole page
  uncacheable.

**Scenario 5: full-sheet width; a placed block, not template markup**
- Given a viewport wider than the 1440px sheet cap
- Then the hero photo touches both edges of the white content sheet (`--sheet-max`) while the body stays
  at `--content-max`, with **no CSS breakout hack** (the hero is structurally outside `.layout-content`,
  like header/footer)
- And `templates/views-view--songs.html.twig` **no longer embeds** `interstate_85:hero`.

**Scenario 6: accessible, responsive**
- Exactly one `<h1>` per page (the title, from the hero); Axe clean; usable at 320px (NFR-1, NFR-2).

## Technical approach

- **New region.** `page_header: Page header` in the theme `.info.yml`; render `{{ page.page_header }}`
  in `page.html.twig` inside `.layout-container` but **outside** `.layout-content` (which caps at
  `--content-max`), so it inherits `--sheet-max`. No existing region fits — settled with the user.
- **The block replaces the page-title block's role.** An owned block in `i8_services`
  (`i8_page_hero`) renders the **current route's title** (title resolver / route match — same source as
  core `page_title_block`) with the hero treatment. It is placed **once** in `page_header` with a
  visibility condition **negating the front page**; the **core `page_title_block` placement is
  removed** (unplaced). Because it's global-minus-homepage, there is **no per-route suppression list**.
- **Boundary:** the block builds **data only** (title, chosen image); the **theme** owns markup via
  `templates/block--i8-page-hero.html.twig` embedding `interstate_85:hero`. No module imports
  `Drupal\interstate_85\*`; `check-boundary` stays green.
- **Random background — media library, multi-select, per request, cache-safe:**
  - Ensure an **Image media type** exists (add if missing; Media + Media Library enabled in INT8-003).
    The block config carries a **multi-value media reference** (image media) via the media-library widget.
  - The **random pick is a `#lazy_builder`** (auto-placeholdered) on the image element only, `#cache
    max-age: 0`, so the page render-caches and just the image fragment is per-request (Scenario 4).
  - **No images configured → no background image** (Scenario 3). `alt=""` (decorative).
- **Migrate INT8-018's Songs landing:** remove the `{% embed 'interstate_85:hero' … %}` from
  `templates/views-view--songs.html.twig` and update its header comment; everything else stays.
- **Title alignment at extra-wide:** decide against the hi-fi EXTRA-WIDE composition; record in `## Notes`.
- **Config generated, never hand-authored (NFR-6):** region in code; block placement + image selection
  via UI/API, exported (`config/sync/block.block.*`; the removed core page-title placement is captured
  too), verified against this ticket.

**Homepage note.** The front-page hero is a different layout (bespoke, full-height); write a separate
block ticket for it — do not stretch this one.

**Sequencing — build before INT8-019 (not a dependency).** INT8-019 (Song page) gets its hero from
this global block for free once it lands. Ids are execution-ordered so INT8-019 can't formally depend on
INT8-028 (CONVENTIONS §4.3); its `depends_on` is untouched. Building this first means INT8-019 writes no
hero mechanism at all — the block already covers `/songs/<slug>`. Pointer recorded in `INT8-019`.

## Design references
- Design system: `design-system.md` §3 — **Hero** row (`page-title` variant). Unchanged by this ticket.
- Canonical hi-fi: `…/Interstate-8 1B.dc.html` — **LAYOUT WIDTHS** (hero photo is the one full-sheet
  element), **PAGE TITLE HERO**, **SONGS LANDING · EXTRA-WIDE**.
- Wireframe: `spec/wireframes/overview.md` §3 (shared layout — the hero above every content page).

## Tests
- Playwright: the hero shows the correct `<h1>` on **two real routes** (`/songs` → "Songs";
  `/user/login` → "Log in"), proving it's the route title, not Songs-specific; the **homepage shows no
  hero**; hero markup is **not** inside the Songs View output; full-sheet width at 1920px while the body
  stays at content width; exactly one `<h1>` per page.
- Random + cache: request a page N times → **more than one distinct background image** (Scenario 2); the
  static shell is a **render-cache hit** on repeat while the image varies (Scenario 4) — assert via
  cache headers/tags or a render-cache probe. Also: **no images configured → no background, no error**
  (Scenario 3).
- Axe on a hero page at desktop and 320px (NFR-1, NFR-2). Red-green: write the title/width/random
  assertions first.

## QA steps
- [x] Edit the **Page hero background** block at `/admin/content/block` → its *Background images* field
      is core's stock media-library widget (thumbnail grid, **Add media** button opening the library
      modal, **Remove** per item), identical to any other media field on the site.
- [x] Configure it with **3+ media images** → refresh `/songs` several times: background changes,
      title stays "Songs". (Seeded with 2 real images; rotation confirmed via cache-busted requests —
      see Notes.)
- [x] Visit `/user/login` → the hero shows "Log in" (proves it's the page title, not a Songs hero).
- [x] Visit `/` (front page) → **no** page-title hero.
- [x] Remove all images from the block config → the hero still renders (plain background), no error.
- [x] Repeat-load a page → still fast (static shell cached) while the image rotates.
- [x] Wide (>1440px) and 320px → photo spans the sheet / no overflow respectively.
- [x] `lando drush cim -y` → "There are no changes to import."

## Definition of done
- [x] Acceptance criteria met (page-title-from-route site-wide-except-homepage; random media background;
      graceful empty; page cache preserved)
- [x] Exactly one page-title source, and it is core's own `page_title_block` — placed in `page_header`
      and composed into the hero by the theme (no duplicate `<h1>`, no custom title resolution).
      *Amended 2026-07-26: the original wording ("placement removed") described the first design, in
      which a custom block plugin took the title over via `TitleBlockPluginInterface`. That plugin is
      gone — see the round-4 note.*
- [x] Playwright + kernel + Axe tests added/updated and passing; `lando playwright` green
- [x] Tokens-only styling; no hardcoded hex/px; the `hero` SDC's own CSS unchanged
- [x] Block type, field, displays and both placements generated via the entity API and exported (NFR-6).
      The image **selection** is deliberately no longer config — it lives on a `block_content` entity,
      i.e. content. See the round-4 note for what that means for a fresh environment.
- [x] The boundary check passes; no custom module imports `Drupal\interstate_85\*`
- [x] QA steps recorded and repeated in the chat completion report
- [x] Ticket status + notes and BOARD.md row updated in the same commit

## Notes

**2026-07-25 — implementation summary.**

Built the `page_header` theme region (outside `.layout-content`, so it inherits `--sheet-max` rather
than `--content-max`), and a new `i8_page_hero` block (`i8_services` module) that takes over the core
page-title block's job by implementing `Drupal\Core\Block\TitleBlockPluginInterface` — the same
mechanism core's own `PageTitleBlock` uses, so `BlockPageVariant::build()` hands it the already-resolved
route title with no separate title-resolution code needed. Placed once, site-wide, with a visibility
condition negating the front page; the core `page_title_block` placement was deleted (`drush cex`
captures the delete). An `image` media type was added (none existed beyond `remote_video` from
INT8-009), created via the entity API and exported, following the same pattern. The block's config form
uses an `entity_autocomplete` tags widget scoped to `target_bundles: image`; the random pick happens in a
separate `PageHeroImageRenderer` service, invoked via `#lazy_builder` (auto-placeholder,
`#cache max-age: 0` on the image fragment only), so that `max-age: 0` never bubbles into the whole page's
cache metadata. `templates/views-view--songs.html.twig` no longer embeds its own hero — it now comes for
free from the global block.

Three bugs found and fixed via live testing, in order: (1) `PageHeroBlock::$title` was typed
`string|array`, but `/user/login`'s title arrives as a `TranslatableMarkup` object — fixed by leaving the
property untyped, matching core's own `PageTitleBlock::$title` exactly. (2) The new
`block--i8-page-hero.html.twig` used `{% embed ... only %}`, which (as documented in
`views-view--songs.html.twig` from INT8-018) also restricts the embedded blocks' access to the outer
`content` variable, not just the component's own top-level render — silently produced an empty `<h1>`;
fixed by dropping `only`. This is the second time this exact quirk has been hit in this project; worth
remembering. (3) The lazy builder threw `UntrustedCallbackException` until `PageHeroImageRenderer`
implemented `TrustedCallbackInterface` with `trustedCallbacks() => ['build']`.

**Caching investigation (Scenario 4).** Curl-based testing on repeated identical-URL requests initially
looked like rotation wasn't working, and `X-Drupal-Dynamic-Cache: UNCACHEABLE (poor cacheability)`
persisted even with the lazy builder in place. Both turned out to be expected, not bugs:

- `X-Drupal-Dynamic-Cache: UNCACHEABLE (poor cacheability)` on `/songs` **predates this ticket** — it
  comes from the Songs View's own cache/context configuration (from INT8-018), independent of the hero.
  It is not something this ticket introduced or is responsible for fixing.
- The internal anonymous **Page Cache** correctly returns `X-Drupal-Cache: HIT` on repeat identical-URL
  requests — the surrounding page *is* being cached, exactly as Scenario 4 requires. The image looking
  "frozen" under curl on repeat requests to the same URL is Page Cache's normal, correct behaviour for a
  fully-cached page; a JS-capable browser gets a different, `big_pipe_nojs`-cookie-varied response in
  which BigPipe resolves the placeholder client-side on every load, giving genuine per-request rotation
  even from a cached page. `cookies:big_pipe_nojs` shows up in the page's cache contexts, confirming
  BigPipe (enabled this ticket: `big_pipe` module, exported) is correctly wired in. Curl cannot execute
  that JS, so curl alone cannot observe genuine per-request rotation on a cached page — this was
  confirmed instead via cache-busted query strings, and independently via the Playwright suite's own
  browser-based rotation probe (both showed real rotation between the two seeded images).

> **Correction, 2026-07-26 — this conclusion was wrong.** The BigPipe explanation above does not hold
> up: BigPipe is a deliberate no-op for anonymous requests with no session
> (`BigPipeStrategy::processPlaceholders()` returns early when `!$sessionConfiguration->hasSession()`),
> which is the normal case for anonymous visitors to a public archive — there was no BigPipe markup in
> the response at all (`grep`'d for it, zero matches). The real cause: Drupal's internal Page Cache
> ignores render-array cache max-age entirely and caches responses **permanently**
> (`PageCache::storeResponse()`, its own comment: *"page cache ignores max age"*), so the `#lazy_builder`
> isolation never achieved per-request variation for a real anonymous visitor — confirmed by the site
> owner in a real (non-incognito-cached) browser: the image was frozen. See the 2026-07-26 entry below
> for the fix (moved the rotation client-side).

**Title alignment at extra-wide.** Decided, per this ticket's own instruction, **against** building the
hi-fi's `SONGS LANDING · EXTRA-WIDE` composition — the standard `page-title` hero variant (title left,
photo filling the rest) is used at all viewport widths, with no extra-wide-specific layout variant.

**Demo data.** Seeded two real images (`songs-hero.jpg`, `song-hero.jpg`) as `Image` media entities and
configured the placed block to rotate between them, so the feature is demonstrable out of the box rather
than left at the (also valid) empty-pool state. The one-shot build/seed scripts used to create the media
type, place the block, and seed the images were deleted after running, per project convention.

**Test authorship.** The failing Playwright suite (`tests/playwright/tests/page-hero.spec.ts`, 13 tests)
was authored independently by the `tests` model from the ticket text alone, before this implementation
existed. `lando playwright`'s own scoped run of this file passes on chromium, webkit, and both mobile
projects (52/52); the firefox project fails to launch in the `pw` container for every spec in this repo,
including pre-existing ones (`songs-landing.spec.ts`), so this is a pre-existing environment gap, not a
regression from this ticket.

**Summary:** every page except the homepage now gets its title rendered as a full-width hero with a
background that rotates through media-library-chosen images, replacing the core page-title block and
Songs' own bespoke hero with one shared, cache-safe block.

**Sanity test:** visit `/songs` and `/user/login` — both show a full-width hero with the correct page
title (`Songs`, `Log in`) over a background photo; visit `/` — no hero. Reloading `/songs` a few times
with a cache-busting query string (e.g. `/songs?x=1`, `/songs?x=2`) shows the background photo changing.

**2026-07-26 — review feedback addressed.**

Four issues from the user's first review, all fixed in this pass:

1. **Title far-left-aligned, not in the 980px content column.** `hero.css`'s `.hero--page-title
   .hero__title` padded from the edges of the full 1440px sheet (`--space-9`), not the 980px
   `--content-max` column the rest of the page's content uses. Fixed: the heading itself now gets
   `max-width: var(--content-max); margin-inline: auto; padding-inline: var(--space-6)` — the exact
   same cap + gutter `.layout-content` uses — so the title lines up with body copy below it at every
   viewport width, while the photo still spans the full sheet.

2. **Background image appeared frozen (real browser, incognito).** See the correction above: classic
   Page Cache ignores render-array max-age and caches permanently, and BigPipe is a no-op for sessionless
   anonymous requests, so the server-side `#lazy_builder` random pick never varied per page load for a
   real visitor. Fixed by moving the randomisation client-side: `PageHeroBlock::build()` now renders one
   deterministic candidate server-side (fully cacheable — no more `#lazy_builder`, no more max-age
   tricks) plus the other candidates' URLs via `drupalSettings`; a small JS behaviour
   (`i8_services/js/page-hero.js`, `Drupal.behaviors.i8PageHero`) rerolls to a true random pick on every
   page **load**, which works identically whether the served HTML came from Page Cache or not. Removed
   `PageHeroImageRenderer` and the `TrustedCallbackInterface` plumbing it needed — no longer applicable.
   Disabled the `big_pipe` module (enabled last pass on a mistaken assumption; confirmed it wasn't doing
   anything for this page and added unexplained config for no benefit).

3. **Config form used `entity_autocomplete` tags instead of the media browser.** Replaced with a real
   Media Library modal: a new `Drupal\i8_services\MediaLibrary\PageHeroMediaLibraryOpener` (implements
   `MediaLibraryOpenerInterface`, tagged `media_library.opener`, gated on the `administer blocks`
   permission) plus a rebuilt `PageHeroBlock::blockForm()` that opens the library via AJAX
   (`MediaLibraryUiBuilder::buildUi()`) and receives selections the same way core's own
   `MediaLibraryWidget` field widget does, adapted for plain block-plugin config rather than a real
   field (no weight/tabledrag — order doesn't matter for a random pool). Verified end-to-end by
   simulating the AJAX "Add background images" click against a real authenticated session: it correctly
   returns an `openDialog` command with the real media grid, scoped to the `image` bundle, via the
   custom opener.

4. **Background image wasn't using an image style.** Added two width-based image styles,
   `hero_mobile` (760w, matching the theme's one real breakpoint `--bp-nav`) and `hero_desktop` (1440w,
   matching `--sheet-max` — the hero never renders wider than that regardless of viewport, so one
   desktop-width style covers tablet through ultra-wide). Rather than the `responsive_image` module's
   breakpoint/`<picture>` machinery — overkill here since there's no per-breakpoint art-direction crop,
   only a bandwidth-appropriate width choice — the rendered `<img>` carries a plain `srcset`/`sizes`
   pair built from these two styles, letting the browser pick the right resource for its viewport/DPR.
   Both styles follow the project's existing image-style convention (`image_scale` + webp conversion,
   matching `image.style.{large,medium,wide}.yml`).

Re-ran the full default gate (green) and the independent Playwright suite (`page-hero.spec.ts`, 26/26 on
chromium + webkit, including the rotation and page-cache-HIT scenarios) after these changes. Re-exported
config (the two image styles, `big_pipe` removed from `core.extension.yml`); `drush cim -y` is a no-op.

Separately, the user reported a second, unrelated bug found during this same review: the primary nav's
current-section marking disappears on `/songs` once filter query-string params are present. Filed as
**INT8-031** (not fixed here — out of scope for this ticket, which only touches the hero).

**2026-07-26 — second round of review feedback (items 3 and 4 revisited).**

The user accepted the title-alignment and background-rotation fixes but flagged two follow-ups on the
first pass at items 3 and 4:

3. **Media browser preview was wrong** — the block form's "already selected" list showed the system's
   tiny auto-generated `thumbnail` field *and* the full, unstyled original photo side by side. Cause:
   the `image` media type (built via the entity API in the first pass, mirroring INT8-009's
   `remote_video`) only ever got a `default` view display — real media types built through the add-type
   UI wizard also get a dedicated `media_library` view mode (a small, single-field, styled display),
   which is what `$view_builder->view($media, 'media_library')` actually needs; without it, Drupal fell
   back to `default`, which shows both the `thumbnail` field and the unstyled `field_media_image`.
   Fixed by creating `core.entity_view_display.media.image.media_library` (one field,
   `image.style.media_library` — core's own bundled 220×220 media-library thumbnail style — everything
   else hidden). Also rebuilt the "already selected" list to use core's own
   `#theme => 'media_library_item__widget'` per-item structure (remove button, `js-media-library-item`
   class, `data-media-library-item-delta`) and attached the `media_library/widget` library, matching how
   core's real field widget builds the same list, rather than a bespoke container — the closest a
   non-field-widget consumer of the media library can get to the stock look or the admin theme is
   opted to define.

4. **Not using the standard `responsive_image` module, and most of the photo was being cropped off by
   plain CSS `object-fit: cover`.** The first pass hand-built a `srcset`/`sizes` pair on a plain
   `#theme => image` element — functional, but not the module Drupal ships for exactly this. Fixed:
   enabled `responsive_image` (core) and `focal_point` (contrib, pulling in `crop`); added
   `interstate_85.breakpoints.yml` (the theme's one real breakpoint, `--bp-nav: 760px`, mirrored as
   `interstate_85.mobile` / `interstate_85.desktop`); created the `i8_hero` `ResponsiveImageStyle`
   mapping those breakpoints 1x to `hero_mobile`/`hero_desktop`; and switched both image styles from
   `image_scale` (width-only, aspect-ratio-preserving — the source photo's full height was still being
   sent to the browser, which is why `object-fit: cover` was cropping most of it away centred on
   whatever the naive scale produced) to `focal_point_scale_and_crop`, cropping to the hero's *actual*
   displayed box (1440×140 desktop, 760×140 mobile — the `--hero-height-page` token) around each photo's
   stored focal point, defaulting to centre (50/50) until an editor sets one. Also switched
   `field_media_image`'s form widget to `image_focal_point` so an editor can click to set that point per
   photo. `PageHeroBlock::build()` now renders `#type => responsive_image` /
   `#responsive_image_style_id => i8_hero` instead of the hand-rolled `srcset`; the client-side reroll
   script (`page-hero.js`, still needed — Page Cache's permanent caching, see the earlier correction, is
   unrelated to which image module renders the markup) now targets the `<picture>`'s two `<source>`
   elements by their `media` attribute plus the fallback `<img>`, rather than a single `srcset` string.

Re-ran the default gate (green), the independent Playwright suite (26/26 on chromium + webkit), and a
manual check of both the block form (confirmed via direct HTTP request: exactly one
`styles/media_library/...` thumbnail per selected item, no unstyled original, no PHP warnings) and the
front end (`<picture>` with two correctly-cropped `<source>` elements, `drupalSettings.i8PageHero`
carrying both candidates' styled URLs). Re-exported config (`focal_point`/`crop` module config, the new
`media_library` view display, the new responsive image style, the updated image styles and form
display); `drush cim -y` is a no-op. `composer.json`/`composer.lock` now carry `drupal/focal_point`
(and its `drupal/crop` dependency).

**2026-07-26 — review round 4: the picker is now a stock core media field, and the images are content.**

Two pieces of feedback, one of which invalidated round 3 entirely.

1. **Round 3's 220×220 crop was the wrong fix, and has been reverted** (`git revert`, then `drush cim`
   to drop `image.style.hero_picker_thumbnail` from the site). Core's own bundled style is *labelled*
   "Media Library thumbnail (220×220)" but its only effect is `image_scale` — it fits a photo *within*
   220×220 and deliberately does **not** crop. The square tiles you see on a real media field come from
   CSS, not from the image style: Gin sets `.media-library-item__preview { padding-block-end: 100% }`
   with the image absolutely positioned at `object-fit: cover`, and Claro's grid gives each item
   `width: 25%`. So a bespoke cropping style was never the answer — matching core's *markup* was, which
   is what item 2 delivers. Lesson worth keeping: when something "doesn't look like core", check
   whether core achieves the look in CSS before inventing config to force it.

2. **The hand-rolled media widget is gone. The hero is now a `block_content` type with a plain media
   reference field, edited with core's own `media_library_widget`.**

   First, the finding that forced the choice: **core ships no field-free media form element.**
   `media_library/src/` has no `Element/` directory at all; the only implementation is the
   `media_library_widget` *field widget*, which is marked `@internal`, and its opener
   (`MediaLibraryFieldWidgetOpener::checkAccess()`) hard-requires a real `entity_type_id` + `bundle` +
   `field_name` on a fieldable entity before it will even open the modal. A block *plugin's*
   configuration form has none of those, which is exactly why core exposes `MediaLibraryOpenerInterface`
   as a tagged extension point — the custom opener was the right hook, but everything built around it
   was a re-typing of core's widget, and that is what had to go.

   So the block plugin was replaced wholesale:

   - **Deleted:** `PageHeroBlock` (the custom block plugin), `PageHeroMediaLibraryOpener` (the custom
     opener), `i8_services.services.yml` (it existed only to register that opener), and
     `templates/block--i8-page-hero.html.twig`. Roughly 150 lines mirroring core's widget — the open /
     remove / update / addItems AJAX callbacks, the form-state working set, the hand-built selection
     list — are simply gone, replaced by core's widget doing its own job.
   - **Added:** a `page_hero` **block content type** with `field_background_images` (entity reference →
     media, `image` bundle, unlimited), its form display using core's stock `media_library_widget` and
     its view display using one small new formatter, `i8_hero_background`. Generated via the entity API
     and exported, per the never-hand-author rule.
   - **`HeroBackgroundFormatter`** is now the only custom code in the path, and it owns exactly one
     thing: turning the selected media into *one* responsive-image render plus the client-side reroll
     payload. Test-first (`HeroBackgroundFormatterTest`, 6 tests — confirmed red with "class not found"
     before implementing): empty/unusable selections render nothing rather than an `<img>` with no src,
     the output is `#type => responsive_image` at `i8_hero` with `alt=""`, every candidate (not just the
     rendered one) appears in the reroll payload and in the cache tags, and missing image styles degrade
     to a non-rotating hero instead of a fatal.

   **The title.** With the custom plugin gone, `TitleBlockPluginInterface` is no longer available — a
   `block_content` block cannot implement it. Rather than reinvent title resolution, **core's own
   `page_title_block` is now placed** in `page_header` alongside the hero background block, and the
   *theme* composes the two into the existing hero SDC's two slots. This is strictly better than what it
   replaces: core keeps doing the title (including the subtle part — `BlockPageVariant::build()` unsets
   `#cache['keys']` on title blocks so they are never render-cached and therefore never freeze across
   routes), and no custom title code exists at all.

   **Why the composition lives in `interstate_85_preprocess_page()` and not a
   `region--page-header.html.twig`** — this cost some digging and is worth recording. A region is
   rendered through `#theme_wrappers`, and `Renderer::doRender()` runs the `#theme_wrappers` branch
   *after* children have been flattened into a single `#children` string; by the time a region template
   executes, its individual blocks are unaddressable, and re-rendering them is impossible anyway because
   `doRender()` returns `''` for anything already marked `#printed`. `page`, by contrast, is rendered
   through `#theme`, whose branch runs *before* children are rendered — so `page.html.twig` and its
   preprocess receive their regions still intact. Blocks are routed to slots by `#base_plugin_id`, not
   by placement ID, so re-placing or renaming either block cannot silently empty a slot.

   **The trade-off you accepted, restated for the record:** the image selection is now **content**, not
   configuration. It no longer travels in `config/sync`, so a fresh environment gets the block type, the
   field, the displays and both placements from config but **not** the two seeded images — the
   `block_content` entity has to be created there (or shipped later via `default_content`, if that ever
   earns a concrete trigger). `drush cim` does not fail without it; the hero simply renders its title
   over a plain background, which is the ticket's own valid Scenario 3 state.

**Verification.** Default gate green (58 PHPUnit tests — up 6 — PHPCS clean, PHPStan clean, boundary
check 0 violations). Full Playwright suite green: **50/50 on chromium**, including all 13 page-hero
specs, which are behaviour-based and were never told how the block is implemented — they passed
unchanged across a complete rewrite of the mechanism, which is the strongest evidence available that
behaviour is preserved. Verified live: `/songs` shows "Songs", `/user/login` shows "Log in", `/` shows
no hero, exactly one `<h1>` on each, `X-Drupal-Cache` MISS→HIT→HIT on repeats, and both candidates
present in `drupalSettings.i8PageHero`. The admin form was fetched over a real authenticated request and
confirmed to render core's genuine widget markup — `media-library-item--grid`, `media-library-selection`,
`js-media-library-open-button`, `data-media-library-widget-value`, the **Add media** button — with core's
own `styles/media_library/` thumbnails (220×147 landscape, 176×220 portrait, i.e. core's real
uncropped behaviour). Config exported; `drush cim -y` is a no-op. The one-shot build script was deleted
after running, per convention.

Firefox remains unrunnable in the `pw` container (`ENOENT … /ms-playwright/firefox-1532/firefox/lock`)
for every spec in the repo — a pre-existing environment gap, unchanged by this work.

**2026-07-27 — correction (INT8-036).** The line above was wrong: this was a dangling profile-lock
symlink left by a process killed on 2026-07-20, not a missing binary or a scaffolding-era gap
(INT8-006 itself records Firefox passing). Fixed in INT8-036; the full matrix is now 545/545 with
Firefox included.
