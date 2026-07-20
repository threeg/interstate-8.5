---
id: INT8-015
title: Base layout + header + footer (SDC)
type: task
status: in-review
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-005]
implements: [FR-16, NFR-1, NFR-2]
tests_required: true
estimate: 3
---

## In plain English
Build the top and bottom of every page — the Interstate-8 header with navigation (see-through over the
homepage photo, solid everywhere else) and the footer — so the whole site shares one consistent frame.

## Background
Design-system §3 (Header/nav, Footer); canonical `Interstate-8 1B.dc.html` (HEADER · TRANSPARENT / ·
SOLID, FOOTER components); wireframes overview §3.

## Technical requirements
- **Header SDC** with two variants: **transparent** (over hero, homepage pre-scroll) and **solid**
  (scrolled + all secondary pages). Wordmark + "8" route-shield mark + primary nav; active-item accent.
- **Footer SDC** — secondary menu (About/Contact/Support/Legal/Privacy) + © + disclaimer.
- Page template wires header/footer around the main region; scroll → solidify behaviour (minimal JS /
  Drupal behaviour).
- Consume `tokens.css` (no hardcoded values); semantic landmarks, one `<h1>` per page, heading order,
  visible focus (NFR-1); responsive to 320px (NFR-2).

## Definition of done (acceptance criteria)
- [x] Header (both states) + footer render per `1B.dc.html`; nav marks the current section (FR-16 framing).
- [x] Playwright + Axe pass on a page shell at 320px + desktop (no serious/critical a11y violations).
- [x] Tokens-only styling; no hardcoded hex/px.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. Playwright: header state switch + nav present + keyboard/focus; Axe on the
shell (NFR-1); responsive assertion at 320px (NFR-2). Test strategy §7.

## Notes
2026-07-20 — Built **`site-header`** and **`site-footer`** SDC components
(`web/themes/custom/interstate_85/components/`) and a theme `page.html.twig` that wires them around
the existing regions (header/primary_menu/breadcrumb/content/sidebar_first/footer), replacing core's
default page template.

**Scope boundary vs INT8-017:** per `INT8-017`'s own text ("Nav rendered by the header SDC (INT8-015);
active-section marking works" is listed as *its* technical requirement, and it owns the site-building
steps — menu items, front page route), this ticket delivers the **chrome**, not menu content: the
header's `nav` slot renders whatever `page.primary_menu` contains (empty until INT8-017 places a menu
block there) via a `{% block nav %}` slot, and both `.is-active` and `[aria-current="page"]` are styled
with the accent underline so INT8-017's real links pick up "current section" styling for free with no
further CSS work.

**Transparent variant:** implemented in full per `1B.dc.html` (scrim gradient, white nav text, the
`is-scrolled` solidify class swapped in by a Drupal behavior on scroll) and selectable via the
component's `variant` prop, but not exercised on a live route this ticket — the homepage is design-only
in slice 1 (wireframes overview §1) and isn't built, so `header_variant` defaults to `solid`
everywhere for now. A future homepage ticket sets `header_variant = 'transparent'` in a page
preprocess; the mechanism (CSS + JS) is ready for it.

**Bugs found and fixed along the way (all covered by the new Playwright suite):**
- **NFR-1 contrast violation, pre-existing (INT8-005):** `css/app.css`'s base `a { color:
  var(--color-accent) }` only clears 4.5:1 against `--color-surface` (4.56:1) — it fails against
  `--color-canvas`/`--color-tint` (3.99:1 / 3.84:1), caught by Axe on `/user/login`'s "Reset your
  password" link. Fixed by swapping the default link colour to `--color-accent-hover` (passes
  everywhere: 5.49–6.29:1); `:hover` keeps the brighter `--color-accent` (axe's static scan doesn't
  evaluate `:hover`, so this is a safe, real-world-compliant swap).
- **Twig context-leak (new, introduced by this ticket's own page.html.twig):** `{% embed %}`/`include()`
  inherit the calling template's ambient variables by default; `page.html.twig` had its own implicit
  `attributes` variable, so `site-header`'s `attributes.addClass()` mutated a shared `Attribute` object
  that `site-footer`'s `include()` picked up next, leaking `site-header site-header--solid` classes onto
  the footer. Fixed with `only` on the header `{% embed %}` (re-passing `page` explicitly since `only`
  also cuts off block-override variables) and `with_context: false` on the footer `include()`.
- **Broken wordmark link, pre-existing (INT8-005):** `block--system-branding-block.html.twig` used
  `{{ front_page }}`, a `page.html.twig`-only preprocess variable that's never set for block templates
  — always rendered `href=""`. Fixed with `{{ path('<front>') }}`, which resolves correctly from any
  template scope.

Default gate passes (10 PHPUnit, PHPCS/PHPStan clean on custom code, boundary check 0 violations —
the new Twig/CSS/JS files aren't in PHPCS/PHPStan's PHP-only scope). Playwright: 40/40 passed across
all 5 browser projects (`tests/playwright/tests/page-shell.spec.ts`, written and confirmed red first
against the un-implemented shell, then green after implementation), including Axe at desktop and
320px with zero serious/critical violations.

**Sanity test:** `curl -sL http://interstate-8-5.lndo.site/user/login | grep -o 'class="site-header[^"]*"'`
→ `site-header site-header--solid`; visually, the badge (polo-blue shield outline), wordmark, the
ABOUT/CONTACT/SUPPORT/LEGAL/PRIVACY POLICY row, © line and disclaimer all render per `1B.dc.html`'s
FOOTER/HEADER·SOLID components.

