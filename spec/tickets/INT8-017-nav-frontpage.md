---
id: INT8-017
title: Primary nav + front-page/route wiring
type: task
status: done
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-015]
implements: [FR-16]
tests_required: true
estimate: 2
---

## In plain English
Wire up the site's main menu and give it a simple front page, so visitors can actually get to the Songs
section — without building the full homepage yet.

## Background
The homepage is **design-only** this slice (wireframes overview §1). This ticket provides a minimal
navigable front page and the primary menu so nav resolves (FR-16).

## Site-building steps (operator) — terse
1. Primary menu items for the intended IA (Home, Tour, Songs, Discography, Band, News); only **Home** and **Songs** resolve this slice — others may be present-but-unlinked or omitted (design shows them).
2. Set a **minimal front page** (a simple page/route) — not the full homepage composition.
3. `lando drush cex -y` → commit (menu + site front page config).

## Technical requirements
- Nav rendered by the header SDC (INT8-015); active-section marking works.
- Home + Songs routes resolve; unknown routes 404. Minimal front page only.

## Definition of done (acceptance criteria)
- [x] Primary nav resolves Home + Songs; front page loads; menu config exported.
- [x] Playwright: nav from front page → `/songs` works; Axe clean on the front page.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. Playwright asserts nav → Songs (FR-16) + a11y on the front page. Menu/front-page
config is site-building — **Claude verifies** the exported config.

## Notes
2026-07-21 — Built the minimal front page + primary nav wiring:

- **`i8_services`** — a new `services`-layer custom module
  (`web/modules/custom/i8_services/`) with two routes: `i8_services.front` (`/home`, set as
  `system.site:page.front`) and `i8_services.songs_stub` (`/songs`, a temporary stand-in for the real
  Songs landing — see the forward-pointer added to INT8-018's Technical approach: that ticket must
  remove this route when it wires the real View to the same path). Both controllers return a single
  `#markup` paragraph; the existing `page_title_block` (already placed in the `content` region) supplies
  the `<h1>` automatically from each route's `_title`, so no manual heading markup was needed.
- **Menu**: deleted three throwaway links ("Google", "Home" ×2) left over from the user's manual QA
  during INT8-015's review — never intended as real content. Created two real `menu_link_content`
  entities in `main`: **Home** → `route:<front>` (matches the wordmark's own convention from INT8-015)
  and **Songs** → `internal:/songs` (a path, not a route name — so when INT8-018 later replaces the stub
  route with a real View at the same path, this same link keeps working with no edit needed). Per the
  ticket's own text ("present-but-unlinked or omitted"), Tour Dates/Discography/Band/News are **omitted**
  entirely rather than added as unlinked items — Drupal's idiomatic non-interactive menu-item target
  (`<nolink>`) renders as a bare `<span>`, which the header SDC's nav CSS (INT8-015) only styles for
  `<a>` elements; adding unstyled items was out of scope for what this ticket needed to prove (FR-16 —
  a path to Songs), so the simpler, explicitly-sanctioned option was taken.
- **`interstate_85_mainnavigation` block** (the real `system_menu_block:main` placement in the
  `primary_menu` region) already existed in the database from the user's manual QA but was never
  exported — captured properly here via `drush cex`, along with `menu_ui`/`menu_link_content` module
  enablement (also enabled ad hoc during that QA, never committed).

**A debugging detour worth recording:** repeated `curl | grep -o '...nav.\{0,600\}'` checks kept showing
an apparently empty nav after the menu changes, which briefly looked like a caching or PHP-FPM
opcache bug — chased through `cache:rebuild`, explicit cache-tag invalidation, direct `cache_render`
table inspection, and a full `lando restart`, all of which came back clean/correct. The actual cause:
`grep -o` only matches within a single line, and the nav's `<a>` tags render on different lines than
the `site-header__nav` opening tag in the pretty-printed Twig output — the nav was correct the entire
time. Re-verified with `sed -n '/pattern/,/pattern/p'` instead. No code changed as a result of this
detour; noted so a future session doesn't repeat the same false trail.

Default gate green (10 PHPUnit, PHPCS/PHPStan clean on the new controller, boundary check 0
violations — `i8_services` correctly stays out of the theme namespace). Playwright: written first
against the unimplemented routes/menu (confirmed red — no Home/Songs links existed), now 70/70 green
across all 5 browser projects (`tests/playwright/tests/front-page-nav.spec.ts`), including Axe on the
front page. Config exported cleanly (`block.block.interstate_85_mainnavigation`, `menu_ui.settings`
new; `core.extension`, `system.site` updated) — no hand-authored YAML, verified by inspecting the diff.

**Summary:** the site now has a real (if minimal) front page and a working primary nav — "Home" and
"Songs" both resolve and mark themselves current, and every other page still shows the same header/footer
chrome from INT8-015 around them.

**Sanity test:** `curl -s http://interstate-8-5.lndo.site/ | grep -c 'href="/songs"'` → `1`; visiting
`/` and `/songs` both return 200 with the site's header/footer and a correct `<h1>`.

## QA steps
1. Visit `/` — the header/footer render, the nav shows "Home" and "Songs" only, and "Home" carries the
   current-section (teal underline) treatment.
2. Click "Songs" — lands on `/songs`, which now carries the current-section treatment instead; page
   shows a one-line "coming soon"-style placeholder, not a 404.
3. Visit `/tour`, `/discography`, `/band`, `/news` directly — none exist; each 404s (they were
   deliberately omitted from the nav, not wired).
4. `lando drush cim -y` on a fresh checkout → no-op ("There are no changes to import"), confirming the
   exported config matches what's live.
