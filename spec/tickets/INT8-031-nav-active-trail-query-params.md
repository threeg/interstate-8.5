---
id: INT8-031
title: Keep the primary nav's current-section marking across the whole Songs section
type: task
status: done
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
site you are in. That underline vanishes the moment you use the filters — and again as soon as you
click through to an individual song — so the menu looks as though you are nowhere, even though you are
still in the Songs section. This makes the "you are here" marker stay put anywhere in Songs.

> **Scope widened 2026-07-26 (review round 2).** As filed, this ticket covered only the query-string
> case. The site owner reviewing the fix found the same symptom on song pages (`/songs/<song>`) and
> asked whether Drupal ought to handle that already. It doesn't — see the round-2 note — and since it
> is one behaviour to a visitor ("the nav says which section I'm in"), it is fixed here rather than
> split off. The title was broadened to match.

## Background
Reported by the site owner during manual QA of INT8-028: *"When the filters are being used on the
/songs page, the main nav active trail disappears when there are query string params."*

`/songs` shows the current-section treatment on the SONGS nav item; `/songs?type=Modest%20Mouse` does
not. The cause is confirmed, not assumed — core's active-link matching is **query-exact**, and the
Songs menu link carries no query to match against:

> **Corrected 2026-07-26, during implementation.** As originally written this section claimed core's
> *client-side* `active-link.js` was "the only thing marking the nav today". That is wrong, and the
> independent test author caught it: the marking is already present in the raw `curl` output on
> `/songs`, i.e. server-side. It comes from
> `web/core/lib/Drupal/Core/EventSubscriber/ActiveLinkResponseFilter.php`, whose own docblock calls it
> *"a PHP implementation of the drupal.active-link JavaScript library"* — it post-processes the
> response HTML with the identical query-exact rule (`::setLinkActiveClass()`, ~line 208:
> `$node->getAttribute('data-drupal-link-query') !== Json::encode($query)`), plus the same
> `pathMatcher->isFrontPage()` special case (~line 103). **The diagnosis and the prescribed fix below
> are unaffected** — the query-exactness that breaks section-level marking is identical in both
> implementations, and marking from the route-based active trail is still the answer. But two
> consequences follow: the `libraryOverrides` comment must name *both* mechanisms, not just the JS
> one; and the `javaScriptEnabled: false` test, while still a valid mechanism pin (it is red today and
> rules out a JS-only fix), is **not** the server-vs-client discriminator this ticket implied — both
> the JS-enabled and JS-disabled cases are red for the same reason and will go green together.

The chain, as verified in core:

1. `web/themes/custom/interstate_85/components/site-header/site-header.component.yml` (`libraryOverrides.dependencies`)
   pulls in `core/drupal.active-link`, because core's default `menu.html.twig` does not mark
   active-trail links server-side at all. That comment is accurate about *today*; this ticket makes
   part of it obsolete and it must be corrected as part of the work.
1b. `ActiveLinkResponseFilter::setLinkActiveClass()` applies the same rule server-side, on every
   response, whether or not any JS runs. This is what actually marks the nav on `/` and `/songs`
   today.
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
3. **Do NOT re-implement the front page.** *(Rules 3 and 4 rewritten 2026-07-26 during implementation
   — see the Background correction. As originally written they instructed the implementer to
   special-case `<front>` in the preprocess and bubble a `url.path.is_front` cache context via a theme
   `hook_block_build_alter()`. Both instructions were consequences of the same wrong premise, and both
   were dropped.)*

   The Home link is `route:<front>` (INT8-017 Notes) while the route match on `/` is
   `i8_services.front`, so `in_active_trail` is indeed **false** for Home on `/`. But
   `ActiveLinkResponseFilter` already handles that with its own `isFrontPage()` branch (~line 103), it
   already works today, and — being a **response filter** — it runs *after* render caching, per
   request, so it needs no cache context at all. Re-doing that work in the preprocess would create a
   correctness problem that core does not have. Mark from `in_active_trail` only, and leave `/` to
   core.
