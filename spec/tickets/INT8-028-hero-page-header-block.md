---
id: INT8-028
title: Secondary-page hero block (random media background) + full-width page-header region
type: story
status: todo
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-015, INT8-016, INT8-018]
implements: []
tests_required: true
estimate: 5
---

## In plain English
A reusable banner for the top of the site's **secondary pages** (Songs now; discography, band, etc.
later): a full-width photo with the **current page's own title** laid over it. You place it as a block
on whichever secondary pages should have a hero, and it shows that page's title automatically. Its
background photo is chosen **at random from a set of images you pick in the media library**, and it
changes on each refresh — **without slowing the rest of the page** (the page still caches; only the
photo rotates). The **homepage is not this block** — it's a different layout and gets its own dedicated
block later. Songs is this block's first placement, and this ticket moves the Songs hero (currently
baked into the Songs page template) onto it.

## User story
As a site operator
I want a secondary-page hero block I can place on any section page — showing that page's own title over
a background that randomises through a set of media-library images I choose
so that section pages get a consistent, lively full-width banner without per-page template code, and
without the rotating image breaking page caching.

## Scope
- **In scope:** the full-width `page_header` region; a route-aware **secondary-page** hero block; its
  **multi-image, random-per-request, cache-safe** background from the media library; migrating
  INT8-018's embedded Songs hero onto the block. If no **image media type** exists yet, add it (only
  `remote_video` was created in INT8-009).
- **Out of scope:** the **homepage / front-page hero** — a different composition; it gets its own
  dedicated block in a separate ticket, **not** this one. Utility/system pages (login, etc.) get no
  hero. Placing on pages that don't exist yet (the song page adopts this in INT8-019 — see sequencing).

