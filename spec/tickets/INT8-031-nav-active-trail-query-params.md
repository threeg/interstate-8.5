---
id: INT8-031
title: Keep the primary nav's current-section marking when query-string filters are active
type: task
status: todo
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-017, INT8-018]
implements: [FR-16, NFR-1]
tests_required: true
estimate: 2
---

## In plain English
On the Songs page the word "SONGS" in the top menu is underlined so you can see which section of the
site you are in. The moment you use the filters, that underline vanishes and the menu looks as though
you are nowhere — even though you are still on the Songs page. This makes the "you are here" marker
stay put whatever filters are applied.

## Background
Reported by the site owner during manual QA of INT8-028: *"When the filters are being used on the
/songs page, the main nav active trail disappears when there are query string params."*

`/songs` shows the current-section treatment on the SONGS nav item; `/songs?type=Modest%20Mouse` does
not. The cause is confirmed, not assumed — it is core's client-side active-link library, which is the
**only** thing marking the nav today:

1. `web/themes/custom/interstate_85/components/site-header/site-header.component.yml` (`libraryOverrides.dependencies`)
   pulls in `core/drupal.active-link`, because core's default `menu.html.twig` does not mark
   active-trail links server-side at all. That comment is accurate about *today*; this ticket makes
   part of it obsolete and it must be corrected as part of the work.
2. `web/core/misc/active-link.js` builds its selector from `drupalSettings.path`. When a query string
   is present it appends `[data-drupal-link-query="<exact JSON of the current query>"]` to every
   selector; only when the current query is **empty** does it use `:not([data-drupal-link-query])`
   instead (lines 25–28, 59). `web/core/modules/system/src/Hook/SystemHooks.php` (~line 259) only sets
   `path.currentQuery` when the request query is non-empty, so the empty case is genuinely empty.
3. `web/core/lib/Drupal/Core/Utility/LinkGenerator.php` (~lines 115–140) emits
   `data-drupal-link-query` on a link **only if that link's own URL carries a query**. The Songs menu
   link is `internal:/songs` with no query (INT8-017 Notes), so it never has the attribute.

So on `/songs?type=…` the required attribute pair can never match: the JS demands
`[data-drupal-link-query="{\"type\":\"Modest Mouse\"}"]` and the link has no such attribute. Nothing
adds `.is-active` / `aria-current="page"`, and every CSS rule keyed off them
(`site-header.css` — desktop underline ~lines 128–147, mobile left-border ~lines 267–272) silently
does nothing. This is correct behaviour for core's intended use (pagers and exposed filters, where a
*link* to a specific filtered URL should only light up on exactly that URL) and simply the wrong
mechanism for a section-level nav item, which must stay current across every variant of its section.

The nav markup itself is **not** at fault: the `nav` slot in `site-header.twig` receives the rendered
`primary_menu` region — the standard `system_menu_block:main` placement
(`config/sync/block.block.interstate_85_mainnavigation.yml`), so `MenuLinkTree::build()` (core, ~line
238) already sets `set_active_class` and the attributes come out correctly. There is no bespoke nav
markup to fix.

The fix is therefore to mark the current section **server-side**, from the route-based active trail,
which is query-string agnostic by construction.

## Technical requirements

Files to create or modify (theme layer only — nothing imports `theme`, architecture §2.1 holds):

- `web/themes/custom/interstate_85/interstate_85.theme` — add a `hook_preprocess_menu()`
  implementation scoped to the main menu (`interstate_85_preprocess_menu__main()`; the existing
  `interstate_85_preprocess_views_view__songs()` is the house pattern for a targeted preprocess).
- `web/themes/custom/interstate_85/components/site-header/site-header.component.yml` — correct the
  now-stale `libraryOverrides` comment (lines ~33–40).
- `tests/playwright/tests/front-page-nav.spec.ts` — the nav suite (see `## Tests / verification`).

Rules the implementation must honour:

1. **Mark from the active trail, not the URL string.** Each item in `$variables['items']` carries
   `in_active_trail` (set by `MenuLinkTree::buildItems()`), derived from the *route match*, which
   ignores query parameters entirely. Use it as the signal.
2. **Mark the `<a>`, not the `<li>`.** The existing CSS expects the class on the anchor
   (`.site-header__nav .is-active` styles `color`/`border-bottom`, and the mobile rule is
   `li:has(.is-active), li:has(a[aria-current="page"])`). Marking the `<li>` would give it a stray
   border. Merge into the link's own attributes via the item's `Url` object —
   `$item['url']->getOption('attributes')`, add `is-active` to `class` and `aria-current` = `page`,
   then `setOption('attributes', …)`. `LinkGenerator` renders those onto the `<a>`, exactly where
   active-link.js puts them today.
3. **Handle the front page.** The Home link is `route:<front>` (INT8-017 Notes) while the route match
   on `/` is `i8_services.front` (the configured front page is `/home`), so `in_active_trail` is
   **false** for Home on `/` — this is precisely why active-link.js carries its own `isFront` special
   case. Treat a `<front>`-routed item as current when
   `\Drupal::service('path.matcher')->isFrontPage()` is true, or the existing front-page assertion in
   `front-page-nav.spec.ts` regresses.
4. **Cacheability — the front-page branch needs a new cache context.** The menu block is render-cached
   with `route.menu_active_trails:main`, which already varies by rule 1, so rule 1 costs nothing. Rule
   3 adds a dimension no existing context covers (two different routes can both have an empty active
   trail and would share a cache entry). Add `url.path.is_front`. It must be added somewhere it
   actually bubbles — cache metadata set on `$variables` inside a preprocess function does **not**
   bubble, because `ThemeManager::render()` takes `$variables` by value. A theme implementation of
   `hook_block_build_alter()` (guarded to the `system_menu_block:main` plugin) adding
   `$build['#cache']['contexts'][] = 'url.path.is_front';` is the expected place.