4. **No new cache context is needed.** The menu block is render-cached with
   `route.menu_active_trails:main`, which already varies by exactly the signal rule 1 uses — so rule 1
   is free. With rule 3 gone there is no remaining dimension to cover.

   Recorded because it cost real investigation: a theme **cannot** implement `hook_block_build_alter()`
   at all. `BlockViewBuilder` invokes it through `ModuleHandler::alter()` (BlockViewBuilder.php ~line
   91), which is modules-only; the only alters that reach themes are those explicitly routed through
   `ThemeManager::alter()` — `css`, `js`, `js_settings`, `library_info`, `form`/`form_FORM_ID`,
   `element_info`, `page_attachments`, and two `views_ui` ones. So had a cache context genuinely been
   required, the mechanism this ticket originally prescribed would have failed silently.
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
- [x] `/songs?type=Modest%20Mouse` renders the SONGS nav link with `class` containing `is-active` and
      `aria-current="page"`, and it shows the teal current-section underline.
- [x] The same holds for `/songs?type=All&alt=0` (both documented parameters at once) and for
      `/songs?type=NoSuchType` (the no-results state — still the Songs section).
- [x] `/songs` with no query string is unchanged: still marked, still exactly one marked nav item.
- [x] `/` still marks Home and only Home (the `<front>` case, rule 3) — the existing assertion in
      `front-page-nav.spec.ts` keeps passing.
- [x] On `/songs?type=…` the Home link is **not** marked — no `is-active`, no `aria-current`.
- [x] The marking is present in the server response, i.e. it holds with JavaScript disabled.
- [x] At 320px the mobile open panel shows the left-border accent on SONGS on a filtered URL
      (`li:has(a[aria-current="page"])`, site-header.css).
- [x] The `site-header.component.yml` `libraryOverrides` comment no longer claims the JS library is
      what marks the nav.
- [x] The default gate (`lando test`) passes with zero warnings — PHPCS/PHPStan clean on the new
      preprocess/alter hooks, boundary check 0 violations.
- [x] `lando playwright` green (same known Firefox `pw`-service gap recorded in INT8-018/027).
- [x] Ticket status + notes and BOARD.md row updated in the same commit.
- [x] **(round 2)** A song page (`/songs/<song>`) marks SONGS and only SONGS, with the same underline
      as the landing page, and with JavaScript disabled.
- [x] **(round 2)** `/user/login` and other unrelated routes still mark nothing — the descendant-path
      trail must not leak beyond the section.

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

## QA steps
- [x] Open `/songs` → **SONGS** in the top menu carries the teal underline. Now use the **type filter**
      (or the Alternate-titles Show/Hide toggle) → the underline **stays**. Before this fix it vanished
      the moment any filter was applied.
- [x] Try `/songs?type=All&alt=0` (both filters at once) and a type with no matches → still underlined;
      you are still visibly in the Songs section even on the "no songs match" screen.
- [x] Check **HOME** is *not* underlined on any of those filtered Songs URLs, and that `/` still
      underlines **HOME** and only Home.
- [x] At **320px**, open the mobile menu on a filtered Songs URL → the SONGS row shows the teal
      left-border accent.
- [x] The marking is in the page source, so it survives with JavaScript off and does not flicker in
      after load.
- [x] **Click through from the list into an individual song** → SONGS stays underlined there too, and
      keeps the underline if you then go back and re-filter. Check a non-Songs page (`/user/login`)
      still shows nothing marked.

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

