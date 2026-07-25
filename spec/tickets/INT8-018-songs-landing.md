---
id: INT8-018
title: Songs landing (View + filters + ledger)
type: story
status: in-review
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-013, INT8-015, INT8-016]
implements: [FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-16, FR-18, FR-19]
tests_required: true
estimate: 5
---

## In plain English
The song list: every song on one page as a clickable link, filterable by band/group and by whether to
show alternate titles — the complete body of work at a glance.

## User story
As a fan
I want to browse the complete song catalogue with filters
so that I can find any song and see the whole body of work at once.

## Acceptance criteria

**Scenario 1: complete list**
- Given the songs are imported
- When I open `/songs`
- Then every song **except** those flagged `field_exclude_from_list` shows as a text link (FR-6)
- And the whole list is on one page, no pagination (FR-7)
- And it is sorted alphabetically ignoring a leading "A/An/The" (FR-8).

**Scenario 2: type filter**
- Given the landing
- When I first load it
- Then the Type filter defaults to **Modest Mouse** (FR-9)
- And choosing another type (or *All*) narrows the list; filters combine (FR-18).

**Scenario 3: alternate-titles + disabled filters**
- Given the landing
- When Alt-titles = Show (default) then Hide
- Then alternate-title versions appear (marked) / are hidden (FR-10)
- And the *Released* and *Played live* controls render **disabled** ("coming soon") (FR-11).

**Scenario 4: empty state**
- Given a filter combination with no matches
- Then an explicit "no songs match" + reset shows, not a blank list (FR-19).

## Technical approach
- A **View** (page at `/songs`) with exposed **Type** + **Alt-titles** filters; *Released/Played-live*
  rendered disabled. Excludes `field_exclude_from_list = 1` (FR-6); no pager (FR-7).
- **Route collision to resolve first:** INT8-017 placed a temporary stub controller at `/songs`
  (`i8_services.songs_stub`, `web/modules/custom/i8_services/i8_services.routing.yml`) so the primary
  nav's Songs link had somewhere real to resolve to before this ticket existed. Remove that route (or
  disable/uninstall the parts of `i8_services` that own it) when wiring the real View to the same path —
  two routes can't both claim `/songs`.
- **FR-8 sort:** implement the article-insensitive sort — **Views Sort Expression** (verify D11) or a
  small owned Views sort handler (content-model §6). Decide here; record in Notes.
- Render via the ledger/letter-rail **SDC** (INT8-016) matching `1B.dc.html` (SONGS LANDING); alt badge
  on parented songs. Layer: `theme` + thin `services` for the sort.
- Song links → `/songs/<slug>` (FR-16).

## Design references
- Wireframe: spec/wireframes/02-songs-landing.md (populated / empty states)
- Design system: filter bar, song ledger, alt badge; `1B.dc.html` SONGS LANDING (now includes a
  **SONGS LANDING MOBILE** composition — the 2026-07-21 export refresh added a genuine 375px mockup
  where slice 1 previously only had desktop/tablet/extra-wide) plus the **SONG LEDGER ROW —
  DEFAULT / ALT / HOVER / FOCUS** and **SONGS LANDING — EMPTY / NO RESULTS** precision panels
  (design-system.md §3, decisions log 2026-07-21)

## Tests
- Playwright: list completeness + exclusion (FR-6/7), sort (FR-8), type default + narrowing (FR-9/18),
  alt-titles toggle (FR-10), disabled filters (FR-11), empty state (FR-19), link → song page (FR-16).
- Axe + focus/keyboard on the filter controls (NFR-1); 320px assertion (NFR-2).
- Fixtures: the shared Songs fixture (test strategy §8).

## QA steps
- [x] Open `/songs` → expect all Modest Mouse songs (default), one page, A–Z grouped, no pager.
- [x] Switch Type to All → list grows to 490; switch to any other type → narrows correctly.
- [x] Alt-titles Hide (`?alt=0`) → marked alternates (e.g. "Your Life") disappear; their canonical
      parent (e.g. "Lives") stays.