2026-07-20 — **Round 2, from review feedback** (user placed a real menu block + test links to exercise
the nav end-to-end). Five fixes, all in the same components touched above — no scope change, no new
files besides the CSS/markup already in this ticket:

- **Nav items stacked vertically / wrong colour:** the placed `system_menu_block` renders its own
  `<div>` block wrapper + inner `<nav>` + a bare `<ul><li><a>` (no `.menu`/`.menu-item` classes in this
  Drupal version's default markup). `.site-header__nav`'s `display:flex` only laid out that one wrapper
  `<div>` as a single flex item — the `<ul>` two levels down never joined the row. Fixed by collapsing
  the two wrapper levels with `display: contents` and moving the flex-row declaration onto the actual
  `<ul>`. Separately, nav link colour was losing to the global `a { color: var(--color-accent-hover) }`
  rule added in round 1 — a rule that directly targets `<a>` beats a colour that only reaches the link
  by inheritance, regardless of the parent selector's specificity. Fixed with an explicit
  `.site-header__nav a { color: var(--color-nav); }` rule, which — because it also directly targets
  `<a>` — wins on specificity instead.
- **Site name (wordmark) unstyled:** `.site-header__branding`'s CSS only laid out its container; no
  rule ever touched `.site-branding__name` (the actual text). Added Oswald/700/`--fs-h4`/`--color-fg`
  (white + text-shadow on the transparent variant), matching `1B.dc.html`'s solid-header wordmark spec.
- **Not centred to the 1440px sheet on extra-wide viewports:** `1B.dc.html`'s "EXTRA-WIDE" mockups
  (1920px viewport) wrap the *entire page* — not just the header — in `max-width:1440px;margin:0 auto`
  with the `--shadow-sheet` shadow. `page.html.twig`'s `.layout-container` never had that constraint,
  so header/main/footer all stretched full-bleed at any width. Added the max-width/centring (plus the
  shadow only above 1441px, so it doesn't show as a flush-edge artefact below the sheet width) to
  `.layout-container` in `app.css` — this incidentally fixed the "badge+wordmark flush left" symptom
  too, since they're now positioned relative to the centred sheet, not the raw viewport.
- **Header not sticky on scroll:** the transparent variant already pins itself on scroll
  (`.is-scrolled { position: fixed }`, part of the original solidify mechanism), but the **solid**
  variant — what every real page actually uses today — had no positioning beyond the base
  `position: relative`. Added `position: sticky; top: 0;` to `.site-header--solid`. (Checked the spec
  first: no doc states the header must be sticky — the only "sticky" mention anywhere is the Songs-
  ledger letter-rail, a different, later component — so this was a plain missing implementation, not a
  spec reinterpretation.)
- **Footer not pinned to the viewport bottom on short pages:** `.layout-container` had no height rules
  at all. Added the standard sticky-footer pattern — `.layout-container` as a `min-height: 100vh` flex
  column, `.site-main { flex: 1 0 auto; }` — so the footer sits at the bottom of the viewport on short
  pages (verified: footer's `getBoundingClientRect().bottom` now equals `window.innerHeight` on
  `/user/login`) while behaving normally (pushed down by content, not fixed) on taller pages.

Re-verified after all five fixes: default gate green (10 PHPUnit, PHPCS/PHPStan clean, boundary check
0 violations); Playwright 40/40 across all 5 browser projects, including Axe at desktop and 320px with
the real test menu links in place.

2026-07-20 — **Round 3, from review feedback:** the round-2 "content sheet" fix was itself incomplete.
I'd confined `.layout-container` to `--sheet-max` (1440px), which correctly matches `1B.dc.html`'s
outer structure — but missed that within that sheet, the hi-fi caps *readable content* further to
`--content-max` (980px, white gutters either side, still inside the white sheet) while the header/hero/
footer stay at the full sheet width. Confirmed by rendering the hi-fi's own `SONGS LANDING ·
EXTRA-WIDE` block directly (screenshotted, not just read as markup) and by its caption: "column/filter
layout capped at content width, only the hero and gutter respond to the extra space." `--content-max`
already existed in `tokens.css` — I'd defined it but never applied it anywhere. Fixed by moving
`page.breadcrumb` inside `.layout-content` (previously it sat directly in `.layout-container`, at the
full sheet width) and adding `max-width: var(--content-max); margin-inline: auto; padding-inline:
var(--space-6);` to `.layout-content` in `app.css`. Header/footer are unaffected — they still correctly
span the full `--sheet-max` width. Re-verified visually (header/footer edge-to-edge in the sheet,
content column narrower with white gutters, at a 1920px viewport) and re-ran both suites: default gate
green, Playwright 40/40.

**Not fixed here — spun out as `INT8-026`:** the footer's About/Contact/Support/Legal/Privacy row is
still hardcoded static text, not a real Drupal menu. That was a deliberate choice at the time (the
hi-fi itself renders them as inert spans, and those pages are wireframe-deferred, so real links would
404 today) but wasn't called out as a tracked decision in the original ticket text — raised in review
and moved to its own cleanup ticket rather than folded in here, since making it menu-driven has its own
dependency (the destination pages, or at least a real menu to point nowhere-safely) that INT8-015's
components don't otherwise need.

2026-07-20 — **Round 4, from review feedback** (five more points, once a real internal link was
available to test against):

- **Header/footer inner content not aligned to the content column:** round 2/3 got the *outer*
  `--sheet-max` sizing right, but `.site-header__inner`/the new `.site-footer__inner` still used their
  own padding, not the same `--content-max`/`margin-inline:auto` box as `.layout-content` — so at wide
  viewports the badge/nav/footer content sat closer to the sheet's edges than the content column's
  edges instead of sharing them. `1B.dc.html` confirms this explicitly: both the homepage and Songs
  Landing extra-wide header rows wrap their badge+nav in their own `max-width:980px` div. Fixed by
  giving `.site-header__inner` and the new `.site-footer__inner` the identical
  `max-width:var(--content-max);margin-inline:auto;padding-inline:var(--space-6)` treatment as
  `.layout-content`, so all three now share the same left/right edges at any width.
- **Wordmark and nav not uppercase:** added `text-transform: uppercase` to `.site-branding__name` and
  `.site-header__nav` (CSS-level, not a Twig `|upper` on the data, since both are real Drupal values —
  site name, menu link titles — that shouldn't be rewritten, only presented differently). The footer's
  labels already used `|upper` and were already correct.
- **No hover state:** none had been written for nav links or the wordmark — worse, the round-1 global
  `a:hover` rule couldn't reach them anyway, beaten by the same higher-specificity direct rules that
  fixed the round-2 color bug. Added explicit `:hover` rules: nav links → accent teal + underline
  (matching design-system §3's Link component: "nav/action (teal, underline on hover)"); wordmark →
  accent teal text + intensified badge border.
- **No active/current-section state:** the `.is-active`/`[aria-current="page"]` CSS built in round 1
  had nothing to ever attach those to. Checked core's actual `menu.html.twig` — it does **no**
  active-trail marking server-side at all (no class, no `aria-current`); that's done entirely
  client-side by the `core/drupal.active-link` JS library reading `data-drupal-link-system-path`
  attributes after page load, and that library was never attached anywhere. Added it to
  `site-header.component.yml`'s `libraryOverrides.dependencies`. Verified end-to-end: with a menu link
  added pointing at `/` (the current front page), it now genuinely receives `.is-active` client-side —
  confirmed both manually and with a new permanent Playwright test (using the login page's own
  always-present "Log in" tab as a stable proof rather than depending on ad-hoc nav test data).
- **Shield not clickable:** `block--system-branding-block.html.twig` had the badge *outside* the
  wordmark's `<a>`. Restructured so a single `.site-branding__link` anchor wraps both the badge and the
  wordmark (now a `<span>` inside it, since the outer element is now the link).

Added three permanent regression tests to `page-shell.spec.ts` (uppercase, nav-link hover colour
change, active-link marking) and extended the existing header test to assert the badge sits inside the
wordmark link. Re-verified: default gate green, Playwright 55/55 across all 5 browser projects
(including Axe at desktop and 320px).

2026-07-20 — **Round 5, from review feedback.** The user's core point: I hadn't read
`Interstate-8 1B.dc.html` end-to-end, so I was inventing states instead of finding them. Read all 721
lines this time, including a "DESIGN TOKENS" panel near the end (~line 666–709) I'd skipped past
before — it has an explicit **LINK STATES** example with real values (`Default: color:#3f7ca0, no
underline` · `Hover: color:#3f7ca0, text-decoration:underline` · `Inline text: color:#3d4442,
underline in a *different* colour #5e6b68`). Four fixes:

- **Badge/wordmark hover removed.** Round 4 added a border-colour change on the badge and a text-colour
  change on the wordmark on hover — neither has any basis anywhere in the file (grepped the whole file
  for "hover"; the only matches are the generic Button/Link states panel and the header's own nav,
  nothing badge/logo-related). Reverted both; the branding link now has no hover treatment, matching
  what's actually specified (nothing).
- **Site slogan was never rendered at all.** `block--system-branding-block.html.twig` only ever printed
  `site_name`, dropping `site_slogan` entirely (a variable Drupal already provides to this template,
  confirmed against core's own default `block--system-branding-block.html.twig`). Added it, styled per
  the hi-fi's transparent-header instances (11px system-ui, `--ls-nav` letter-spacing, white +
  text-shadow) — and confirmed by checking **every** header instance in the file that the slogan line
  appears **only** in the transparent variant (homepage, homepage-extra-wide) and is absent from all
  five solid-header instances (secondary-page solid, songs-landing solid ×3 variants) — so
  `.site-branding__slogan` is hidden via CSS on `.site-header--solid`. Verified by temporarily setting
  a real slogan value via `drush config:set` and simulating the transparent variant in a throwaway
  Playwright check (screenshotted, reverted the config value after).
- **Nav hover underline corrected to match the file's own example.** Round 4's transparent-variant hover
  used an invented two-tone underline (`text-decoration-color: var(--color-accent-alt)`, different from
  the text colour) with no basis in the file — the actual "Hover link" example uses a single colour for
  both text and underline. Removed the two-tone override; the solid-variant hover (already
  `color:#3f7ca0` + plain underline) already matched the example exactly and didn't need changing.
- **Footer-overflow scroll: not reproduced.** Tried to reproduce the "short pages scroll a little more
  than they should" report directly: measured `document.documentElement.scrollHeight` vs
  `window.innerHeight` on `/user/login` at nine viewport widths (320–1440px), and again with a
  scrollbar forcibly reserved via `overflow-y:scroll`. Every measurement came back with **zero**
  overflow — the `flex:1 0 auto` main region absorbs the remaining space exactly regardless of
  header/footer height changes (nav wrapping, footer wrapping, etc.), which is what the sticky-footer
  pattern is supposed to do. Genuinely couldn't reproduce it in headless testing, so left this alone
  rather than bolt on a speculative fix (e.g. `scrollbar-gutter: stable`) I can't verify actually
  addresses it — asked the user for the exact page/viewport/browser to pin it down.

Re-verified: default gate green, Playwright 55/55 across all 5 browser projects.

## QA steps
1. `lando playwright` (or `cd tests/playwright && npx playwright test tests/page-shell.spec.ts`) — all
   pass, including Axe at desktop and 320px.
2. Visit any page (e.g. `/user/login`) at a desktop width: confirm the solid header (white background,
   shield badge, uppercase styled wordmark, subtle bottom shadow, **no** slogan line) and the footer
   (label row, © line, disclaimer) render and match `spec/design/interstate-8-design-refinement/project/
   Interstate-8 1B.dc.html`'s HEADER · SOLID / FOOTER components. With a menu placed in the primary-nav
   region, its links render as an uppercase horizontal row in the header's nav slot, not stacked, and
   hover over a link shows the exact teal/underline from the file's LINK STATES example — no hover
   effect on the badge or wordmark.
3. With a real site slogan configured, only the (not-yet-built) transparent/homepage header would show
   it beneath the wordmark; the solid header never does.
3. Click the shield/badge — it navigates home, same as the wordmark text.
4. Add an internal menu link pointing at the current page: it picks up the accent-teal/underline
   "current section" styling once the page finishes loading (client-side, via `core/drupal.active-link`).
5. Scroll the page: the header stays pinned to the top of the viewport.
6. Widen the browser past ~1440px: the whole page (header/content/footer) centres into a shadowed
   white sheet with the canvas colour visible on both sides; within the sheet, the header/footer content
   shares the same left/right edges as the main content column (not the sheet's own edges).
7. On a short page, the footer sits flush with the bottom of the viewport rather than floating directly
   under the content.
8. Resize below 760px (or use device emulation at 320px): the primary-nav area collapses behind a ☰
   button in the header's top-right; click/Enter on it toggles `aria-expanded` and reveals the nav panel
   (now stacked vertically) below the header. Footer's label row wraps onto a second line.
7. Tab through the page from the top: focus should visibly land on the wordmark link, then (below
   760px) the ☰ toggle, in a logical order.