- 2026-07-26 — implemented. The whole fix is one preprocess function,
  `interstate_85_preprocess_menu__main()`: for each top-level item with `in_active_trail`, merge
  `is-active` + `aria-current="page"` into the link's own `Url` attributes, which `LinkGenerator`
  renders onto the `<a>`. No CSS changed, no markup changed, no new tokens — the current-section
  treatment already existed and was correct; only the marking it keys off was reaching the wrong pages.

  **Independent test authorship.** The ten new Playwright tests (extending `front-page-nav.spec.ts`)
  were written by a separate model from this ticket and the existing code alone. Seven were confirmed
  red for the right reason first — the locator resolved to the real anchor
  (`<a href="/songs" data-drupal-link-system-path="songs">Songs</a>`) on a 200 response, with a
  genuinely empty class attribute — and three are unchanged-behaviour guards that are green by design,
  which the author flagged explicitly rather than dressing up as failing tests. Their shared
  `expectOnlySongsMarked()` helper asserts all four DoD facets at once, including *exactly one* marked
  nav item, so an implementation that marked everything would still fail.

  **This ticket's own Background was wrong, and the test author caught it.** See the correction
  blockquote above: `ActiveLinkResponseFilter` — core's server-side "PHP implementation of the
  drupal.active-link JavaScript library" — is what marks the nav today, not `active-link.js`. The
  diagnosis and the fix survived intact (both implementations are query-exact in the same way), but two
  of the ticket's own instructions did not, and rules 3 and 4 were rewritten before implementing rather
  than silently ignored:

  - **The front-page special case was dropped.** `ActiveLinkResponseFilter` already handles `/` with its
    own `isFrontPage()` branch, and being a *response* filter it runs after render caching, per
    request. Re-implementing it in preprocess would have introduced a cache-correctness problem core
    doesn't have.
  - **The `url.path.is_front` cache context was dropped with it** — with the front-page branch gone
    there is nothing left for it to cover, since `route.menu_active_trails:main` (already on the menu
    block) varies by exactly the signal the fix uses.

  Worth recording because it cost real investigation and would have failed *silently*: **a theme cannot
  implement `hook_block_build_alter()` at all.** `BlockViewBuilder` invokes it through
  `ModuleHandler::alter()`, which is modules-only; the only alters that reach themes are those routed
  explicitly through `ThemeManager::alter()` (`css`, `js`, `js_settings`, `library_info`,
  `form`/`form_FORM_ID`, `element_info`, `page_attachments`, and two `views_ui` hooks). Had a cache
  context genuinely been needed, the mechanism this ticket originally prescribed would have done
  nothing at all, with no error.

  **The two mechanisms compose cleanly, by core's design.** Since the preprocess now marks the link
  server-side and `ActiveLinkResponseFilter` still runs afterwards, `/songs` (no query) is marked
  twice — except it isn't: the filter reads the existing class first and sets
  `$add_active = !in_array('is-active', explode(' ', $class))` under the comment *"Ensure we don't set
  the 'active' class twice on the same element"*. Verified in the real response: exactly one
  `is-active`, one `aria-current="page"`. Keeping `core/drupal.active-link` (rule 5) is therefore
  genuinely harmless, and the `libraryOverrides` comment was rewritten to describe it as a redundant
  secondary marker naming *both* of core's implementations.

  **Two spec drifts spotted by the test author, neither in scope here, both worth a ticket:**
  `api-contract.md` §2.1 writes the type value as "Side Projects" while the real term (and
  `songs-landing.spec.ts`) is "Side projects"; and Tailwind's preflight sets `border-style: solid;
  border-width: 0` on every element, which makes any test asserting `border-left-style === 'solid'`
  vacuous — the author switched to asserting a non-zero width and a non-transparent colour instead.

  **Verification.** Default gate green (58 PHPUnit, PHPCS, PHPStan, boundary check — theme-only change,
  so the PHP suite is unchanged). Full Playwright suite **69/69 on chromium**, including all 13
  front-page-nav tests. The ticket's own one-line sanity test now returns `1` where it returned `0`:
  `curl -s 'http://interstate-8-5.lndo.site/songs?type=All' | grep -c 'aria-current="page"'`. Firefox
  remains unrunnable in the `pw` container (`ENOENT … /ms-playwright/firefox-1532/firefox/lock`) for
  every spec in the repo — a pre-existing environment gap, unchanged by this work.

- 2026-07-26 — **review round 2: song pages, and a fair challenge to the whole approach.** The site
  owner asked two things after reading the code: why any custom code was needed when "Drupal handles
  the active trail pretty well by default", and why SONGS goes unmarked on `/songs/<song>` when songs
  live under `/songs/*`. Both were verified rather than answered from memory.

  **On the amount of custom code — the challenge was justified, and the answer is not flattering.**
  Core *does* ship this: `starterkit_theme`'s `menu.html.twig` (line 43) adds
  `item.in_active_trail ? 'menu-item--active-trail'` to the `<li>`, route-based and therefore immune to
  query strings by construction. This theme was generated from starterkit (INT8-005) but did not keep
  that template, and `interstate_85.info.yml` declares `base theme: false`, so nothing supplies it — we
  fall through to core's bare `system/templates/menu.html.twig`, which renders `<li{{ item.attributes }}>`
  with no classes at all (confirmed in the response: plain `<li>`). So the original defect existed
  because the theme had *lost* a standard core class, and round 1 re-created its effect in PHP instead
  of restoring it.

  Kept the preprocess anyway, for one concrete reason: `menu-item--active-trail` is a class only. The
  `aria-current="page"` NFR-1 wants comes solely from `ActiveLinkResponseFilter`, which is the
  query-exact mechanism that was broken — so restoring the template would fix the underline and leave
  the *programmatic* current-ness still missing on filtered URLs, while also needing new CSS selectors
  in two places. The preprocess sets exactly what core's own marker sets, on the same element, so no
  CSS moved at all. Decision confirmed with the site owner. The round-1 comment was ~30 lines against
  ~15 lines of code; trimmed to the essentials, since several of those lines were justifying
  alternatives that are now recorded here instead.

  **On song pages — real defect, and core genuinely does not handle it.** `/songs/aeiou-and-sometimes-why`
  had zero `aria-current="page"`. The intuition that `/songs/*` nesting should be enough is reasonable
  but wrong: core's active trail is **route**-based, not path-based —
  `MenuActiveTrail::doGetActiveTrailIds()` says *"If a link in the given menu indeed matches the
  route"*. A song page is `entity.node.canonical`; the Songs menu link is `view.songs.page_1`. The URLs
  nest, the routes do not, and core has no concept of one URL sitting beneath another. This is a
  long-standing gap, which is why `drupal/menu_trail_by_path` exists.

  Installed `drupal/menu_trail_by_path` 2.2.0 (D11-ready) at its defaults (`trail_source: path`,
  `max_path_parts: 0`) and exported its config. Chosen over adding a path-prefix check to the
  preprocess because it fixes the problem at the **trail** level rather than the marking level: the
  preprocess needed no change at all, anything else that consumes the trail (breadcrumbs, any future
  menu block) is correct too, and every future section — discography, tour dates, news — is covered
  without its own hand-rolled rule. The alternative would have been URL-string matching, which this
  ticket's own rule 1 deliberately rejected.

  **Tests first, as usual, but self-authored this round** — three new Playwright tests, confirmed red
  before installing the module. The independent-authorship split was skipped deliberately: the
  implementation here is "install a contrib module", so there is no logic of mine for a self-written
  test to be shaped around, and the assertions are purely behavioural. They reuse the existing
  `expectOnlySongsMarked()` helper, so the song page is held to the same standard as the filtered
  URLs including "Home is not marked instead"; the song URL is read out of the ledger rather than
  hardcoded, since no individual slug is a contract. The third asserts the marking survives with
  JavaScript disabled, and a fourth angle — that `/user/login` still marks nothing — guards against the
  descendant-path trail leaking beyond the section.

  **Verification.** Default gate green. Full Playwright suite **72/72 on chromium** (up 3). Verified
  live across all four cases: song page marked, `?type=All` marked, `/` marks Home, `/user/login` marks
  nothing. `composer.json`/`composer.lock` now carry `drupal/menu_trail_by_path`; config exported.

**2026-07-27 — correction (INT8-036).** The "known Firefox `pw`-service gap" cited in this ticket's DoD
and the "unrunnable... pre-existing environment gap" note above were both wrong: the real cause was a
dangling profile-lock symlink left by a process killed on 2026-07-20, not a missing binary or a
scaffolding-era gap (INT8-006 itself records Firefox passing). Fixed in INT8-036; the full matrix is now
545/545 with Firefox included.
