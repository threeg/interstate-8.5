---
id: INT8-034
title: Correct the theme's starterkit provenance record and restore the menu active-trail template
type: task
status: todo
milestone: 9
batch: cleanup
layer: theme
depends_on: [INT8-005, INT8-031]
implements: []
tests_required: true
estimate: 2
---

## In plain English
Our theme was supposed to be built by Drupal's official theme generator, and our notes say it was.
It wasn't quite — it was assembled by hand, and one step got missed: the generator normally copies
about eighty ready-made page templates into the theme, and we have three. Nothing is broken, but it
means our own written record is wrong, and anyone trusting it will keep hitting small surprises where
a standard Drupal feature turns out to be missing. This corrects the record, writes down exactly what
we do and don't have, and restores the one missing piece that has already cost us time.

## Background

Raised during review of INT8-031, whose round-2 note discovered the symptom without chasing the cause:
the theme "was generated from starterkit (INT8-005) but did not keep that template".

**`base theme: false` is correct and must not change.** `web/core/themes/starterkit_theme/starterkit_theme.info.yml`
declares `'base theme': false` itself. That is the whole design of the starterkit model: you do not
inherit a base theme, and in exchange the generator **copies its ~84 templates into your theme** so you
own the markup and core can never change it underneath you. No-inheritance is the price; owning the
copies is the thing you buy with it.

This theme paid the price and skipped the purchase. INT8-005's own notes record why:

> core `generate-theme` script incompatible with recommended-project vendor layout; manual scaffold is
> equivalent

The manual scaffold was **not** equivalent. It carried over `base theme: false` but not the templates.
`web/themes/custom/interstate_85/templates/` holds **3** templates (`page.html.twig`,
`block--system-branding-block.html.twig`, `views-view--songs.html.twig`). Everything else falls through
to core's raw **module** templates, which are deliberately class-less.

Measured, not assumed — every one of starterkit's 84 templates differs from the module fallback the
theme actually uses: **77 differ in content, 7 have no module fallback at all** (those degrade to a
generic template — `block.html.twig`, `links.html.twig`, `item-list.html.twig`, `field.html.twig` — so
nothing fails to render).

**The loss is far smaller than "81 missing templates" sounds, and this ticket must not overreact to it.**
The accessibility semantics are *not* missing: `role="contentinfo"`, `aria-label`, `aria-labelledby`,
`aria-current` and the visually-hidden pagination heading are all already in core's module templates.
Diffing the a11y-sensitive ones (`status-messages`, `pager`, `views-mini-pager`, `item-list`) shows
starterkit's additions there are **purely CSS hooks** — `messages--error`, `pager__item`, an extra
`item-list` wrapper `<div>`. For a Tailwind + SDC theme that styles its own components, most of those
hooks are dead weight we would then own and have to maintain. **Bulk-copying all 84 templates would be
worse than the status quo.**

What is genuinely load-bearing is a short, enumerable list: the templates whose classes carry **state**
rather than decoration. There are five:

| Starterkit template | State class | Verdict |
|---|---|---|
| `navigation/menu.html.twig` | `menu-item--active-trail` | **Restore** — this is the one that cost INT8-031 real investigation |
| `navigation/pager.html.twig` | `pager__item is-active` | Deferred — named trigger below |
| `views/views-mini-pager.html.twig` | `pager__item is-active` | Deferred — named trigger below |
| `dataset/table.html.twig` | `is-active` on the sorted column | Not needed — no sortable table View exists |
| `navigation/menu-local-task.html.twig` | `is-active` tab | Not needed — admin runs on Gin; no local-tasks block is placed on the front end |
| `views/views-view-summary*.html.twig` | `is-active` | Not needed — no summary/attachment display exists |

The two pager templates are **deliberately deferred**, per the root `CLAUDE.md` lazy-adoption rule: no
View paginates today (`config/sync/views.view.songs.yml` sets `pager: type: none`), so copying them now
would be speculative and — with no pager to render — untestable, which red-green will not accept. They
are recorded as a **named trigger** instead, so the next person follows a checklist rather than
rediscovering the problem the way INT8-031 did.

