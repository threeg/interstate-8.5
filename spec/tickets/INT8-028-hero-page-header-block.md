---
id: INT8-028
title: Hero as a page-header block in a new full-width region
type: story
status: todo
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-015, INT8-016, INT8-018]
implements: []
tests_required: true
estimate: 3
---

## In plain English
The photo banner at the top of the Songs page is currently baked into that one page's template, and it
sits inside the narrow 980px reading column instead of running the full width of the page. This turns
it into a proper block placed in a new full-width slot at the top of the page — so it stretches edge to
edge the way the design calls for, and any future page (starting with the song page) gets its own
banner by placing a block rather than by copying markup into another template.

## User story
As a site operator
I want the page hero to be a block placed in a page-header region, configured per page
so that a hero can be added, changed or removed without editing a page template, and it renders
edge-to-edge at the sheet width the design requires.

## Acceptance criteria

**Scenario 1: full-sheet width**
- Given a viewport wider than the 1440px sheet cap (e.g. 1920px)
- When I open `/songs`
- Then the hero's photo touches both edges of the white content sheet (`--sheet-max`, 1440px), not the
  980px content column — the hi-fi's **LAYOUT WIDTHS** panel states the hero background photo is "the
  only element allowed to touch the sheet's own edges (max 1440px)"
- And the filter bar and song ledger below it stay capped at `--content-max` exactly as today
- And no CSS breakout hack (negative margins, `100vw`, `calc()` un-centring) is used — the hero is
  outside `.layout-content` structurally, the same way `header` and `footer` already are.

**Scenario 2: the hero is a placed block, not template markup**
- Given the theme declares a new `page_header` region rendered in `page.html.twig` as a sibling of the
  header/footer
- When the hero block is placed in that region with a `/songs` visibility condition
- Then `/songs` renders its hero from that block
- And `templates/views-view--songs.html.twig` no longer embeds `interstate_85:hero` at all
- And unplacing the block removes the hero from `/songs` with no template edit.

**Scenario 3: routes without a hero are untouched**
- Given a route the block's visibility condition does not match (e.g. `/user/login`)
- Then no hero renders there
- And the core page-title block still supplies that page's `<h1>`, exactly as before.

**Scenario 4: appearance unchanged, one `<h1>`**
- Given `/songs`
- Then the page still has exactly one `<h1>`, reading "Songs", supplied by the hero (NFR-1)
- And the hero's visual treatment (height, scrim gradient, bottom-left title, mobile padding) is the
  existing `hero` SDC's `page-title` variant, unchanged — this ticket changes **placement, width and
  how the hero is populated**, never the component's own design
- And the page remains usable at 320px (NFR-2).

## Technical approach

- **New region.** Add `page_header: Page header` to
  `web/themes/custom/interstate_85/interstate_85.info.yml` and render `{{ page.page_header }}` in
  `templates/page.html.twig` as a sibling of the `site-header` embed and the `site-footer` include —
  i.e. inside `.layout-container` but **outside** `.layout-content`. `.layout-content` is what caps
  content at `--content-max` (`css/app.css` §4); anything outside it inherits `.layout-container`'s
  `--sheet-max` width for free. None of the existing regions fit: `header`/`footer` are structural
  chrome owned by specific components, `breadcrumb`/`content` are both inside the 980px cap, and
  `sidebar_first` is a side column — hence a new region rather than reuse (settled with the user; not
  reopened here).
- **Block plugin lives in `i8_services`, not the theme.** Block plugins are discovered from modules;
  more importantly the dependency rule (architecture §2.1) runs `content-model → services → theme` and
  **nothing imports `theme`**. Add
  `web/modules/custom/i8_services/src/Plugin/Block/PageHeroBlock.php` (`i8_page_hero`).
- **Keep the boundary clean by splitting data from rendering.** The plugin builds *data only* — the
  hero variant, the image to use, and the title — and the **theme** owns the markup via its own
  `templates/block--i8-page-hero.html.twig`, which is where `interstate_85:hero` is embedded (image
  slot + `<h1>` title slot). The services module therefore never names a theme component or imports
  `Drupal\interstate_85\*`, and `tooling/check-boundary.sh` stays green. If Drupal makes this
  impractical, record the deviation and its reason in `## Notes` rather than silently importing the
  theme.
- **Route-awareness — the title comes from the route, the image from block config.** The plugin is
  context-aware via the current route match / title resolver, so the hero's heading is the page's own
  title (`Songs` on `/songs`; the song's name on a song page later) with no per-route title
  configuration — the same source `page_title_block` uses, which is exactly why the hero can replace it
  on these routes. The plugin's configuration form carries the two things that genuinely vary per
  placement: the **hero variant** (`band` | `page-title`, defaulting to `page-title`) and the **hero
  image**. Slice 1 keeps images as the theme's own static assets (they are decorative, non-editorial and
  identical on every visit — INT8-018's reasoning, unchanged), so the image setting is the asset's
  filename within the theme's `images/` directory (`songs-hero.jpg` for this placement) which the block
  template resolves against `{{ base_path ~ directory }}`. This is a deliberately small, portable
  interim shape — no file entities, no environment-specific file IDs in exported config — and it is what
  the follow-up below replaces.
- **Image alt text stays empty** (`alt=""`): the hero photo is decorative and the heading carries the
  meaning, as built in INT8-018.
- **Page-title block: keep the one existing mechanism.** `block.block.interstate_85_page_title` already
  has a negated `request_path` visibility condition listing `/songs`. Hero routes continue to be added
  to that same condition — do not introduce a second suppression mechanism.
- **Migrate INT8-018's Songs landing.** Remove the `{% embed 'interstate_85:hero' … %}` block at the top
  of `templates/views-view--songs.html.twig` and update that file's header comment (which documents the
  hero/page-title arrangement). Everything else in that template — the filter bar atoms, the empty
  state, the ledger include, and both recorded SDC quirks — stays exactly as it is.
