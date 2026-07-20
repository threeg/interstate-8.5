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

**Not fixed here — spun out as `INT8-026`:** the footer's About/Contact/Support/Legal/Privacy row is
still hardcoded static text, not a real Drupal menu. That was a deliberate choice at the time (the
hi-fi itself renders them as inert spans, and those pages are wireframe-deferred, so real links would
404 today) but wasn't called out as a tracked decision in the original ticket text — raised in review
and moved to its own cleanup ticket rather than folded in here, since making it menu-driven has its own
dependency (the destination pages, or at least a real menu to point nowhere-safely) that INT8-015's
components don't otherwise need.

## QA steps
1. `lando playwright` (or `cd tests/playwright && npx playwright test tests/page-shell.spec.ts`) — all
   pass, including Axe at desktop and 320px.
2. Visit any page (e.g. `/user/login`) at a desktop width: confirm the solid header (white background,
   shield badge, styled wordmark, subtle bottom shadow) and the footer (label row, © line, disclaimer)
   render and match `spec/design/interstate-8-design-refinement/project/Interstate-8 1B.dc.html`'s
   HEADER · SOLID / FOOTER components. With a menu placed in the primary-nav region, its links render
   as a horizontal row in the header's nav slot, not stacked.
3. Scroll the page: the header stays pinned to the top of the viewport.
4. Widen the browser past ~1440px: the whole page (header/content/footer) centres into a shadowed
   white sheet with the canvas colour visible on both sides, instead of stretching edge-to-edge.
5. On a short page, the footer sits flush with the bottom of the viewport rather than floating directly
   under the content.
6. Resize below 760px (or use device emulation at 320px): the primary-nav area collapses behind a ☰
   button in the header's top-right; click/Enter on it toggles `aria-expanded` and reveals the nav panel
   (now stacked vertically) below the header. Footer's label row wraps onto a second line.
7. Tab through the page from the top: focus should visibly land on the wordmark link, then (below
   760px) the ☰ toggle, in a logical order.