> **Theme-foundation chrome → epic E03**, alongside header/footer, even though `depends_on` includes
> INT8-018 (it migrates 018's embedded hero).

## Acceptance criteria

**Scenario 1: the title follows the (secondary) page**
- Given the hero block placed on a secondary route (`/songs`)
- Then its `<h1>` is **that page's own title** ("Songs"), taken from the route — with no per-route
  title config on the block (the same title source `page_title_block` uses, which is why it can replace
  it there)
- And the mechanism is route-general, not hardcoded to Songs (proven by a kernel test rendering the
  block under two different route contexts → two different titles; the song page in INT8-019 is the
  first *second* live placement).

**Scenario 2: random background from a configured media set, per request**
- Given the block is configured with **two or more images selected from the media library**
- When the page is loaded repeatedly
- Then each render shows **one of the configured images chosen at random**, and over enough refreshes
  more than one distinct image is seen
- And each image is used as the hero's background photo behind the title (decorative, `alt=""`).

**Scenario 3: the rotation does not break page caching**
- Given a cacheable secondary page carrying the hero
- When it is requested repeatedly
- Then the **surrounding page stays render-cached** (the static parts are a cache hit on repeat
  requests) while **only the hero image varies** per request — i.e. the random pick is isolated behind
  a placeholder (`#lazy_builder` / auto-placeholder with `max-age: 0` on the image element), and does
  **not** force `max-age: 0` to bubble up and make the whole page uncacheable.

**Scenario 4: full-sheet width**
- Given a viewport wider than the 1440px sheet cap
- Then the hero photo touches both edges of the white content sheet (`--sheet-max`), the body stays at
  `--content-max`, and **no CSS breakout hack** is used — the hero is structurally outside
  `.layout-content`, like header/footer.

**Scenario 5: a placed block, not template markup**
- Given the new `page_header` region rendered in `page.html.twig` as a sibling of header/footer
- Then placing the block on a route renders its hero there; unplacing removes it with no template edit;
  and `templates/views-view--songs.html.twig` **no longer embeds** `interstate_85:hero`.

**Scenario 6: routes without the hero are untouched; one `<h1>`; accessible; responsive**
- A non-placed route (`/user/login`) renders no hero and keeps its core page-title `<h1>`.
- On a hero route the page has exactly one `<h1>` — the page title, from the hero — the core page-title
  block being suppressed there (NFR-1).
- The hero's visual treatment is the existing `hero` SDC's `page-title` variant, unchanged; usable at
  320px (NFR-2).

## Technical approach

- **New region.** `page_header: Page header` in the theme `.info.yml`; render `{{ page.page_header }}`
  in `page.html.twig` inside `.layout-container` but **outside** `.layout-content` (which caps at
  `--content-max`), so it inherits `--sheet-max` for free. No existing region fits — settled with the user.
- **Block plugin in `i8_services`, building *data only*** (dependency rule: nothing imports `theme`):
  `i8_services/src/Plugin/Block/PageHeroBlock.php` (`i8_page_hero`). The theme owns markup via
  `templates/block--i8-page-hero.html.twig` embedding `interstate_85:hero`. `check-boundary` stays green.
- **Route-aware title.** The heading is the current route's title (title resolver / route match) — no
  per-route config; this is what lets the block replace `page_title_block` on the routes it's placed on.
- **Background images — media library, multi-select, random per request:**
  - Ensure an **Image media type** exists (add if missing; core Media + Media Library are enabled from
    INT8-003). The block config carries a **multi-value media reference** (image media) selected via the
    media-library widget — "a bunch of background images to rotate through".
  - The **random pick is a `#lazy_builder`** (auto-placeholdered) on the image element only, with
    `#cache['max-age'] = 0`, so the surrounding page render-caches normally and just the image fragment
    is computed per request (Scenario 3). *Confirm this is the mechanism you want vs a client-side JS
    pick — recommended: server-side lazy-builder, so it works without JS and the markup is a real
    `<img>`/background.*
  - `alt=""` (decorative; the heading carries meaning).
  - **Deployment wrinkle to decide:** the block *config* references the images by **media UUID**
    (portable, exportable), but media entities are **content**, not config — a fresh environment needs
    those media items to exist. Options: ship them as **default content** (`default_content` module) or
    (re)select per environment. Recommend default content so `drush cim` + a content import stand the
    site up reproducibly. **Flagging for your call** — it's the one genuinely new dependency this adds.
- **Suppress the core page-title block on hero routes — one mechanism only:** add hero routes to
  `block.block.interstate_85_page_title`'s existing negated `request_path` condition. No second mechanism.
- **Migrate INT8-018's Songs landing:** remove the `{% embed 'interstate_85:hero' … %}` from
  `templates/views-view--songs.html.twig` and update its header comment; everything else stays.
- **Title alignment at extra-wide** (as before): decide against the hi-fi EXTRA-WIDE composition and
  record in `## Notes`.
- **Config generated, never hand-authored (NFR-6):** region in code; block placement + image selection
  via UI/API, exported (`config/sync/block.block.*`) and verified against this ticket.

**Homepage note.** The front-page hero is deliberately excluded — different layout (the `band` hero
variant, full-height, bespoke composition). Write a separate block ticket for it; do **not** stretch
this one to cover it.

**Sequencing — build before INT8-019 (not a dependency).** INT8-019 (Song page) wants this hero. Ids
are permanent / execution-ordered, so INT8-019 can't formally depend on INT8-028 (CONVENTIONS §4.3);
its `depends_on` is untouched. But building this first lets INT8-019 just place/extend the block
instead of writing a throwaway hero mechanism. Pointer recorded in `INT8-019-song-page.md`.

## Design references
- Design system: `design-system.md` §3 — **Hero** row (`page-title` variant). Unchanged by this ticket.
- Canonical hi-fi: `…/Interstate-8 1B.dc.html` — **LAYOUT WIDTHS** (hero photo is the one full-sheet
  element), **PAGE TITLE HERO**, **SONGS LANDING · EXTRA-WIDE**.
- Wireframe: `spec/wireframes/overview.md` §3 (shared layout).

## Tests
- Kernel: the block renders under two route contexts → two different titles (route-general, not
  hardcoded).
- Playwright: full-sheet width at 1920px while body stays at content width; hero markup **not** inside
  the Songs View output; a non-placed route (`/user/login`) renders no hero and keeps its title; each
  hero page has exactly one `<h1>`.
- Random + cache: request the page N times → **more than one distinct background image** observed
  (Scenario 2); and the page's static shell is a **render-cache hit** on repeat while the image varies
  (Scenario 3) — assert via cache tags/`X-Drupal-Cache` or a render-cache probe, not just eyeballing.
- Axe on a hero page at desktop and 320px (NFR-1, NFR-2).
- `implements: []` — no new `FR`; tests prove the move regresses nothing and that the block is
  route-general and cache-safe. Red-green: write the width/placement/title/random assertions first.

## QA steps
- [ ] Configure the hero block on `/songs` with **3+ media-library images** → refresh several times:
      the background changes; the title stays "Songs".
- [ ] Confirm the page is still fast on repeat loads (static shell cached) while the image rotates.
- [ ] Open a hero page wider than 1440px → photo spans the full white sheet; body stays in the column.
- [ ] Open at 320px → renders correctly, no horizontal overflow.
- [ ] Visit `/` (front page) → **no** secondary-page hero (that's a separate block).
- [ ] Visit `/user/login` → no hero, plain page title.
- [ ] `lando drush cim -y` → "There are no changes to import." (block placement exported; media items
      resolved via the chosen deployment approach).

## Definition of done
- [ ] Acceptance criteria met (title-from-route; random media background per request; page cache preserved)
- [ ] Playwright + kernel + Axe tests added/updated and passing; `lando playwright` green
- [ ] Tokens-only styling; no hardcoded hex/px; the `hero` SDC's own CSS unchanged
- [ ] Block placement + image selection generated via UI/API and exported (NFR-6); media-deployment
      approach decided and recorded in `## Notes`
- [ ] The boundary check passes; no custom module imports `Drupal\interstate_85\*`
- [ ] QA steps recorded under `## QA steps` and repeated in the chat completion report
- [ ] Ticket status + notes and BOARD.md row updated in the same commit
