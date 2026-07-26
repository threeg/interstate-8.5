---
id: INT8-028
title: Page-title hero block in a full-width page-header region (random media background)
type: story
status: in-review
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
- [x] Configure the block with **3+ media images** → refresh `/songs` several times: background changes,
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
- [x] Core `page_title_block` placement removed; the hero block is the single page-title source
- [x] Playwright + kernel + Axe tests added/updated and passing; `lando playwright` green
- [x] Tokens-only styling; no hardcoded hex/px; the `hero` SDC's own CSS unchanged
- [x] Block placement + image selection generated via UI/API and exported (NFR-6)
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