- **Title alignment at extra-wide, to decide and record.** The hi-fi says the *photo* spans the sheet;
  `.site-header__inner`/`.site-footer__inner` align their inner content to the 980px column (INT8-015
  round 4). Check the hi-fi's SONGS LANDING · EXTRA-WIDE composition and decide whether the hero's
  title should likewise align to the content column above 1440px or stay inset from the photo's own
  edges; state the answer in `## Notes` either way.
- **Config is generated, never hand-authored (NFR-6).** Create the block placement through the admin UI
  or the entity API and export it (`config/sync/block.block.interstate_85_*.yml`), then verify the
  export against this ticket — the standing rule for every `[site-building]` step in this project.
- **No architecture-doc change is expected.** `architecture.md` §2.1/§6 describe the layers and the
  theme stack but document no theme region layout, so there is nothing there to keep in step. If the
  implementer decides a region note belongs in §6, add a factual one-liner and say so in `## Notes` —
  do not restate the layering.

**Out of scope — the named follow-up (do not build it here).** The original ask behind this ticket was
"a block where I could upload a bunch of photos for it to then randomise through". That is a real,
separate feature: it needs an **image media type** (none exists — only `remote_video` from INT8-009),
multi-value image selection on the block's configuration, a per-request random pick, and the cache
implications that follow (a randomising block cannot be cached per-route without a cache-max-age or
context decision). This ticket delivers only the foundation it needs — the region, the block, and one
configured image per placement — per the project's lazy-adoption rule. **Write the follow-up ticket
when this one is `done`**, scoped as: *image media type + multi-image selection on `i8_page_hero` +
random-per-request rendering with an explicit caching decision*. It has no other prerequisite once this
ticket lands.

**Sequencing note — read before picking the next ticket (not a dependency).** INT8-019 (Song page)
will want this hero block too: its hi-fi composition is the same page-title hero with a different photo
and a taller band. Ticket ids are permanent and allocated in execution order, so INT8-019 **cannot**
formally depend on INT8-028 (CONVENTIONS §4.3 — no forward edges), and INT8-019's own `depends_on` is
deliberately left untouched. Whoever runs `sfk-next-ticket` should nonetheless consider building
**INT8-028 before INT8-019**, even though INT8-019 has the lower id: otherwise INT8-019 builds a second
hero-per-route mechanism inside its own template only to throw it away when this ticket lands. A
matching forward-pointer note is recorded in `INT8-019-song-page.md`.

## Design references
- Design system: `spec/design/design-system.md` §3 — **Hero** row (band / page-title variants, photo +
  darkening scrim). This ticket does not change that entry.
- Canonical hi-fi: `spec/design/interstate-8-design-refinement/project/Interstate-8 1B.dc.html` —
  the **LAYOUT WIDTHS** panel (full-sheet vs content-column elements; the hero photo is the one
  full-sheet element), plus **SONGS LANDING · EXTRA-WIDE** and **SONGS LANDING DESKTOP** for the hero
  band itself.
- Wireframe: `spec/wireframes/02-songs-landing.md` (the landing this hero sits above).

## Tests
- Playwright (`tests/playwright/tests/songs-landing.spec.ts`, extending INT8-018's suite): at a 1920px
  viewport the hero's rendered width equals the sheet width (1440px) while the ledger/filter bar stay at
  the content width; the hero markup is no longer inside the View's own output; `/songs` still has
  exactly one `<h1>` reading "Songs"; a non-hero route (e.g. `/user/login`) renders no hero and still
  renders its page title.
- Axe on `/songs` at desktop and 320px — no serious/critical violations, heading order intact (NFR-1,
  NFR-2).
- No new requirement behaviour is introduced, so `implements` is empty; the tests above exist to prove
  the move regresses nothing (NFR-1/NFR-2 in particular) rather than to cover a new `FR`.
- Red-green applies: write the width/placement assertions first and confirm they fail against the
  current embedded hero.

## QA steps
- [ ] Open `/songs` at a viewport wider than 1440px → the hero photo spans the full white sheet, edge
      to edge, while the filter bar and ledger stay in the narrower column.
- [ ] Open `/songs` at 320px → the hero still renders correctly with its mobile padding; nothing
      overflows horizontally.
- [ ] In *Structure → Block layout* the hero block appears in the new **Page header** region with a
      `/songs` visibility condition; unplace it → the hero disappears from `/songs` and no other page
      changes.
- [ ] Visit `/user/login` → no hero, and the page title renders as before.
- [ ] `lando drush cim -y` → "There are no changes to import." (the block placement is exported, not
      hand-authored).

## Definition of done
- [ ] Acceptance criteria met
- [ ] Playwright + Axe tests added/updated and passing; `lando playwright` green
- [ ] Tokens-only styling; no hardcoded hex/px; the `hero` SDC's own CSS is unchanged
- [ ] Block placement config generated via the UI/API and exported (NFR-6), verified against this ticket
- [ ] The boundary check passes and no custom module imports `Drupal\interstate_85\*`
- [ ] QA steps recorded under `## QA steps` and repeated in the chat completion report
- [ ] Ticket status + notes and BOARD.md row updated in the same commit