## Technical requirements

Files to create or modify:

- `web/themes/custom/interstate_85/templates/menu.html.twig` — **new.** Copy verbatim from
  `web/core/themes/starterkit_theme/templates/navigation/menu.html.twig`. Do not hand-write it and do
  not edit it while copying; the point is to restore core's standard markup exactly.
- `spec/tickets/INT8-005-theme-starterkit-tailwind.md` — correct the `## Notes` claim that the manual
  scaffold "is equivalent". Append a dated correction; **do not rewrite history in place** — the
  original sentence stays visible with the correction beneath it, the same way INT8-031 handled its own
  wrong Background.
- `spec/architecture/architecture.md` §2.5 — the phrase "owned **starterkit-generated** theme" is
  likewise inaccurate. Correct it and add a short **theme provenance** paragraph carrying the table
  above, so the enumerated gap list lives in the binding spec rather than only in a closed ticket.
- `tests/playwright/tests/front-page-nav.spec.ts` — the nav suite (see `## Tests / verification`).

Rules the implementation must honour:

1. **Do not change `base theme: false`.** It is correct. Any change here means the diagnosis was
   misread; re-read the Background.
2. **Do not bulk-copy the other 80 templates.** Copy exactly the one named above. The three verdicts of
   "not needed" in the table are decisions with stated reasons, not oversights — if one of them is
   revisited it needs its own ticket and its own trigger.
3. **Do not touch INT8-031's `interstate_85_preprocess_menu__main()`.** The restored template marks the
   `<li>`; the preprocess marks the `<a>` with `is-active` + `aria-current="page"`. They are
   complementary, not duplicative — `menu-item--active-trail` is a class only and cannot supply the
   `aria-current` that NFR-1 wants, which is precisely why INT8-031 kept the preprocess after finding
   the missing template. Removing either one regresses something.
4. **No CSS change, and no new selectors keyed off `menu-item--active-trail`.** The current-section
   treatment already works via the `<a>`. This ticket restores a standard hook for future menus (the
   footer menu, INT8-026; any later section nav) — it does not restyle anything today. If a CSS change
   seems necessary, the diagnosis is wrong.
5. **Watch for markup collisions.** The copied template also adds `class="menu"` to the `<ul>` and
   `menu-item` to every `<li>`, on *every* menu in the theme, not just the primary nav. The existing
   `site-header.css` selectors (`.site-header__nav li:has(.is-active)`, ~line 269) are additive-safe,
   but the full Playwright suite is the guard — it must stay green, not merely the new assertions.

**Named trigger (record, do not implement here):** when the first paginated View lands — discography,
tour dates or news, whichever ships first — that ticket copies
`web/core/themes/starterkit_theme/templates/navigation/pager.html.twig` and
`views/views-mini-pager.html.twig` into the theme as part of its own work, and tests the
`pager__item is-active` marking with a real pager. Record this in the architecture §2.5 provenance
paragraph so it is found by the person who needs it.

Out of scope: `base theme` itself; the other 80 starterkit templates; the three "not needed" rows;
any CSS or token change; INT8-031's preprocess and `menu_trail_by_path`; the footer menu (INT8-026).

## Definition of done (acceptance criteria)
- [ ] `web/themes/custom/interstate_85/templates/menu.html.twig` exists and is byte-identical to
      `web/core/themes/starterkit_theme/templates/navigation/menu.html.twig`.
- [ ] On `/songs`, the SONGS `<li>` carries `menu-item--active-trail`, and the `<ul>` carries `menu`.
- [ ] The same holds on `/songs?type=Modest%20Mouse` and on a song page — i.e. the restored template
      agrees with the route-based trail INT8-031 established, including via `menu_trail_by_path`.
- [ ] INT8-031's marking is untouched: the `<a>` still carries `is-active` and `aria-current="page"`,
      still exactly one marked nav item, still present with JavaScript disabled.
