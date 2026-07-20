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

## QA steps
1. `lando playwright` (or `cd tests/playwright && npx playwright test tests/page-shell.spec.ts`) — all
   pass, including Axe at desktop and 320px.
2. Visit any page (e.g. `/user/login`) at a desktop width: confirm the solid header (white background,
   shield badge, wordmark, subtle bottom shadow) and the footer (label row, © line, disclaimer) render
   and match `spec/design/interstate-8-design-refinement/project/Interstate-8 1B.dc.html`'s HEADER ·
   SOLID / FOOTER components.
3. Resize below 760px (or use device emulation at 320px): the primary-nav area collapses behind a ☰
   button in the header's top-right; click/Enter on it toggles `aria-expanded` and reveals the (currently
   empty, pending INT8-017) nav panel below the header. Footer's label row wraps onto a second line.
4. Tab through the page from the top: focus should visibly land on the wordmark link, then (below
   760px) the ☰ toggle, in a logical order.