- [x] Released/Played-live render as real disabled `<select>`s reading "Coming soon", not broken.
- [x] An unrecognised `?type=` value → explicit "No songs match these filters" empty state + a
      "Clear filters" reset link back to `/songs`, never a blank page or an error.

## Definition of done
- [x] Acceptance criteria met
- [x] Playwright + Axe tests added and passing in the default gate; `lando playwright` green (chromium,
      webkit, mobile-chrome, mobile-safari — see Notes for a pre-existing Firefox gap, unrelated to this
      ticket, left for a separate cleanup)
- [x] Tokens-only styling; matches `1B.dc.html` (two small token additions — see Notes)
- [x] View/config exported (site-building parts verified by Claude)
- [x] Ticket status + notes and BOARD.md row updated in the same commit

## Notes
2026-07-25 — Built the real Songs landing View, replacing INT8-017's temporary stub controller at
`/songs` (removed `i8_services.songs_stub` + `PageController::songsStub()`).

**The View (`views.view.songs`), created via the entity API (`View::create()`)** — not hand-authored
YAML, matching NFR-6 and the precedent set by INT8-008/011. `base_table: node_field_data`; filters:
`status=1`, `type=song` (bundle), `field_exclude_from_list_value=0` (FR-6), plus two owned filter
plugins (below); sort via an owned sort plugin (below); `pager: none` (FR-7); `cache: none` (see why
below); `page_1` display at path `songs`.

**FR-8 sort — owned Views sort plugin, not a contrib module.** `content-model.md` §6 named **Views Sort
Expression** as preferred, but a `composer require --dry-run` (done before writing any code) showed it
tops out at Drupal `^10` — no D11-compatible release exists. Built the documented fallback instead:
`i8_services/src/Plugin/views/sort/ArticleInsensitiveTitle.php` (`i8_article_insensitive_title`),
computing `LOWER(CASE WHEN LOWER(title) REGEXP '^(a|an|the) ' THEN SUBSTRING(...) ELSE title END)` as a
raw `addOrderBy()` expression — no stored sort field, matching the content model's own constraint.
Registered against a **new pseudo-field `title_alpha`** (`hook_views_data()`, `real field: title`)
rather than overriding `node_field_data.title`'s own sort handler directly — `title` is a base field
shared by every node type, and Views resolves a handler's *class* from the field's global Views-Data
registration, not from the View's own `plugin_id` config key (a real surprise — see the debugging note
below); overriding it globally would silently change title-sort behaviour for any future, unrelated View
sorting by title. The pseudo-field keeps the effect scoped to views that explicitly ask for it. A
PHP-side mirror (`ArticleInsensitiveTitle::stripLeadingArticle()`) is reused by the theme layer to group
the (already SQL-sorted) rows for the ledger's rail, so the rule exists in exactly one place.