- [ ] `/` still marks Home and only Home; `/user/login` still marks nothing.
- [ ] No CSS file changed anywhere in the diff.
- [ ] `interstate_85.info.yml` still declares `base theme: false` — unchanged in the diff.
- [ ] INT8-005's `## Notes` carries a dated correction of the "manual scaffold is equivalent" claim,
      with the original sentence still visible.
- [ ] `spec/architecture/architecture.md` §2.5 no longer calls the theme "starterkit-generated" without
      qualification, and carries the provenance paragraph, the five-row state-class table, and the
      named pager trigger.
- [ ] The default gate (`lando test`) passes with zero warnings.
- [ ] `lando playwright` green — the **whole** suite, not just the new tests (rule 5).
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: true`. This is a markup change to every menu in the theme, with a directly observable
DOM assertion, so no exemption applies. Red-green is binding: write the assertions first and confirm
they fail because `menu-item--active-trail` is absent from the `<li>` (not because a locator is wrong)
before copying the template.

Add to **`tests/playwright/tests/front-page-nav.spec.ts`**, alongside INT8-031's cases, reusing that
file's existing `nav.site-header__nav a` locator style and its `expectOnlySongsMarked()` helper.

Assertions to add:
1. `/songs` → the SONGS `<li>` has class `menu-item--active-trail`; Home's `<li>` does not. **Red today.**
2. `/songs?type=Modest%20Mouse` → same, proving the restored template is route-based and survives query
   strings by construction (the original INT8-031 defect).
3. A song page (URL read from the ledger, not hardcoded — no individual slug is a contract) → same,
   proving it agrees with `menu_trail_by_path`.
4. An unchanged-behaviour guard: INT8-031's `<a>`-level `is-active` + `aria-current="page"` still hold
   on all three, and there is still **exactly one** marked nav item. Flag this one explicitly as green
   by design rather than dressing it up as a failing test.

Command: `lando test` then `lando playwright` (separate services — test-strategy §2.2).

One-line sanity test once implemented:
`curl -s 'http://interstate-8-5.lndo.site/songs?type=All' | grep -c 'menu-item--active-trail'` → `1`
(it is `0` before the change, which is the gap).

## QA steps
- [ ] Open `/songs` → the SONGS underline looks **exactly** as it does today. This ticket restores a
      markup hook, not a visual change; if anything moved, shifted or restyled, that is a regression.
- [ ] Check the same on a filtered URL (`/songs?type=All&alt=0`) and on an individual song page.
- [ ] At **320px**, open the mobile menu → the SONGS row still shows the teal left-border accent,
      unchanged.
- [ ] `/` still underlines HOME and only HOME; `/user/login` still shows nothing marked.
- [ ] View source on `/songs` → the SONGS `<li>` now carries `menu-item--active-trail` *in addition to*
      the `<a>`'s existing `is-active` / `aria-current="page"`. Both should be present.

## Notes
- 2026-07-26 — created. Raised by the site owner after INT8-031, asking whether `base theme: false` was
  "costing us in the long run". Investigated rather than answered from memory: `base theme: false` is
  correct (starterkit declares it itself), the missing template *copies* are the real gap, and the gap
  is much narrower than it first appears — the a11y semantics live in core's module templates and are
  intact, leaving five state-bearing templates of which one is worth restoring now.
- Filed to the cleanup backlog rather than the main sequence (CONVENTIONS §6.6): it improves the
  internal quality and the honesty of the record for already-shipped INT8-005/INT8-031 behaviour, and
  implements no new requirement (`implements: []`). This is the same category as INT8-023 (reconciling
  the INT8-001 DDEV→Lando record) — deliberately *not* the INT8-027/029/031 category, none of which
  applies here because no `FR`/`NFR` is currently served incorrectly.
- `depends_on` lists INT8-005 (the ticket whose record it corrects and whose scaffold it completes) and
  INT8-031 (whose preprocess it must compose with, not replace). Both are `done`.
- The measurement behind the Background is reproducible: diff each file in
  `web/core/themes/starterkit_theme/templates/` against the same-named template under
  `web/core/modules/*/templates/` — 77 differ, 7 have no counterpart, 0 are identical.