5. **Keep `core/drupal.active-link` as a component dependency.** It becomes redundant for the main nav
   but stays harmless: on a query-less URL it targets the same `<a>` and `classList.add()` /
   `setAttribute()` are idempotent, and it still serves any other menu rendered with
   `set_active_class` (e.g. the footer menu arriving in INT8-026). Removing it is out of scope; the
   comment describing it is not — rewrite it so it states that server-side preprocess is now the
   primary mechanism and the library is a redundant secondary.
6. **No hardcoded values, no CSS change.** The current-section treatment already exists and is
   correct (design-system.md §3, Header/nav row); this ticket only makes the markup it keys off appear
   on the right pages. If a CSS change seems necessary, the diagnosis is wrong.

Out of scope: the segmented Alternate-titles toggle's own links (`filter_bar.alt_show_url` /
`alt_hide_url` in `interstate_85.theme`) — those are genuine per-query links and core's query-aware
matching is the right behaviour for them; the footer menu (INT8-026); any change to the Songs View,
its filters, or `views-view--songs.html.twig`.

## Definition of done (acceptance criteria)
- [ ] `/songs?type=Modest%20Mouse` renders the SONGS nav link with `class` containing `is-active` and
      `aria-current="page"`, and it shows the teal current-section underline.
- [ ] The same holds for `/songs?type=All&alt=0` (both documented parameters at once) and for
      `/songs?type=NoSuchType` (the no-results state — still the Songs section).
- [ ] `/songs` with no query string is unchanged: still marked, still exactly one marked nav item.
- [ ] `/` still marks Home and only Home (the `<front>` case, rule 3) — the existing assertion in
      `front-page-nav.spec.ts` keeps passing.
- [ ] On `/songs?type=…` the Home link is **not** marked — no `is-active`, no `aria-current`.
- [ ] The marking is present in the server response, i.e. it holds with JavaScript disabled.
- [ ] At 320px the mobile open panel shows the left-border accent on SONGS on a filtered URL
      (`li:has(a[aria-current="page"])`, site-header.css).
- [ ] The `site-header.component.yml` `libraryOverrides` comment no longer claims the JS library is
      what marks the nav.
- [ ] The default gate (`lando test`) passes with zero warnings — PHPCS/PHPStan clean on the new
      preprocess/alter hooks, boundary check 0 violations.
- [ ] `lando playwright` green (same known Firefox `pw`-service gap recorded in INT8-018/027).
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: true` — this is a behavioural defect against FR-16/NFR-1 with a directly observable
DOM assertion, so no exemption applies. Red-green is binding: write the assertions first and confirm
they fail because the attributes are absent (not because a locator is wrong) before touching the
theme.

Add to **`tests/playwright/tests/front-page-nav.spec.ts`** — the nav suite (INT8-017, FR-16), not
`songs-landing.spec.ts`, whose subject is the landing page's own content. Reuse that file's existing
`nav.site-header__nav a` locator style. The documented `type` values are term names, URL-encoded
(`All`, `Modest Mouse`, `Ugly Casanova`, `Side projects`, `Covers`) and `alt` is `1`/`0` — see the
`TYPE` constants and `songsUrl()` helper at the top of `songs-landing.spec.ts` and
`interstate_85_preprocess_views_view__songs()`; api-contract.md §2.1 is authoritative.

Assertions to add:
1. `/songs?type=Modest%20Mouse` → the Songs link has `aria-current="page"` and class `is-active`;
   Home has neither.
2. `/songs?type=All&alt=0` → same.
3. `/songs` (no query) → same, as an unchanged-behaviour guard.
4. A `test.use({ javaScriptEnabled: false })` case on a filtered URL, asserting the marking is
   server-rendered — this is what actually pins the fix's mechanism rather than its symptom.
5. Axe on `/songs?type=…` — `aria-current` is the programmatic "you are here" signal (NFR-1, WCAG 2.1
   AA), so keep the accessibility check on the filtered URL too.

Command: `lando test` then `lando playwright` (they run on separate services — test-strategy §2.2).
One-line sanity test once implemented:
`curl -s 'http://interstate-8-5.lndo.site/songs?type=All' | grep -c 'aria-current="page"'` → `1`
(non-zero; it is `0` before the fix, which is the bug).

## Notes
- 2026-07-26 — created. Raised by the site owner during manual QA of INT8-028. Root cause confirmed by
  reading `web/core/misc/active-link.js`, `LinkGenerator::generate()` and `SystemHooks` rather than
  inferred: core's active-link matching is deliberately query-exact, and the Songs menu link carries
  no `data-drupal-link-query`, so no selector can match once any query parameter is present. The nav
  markup and the CSS are both correct; only the marking mechanism is wrong for a section-level nav.
- Placed in the main execution sequence rather than the cleanup backlog, on the same reasoning as
  INT8-027 and INT8-029: it implements FR-16/NFR-1 *more correctly* rather than improving the internal
  quality of behaviour that is already right (CONVENTIONS §6.6).
- `depends_on` lists INT8-017 (created the primary nav and its menu links, including the `route:<front>`
  Home link this ticket must special-case) and INT8-018 (introduced the `type`/`alt` query parameters
  that expose the defect). Both are `done`, so the start rule (CONVENTIONS §4.2) is already satisfied;
  they are listed for graph correctness.