**FR-9/FR-10 — two more owned, non-exposed Views filter plugins**, for the same underlying reason:
`SongTypeFilter` (`i8_song_type_filter`, on `field_song_type_target_id`) and `AlternateTitlesFilter`
(`i8_alternate_titles_filter`, on `field_parent_song_target_id`). Neither uses Views' "exposed filter"
machinery — the filter bar is a hand-built form/links (theme layer) targeting the exact query-string
shapes `api-contract.md` §2.1 already commits to (`type=<Song type name>`, `alt=1|0`), and getting that
literal shape out of the stock handlers proved impractical: `taxonomy_index_tid` (the native "filter by
taxonomy term" handler Drupal registers for `field_song_type`) is term-*ID*-keyed, not name-keyed, and a
Views "grouped filter" can only express a true "no restriction" state via its own internal `All`
sentinel, not an arbitrary literal like `1`. Each plugin instead reads its query parameter directly via
an injected `RequestStack`, overrides `getCacheContexts()` to declare `url.query_args:type`/`:alt` (see
the caching note below), and is registered via `hook_views_data_alter()` swapping the field's registered
filter handler (same "Views resolves the class from Views-Data, not the View's `plugin_id`" mechanism as
the sort). `SongTypeFilter` does a name lookup against the `song_type` vocabulary — DB collation is
case-insensitive, confirmed empirically, so "Side projects" matches the term "Side Projects" without
any extra normalisation — and an **unmatched name is a real, deliberate `IS NULL` (guaranteed-false)
condition**, not a fallback to the default, so a hand-edited bad `?type=` value genuinely empties the
list (FR-19) rather than masking bad input.

**A real spec gap found and fixed, not silently diverged from:** `api-contract.md`'s `type` param table
still spelled the third Song type **"Side projects"** (lowercase p), but INT8-008 corrected the actual
taxonomy term to **"Side Projects"** (capital P, matching the source dump) and never propagated that
back to the contract. Fixed `api-contract.md` to match the term name.

**Two Drupal/framework surprises, worth recording so a future session doesn't re-discover them the
slow way (found via direct SQL dumps and prop-validator unit calls, not guesswork):**
1. **Views resolves a handler's plugin *class* from the field's global Views-Data registration
   (`hook_views_data()`/`_alter()`), never from the View's own stored `plugin_id` key** —
   `ViewsHandlerManager::getHandler()` reads `$definition['id']` from Views Data; the config's
   `plugin_id` is effectively decorative for this purpose. Every one of this ticket's three custom
   plugins needed a matching `hook_views_data_alter()` (or, for the sort, a new pseudo-field) to
   actually get used — setting `plugin_id` in the View config alone silently did nothing (confirmed by
   dumping the built SQL and seeing the stock handler's query, not the custom one).
2. **Views' own result-cache plugin (`cache: {type: tag}`) keys results only by exposed-filter input.**
   Since these three filters/sort read the request directly rather than through that mechanism, Views
   had no way to know results depend on the query string — it silently reused one cached result set
   across every `type=`/`alt=` combination (all requests returned the same 278 rows, cache headers
   showed `X-Drupal-Dynamic-Cache: HIT` even on demonstrably different URLs). Switched `cache: none`;
   Drupal's page/dynamic-page/render caches still layer on top correctly, now that
   `getCacheContexts()` on the filters declares the right `url.query_args:*` contexts.

**A genuine Drupal core bug, reproduced directly (not assumed):** nesting one SDC component's
`{% embed %}` inside *another* component's own Twig template breaks the outer component's prop
validation — it receives the inner embed's context instead of its own, failing with "property X is
required" for props that were demonstrably passed (confirmed via `ComponentValidator::validateProps()`
called directly in isolation, which passed with the identical context that failed inside the template).
Built a `filter-bar` SDC wrapper first, embedding `select-field`/`button`/`segmented-toggle` inside it;
reproduced the failure with literal hardcoded prop values (ruling out a variable-scope issue), then with
the wrapper's own schema reduced to one required string prop matching the already-working `link`
component's shape (ruling out prop count/type) — the only remaining variable was the nested embed
itself, confirmed by stripping it out (passes) and adding it back (fails again). **Fix:** deleted the
`filter-bar` wrapper; its atoms are now embedded as siblings directly in
`views-view--songs.html.twig`, one nesting level flatter. Separately, `{% embed ... only %}` also turned
out to restrict *block content* to the `with` hash, not just the component's own top-level render — an
`options` block looping over an outer variable saw nothing until `only` was dropped from that specific
embed (narrower than plain Twig's documented "blocks always run in the caller's scope"; SDC's own
compiler pass appears to tighten it). Both are recorded in the template's own file comment.

**`segmented-toggle` (INT8-016) gained an optional link mode** (`href_a`/`href_b`, `option_a_label`/
`option_b_label` for the link variant's `aria-label`) — its original button-only markup has no `name`/
`value`/form semantics (by design, presentation-only), which doesn't fit the Alternate-titles control's
actual need: two real destinations, no JS, "a filter change reloads the page." Rendering it as two links
instead keeps the exact visual/CSS treatment while making it a real, working control. Twig block-naming
follows the established button.twig pattern (INT8-016) — one block per slot regardless of branch, with
the `<a>`-vs-`<button>` tag choice hoisted around it — to avoid redefining the same block twice.

**Theme**: `interstate_85_preprocess_views_view__songs()` takes the page fully over from Views' default
field/row rendering — builds the letter-rail/grouped ledger and the filter bar's current state from the
raw `$view->result` and the request, matching `1B.dc.html`'s SONGS LANDING composition exactly (verified
counts below). New `song-ledger` SDC (letter-rail + grouped rows + alt badge, no nested embeds, so it
doesn't hit the bug above). The page-title block (`page_title_block`) is excluded from `/songs` via a
`request_path` visibility condition on `block.block.interstate_85_page_title` — the hero's own overlaid
"Songs" now supplies the page's one `<h1>`, matching how the hi-fi actually composes hero pages (INT8-019
will need the same exclusion for the song-page route; flagged there). The Songs hero photo
(`pexels-hobiphotography-36346406.jpg`) is copied into the theme's own `images/` as a static asset, not
a managed media entity — decorative, non-editorial, identical on every visit. **Known, deliberate
simplification** (not a defect): the hero stays within `.layout-content`'s width cap rather than
breaking out to the full sheet width the extra-wide (>1440px) mockup shows — a true full-bleed
breakout needs more than CSS alone here since `.layout-container` itself is a centered, capped sheet;
low-impact (only affects very wide viewports) and easy to revisit as a follow-up, matching the
INT8-027-style pattern for small shipped-but-imperfect visual gaps.

**Verified against the real, already-migrated 492-song dataset** (this project has no separate small
curated Playwright fixture — FE tests run against the real imported content, consistent with how
INT8-013/014's migration verification already worked against the real `legacy` DB rather than a
fixture): 490 listed (492 minus 2 excluded); by type — Modest Mouse 278 (254 canonical + 24 alt), Ugly
Casanova 26, Side Projects 175, Covers 11 (sums to 490); all 24 alternates are Modest Mouse ones, so
Ugly Casanova/Side Projects/Covers are unaffected by the Alt-titles toggle; the "Lives" (canonical) /
"Your Life" (alternate) pair behaves exactly per FR-10; "Lucky Me Again (2006/11/05)" (excluded) never
appears under any filter combination tested; "The Cold Part" and "A Different City" sort by their second
word ("Cold Part", "Different City"), proving the sort is genuinely article-insensitive, not naive.

**Independent test authorship**: the failing Playwright spec (`tests/playwright/tests/songs-landing.spec.ts`)
was written by a separate model from the ticket + `api-contract.md` + `test-strategy.md` + the
wireframe only, before any implementation code existed, per this project's independent-authorship
model split — confirmed red against the pre-existing stub controller, then implemented to green.

Default gate green (10 PHPUnit — unchanged, no new PHP unit tests needed for this layer per the test
strategy's Playwright-is-the-bulk approach; PHPCS/PHPStan clean on the three new plugins and the theme
preprocess; boundary check 0 violations — `i8_services`/`interstate_85` stay on their correct sides of
the dependency rule). `lando playwright`: all 26 Songs-landing tests plus the full existing suite pass
on chromium, webkit, mobile-chrome and mobile-safari (104/104). **Firefox fails across every spec file
in the suite** (not just this ticket's) with `browserType.launch: ENOENT ... firefox/lock` — the
Firefox binary is missing from the `pw` service, and even `npx` isn't on `PATH` there via `lando ssh`; a
pre-existing tooling gap from scaffolding (INT8-006), not something this ticket introduced or is scoped
to fix. Config exported cleanly (`views.view.songs` new, `block.block.interstate_85_page_title`
updated); `lando drush cim -y` no-op.

**Summary:** `/songs` is now a real, filterable catalogue of all 490 listed songs, grouped A–Z with a
letter rail, defaulting to Modest Mouse with alternates shown — exactly the "whole body of work at a
glance" the ticket asks for, with Type/Alt-titles genuinely functional and Released/Played-live
correctly reading as "coming soon."

**Sanity test:** `curl -s http://interstate-8-5.lndo.site/songs | grep -c 'href="/songs/'` → `278`
(Modest Mouse default); `curl -s '...?type=All' | grep -c 'href="/songs/'` → `490`;
`lando drush cim -y` → "There are no changes to import."
