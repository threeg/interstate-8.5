---
id: INT8-035
title: Move the theme's entity queries and loads into the services layer
type: task
status: in-review
milestone: 9
batch: cleanup
layer: services
depends_on: [INT8-018, INT8-020]
implements: []
tests_required: true
estimate: 3
---

## In plain English
Two of the theme's template-preparation functions currently go and fetch data from the database
themselves. That's the job of the module layer, not the theme — the theme is supposed to be handed
data and just decide how it looks. Moving the fetching into a proper service makes it testable on its
own (right now it can only be checked by loading a whole page in a browser) and reusable if anything
else ever needs the same information.

## Background
Raised by the site owner reviewing INT8-020: *"I noticed you've got DB queries in the .theme file in a
preprocess hook… isn't that bad practice?"* It is, and it is also a direct violation of this project's
own architecture rule rather than a general style opinion.

`architecture.md` §2.1 fixes the layering as `content-model → services → theme`, and is unusually
specific about which side this work falls on:

| Layer | May import / depend on | Notes |
|-------|------------------------|-------|
| `services/` | `content-model` | Custom-module logic (e.g. filter/sort helpers, **version-display logic**). |
| `theme/` | consumes rendered content | SDC components, Twig templates, Tailwind. |

"Version-display logic" is almost verbatim what `interstate_85_preprocess_node__song()` does. The theme
is specified as *consuming* rendered content, not querying for it.

**Two call sites, both in `web/themes/custom/interstate_85/interstate_85.theme`:**

1. `interstate_85_preprocess_views_view__songs()` (INT8-018) — loads the `song_type` vocabulary's terms
   directly (`getStorage('taxonomy_term')->loadByProperties(...)`, ~line 198) to build the filter bar's
   Type dropdown, and reshapes the View's raw result rows into the ledger's grouped structure.
2. `interstate_85_preprocess_node__song()` (INT8-020) — resolves a song's parent, renders the *parent's*
   `field_lyrics` through `getViewBuilder('node')->viewField()`, and runs a reverse entity query
   (`getStorage('node')->getQuery()->condition('field_parent_song', …)`, ~line 269) plus
   `Node::loadMultiple()` to find the song's alternate versions.

**INT8-020 followed INT8-018's precedent rather than inventing this**, which is why both move together
in one ticket: fixing only the newer one would leave the theme half-compliant and the rule still
visibly broken, and the two share the same target module (`i8_services`) and the same testing win.

**Why the default gate did not catch it.** `tooling/check-boundary.sh` enforces the dependency rule by
grepping `use` statements *between custom modules* — "no module imports `Drupal\interstate_85\*`",
"`*_migrate` must not import `*_services`", and so on. It has no rule that could ever fire here,
because theme code does not `use`-import anything: it reaches the container dynamically via
`\Drupal::entityTypeManager()`. So this is a genuine blind spot in the check, not a rule the check
decided to allow — see the DoD below, which closes it.

**Costs this is actually fixing** (not style points):

- **Untestable in isolation.** A procedural function in a `.theme` file cannot be unit- or kernel-tested;
  it can only be exercised by rendering a whole page. That is exactly why every assertion covering this
  logic today is a Playwright browser test — including things like "which songs are this song's
  alternates", which is pure data logic and has no business needing a browser to verify.
- **Not reusable.** If a block, a future JSON:API/REST surface, a Views field, or a second view mode
  ever needs "this song's alternates", the logic is stranded in the theme and would be copied rather
  than called.
- **Wrong direction of dependency.** Entity queries are content-model knowledge; `services` may depend
  on `content-model`, `theme` may not.

## Technical requirements

Create the services-layer home and move the logic; the theme keeps only presentation shaping.

1. **New service in `i8_services`** — e.g. `Drupal\i8_services\SongVersions` (registered in
   `i8_services.services.yml`, constructor-injected `EntityTypeManagerInterface`), exposing the two
   genuine data questions:
   - `getParent(NodeInterface $song): ?NodeInterface`
   - `getAlternates(NodeInterface $song): NodeInterface[]` — the reverse query, published-only, sorted
     by title, access-checked.
   Whether the Type-options lookup for the filter bar lives on the same service or its own (e.g.
   `SongTypeOptions`) is the implementer's call — one service per genuine concern, not one per call
   site.
2. **The theme's preprocess functions become thin.** They may call the service and shape the result for
   Twig (URLs, labels, the grouped/rail structures, `viewField()` for rendering); they must no longer
   contain `getQuery()`, `loadByProperties()`, `loadMultiple()` or `::load()`.
   - **`viewField()` may stay in the theme.** It is a *render* concern (it turns an already-resolved
     entity's field into a render array), not a data lookup — the rule being enforced is about fetching,
     not rendering. Say so in the code comment so a later reader doesn't "finish the job" wrongly.
3. **Cacheability must survive the move.** INT8-020's preprocess currently adds the parent's and each
   alternate's cache tags plus the `node_list` tag (for "a new alternate was added elsewhere"). Whether
   the service returns cacheability alongside its data or the theme keeps applying it, the rendered page
   must end up with the same tags it has today — verify against the real response, not by reading the
   code.
4. **Close the boundary-check blind spot.** Extend `tooling/check-boundary.sh` with a rule that fails if
   the custom theme contains direct entity-storage/query calls, so this cannot silently regress. Keep it
   narrow and explicit — target the storage/query API (`getStorage(`, `getQuery(`, `loadMultiple(`,
   `loadByProperties(`, `::load(`), and deliberately do **not** blanket-ban `\Drupal::`, which the theme
   legitimately uses for `\Drupal::request()` and the like.

Out of scope: the song-versions *view* redesign (`spec/TODO.md` — this ticket must not change what any
page looks like); rewriting the Songs landing's grouping/sorting rules (INT8-029's
`ArticleInsensitiveTitle` stays exactly as it is); any config change.

## Definition of done (acceptance criteria)
- [x] `interstate_85.theme` contains no `getStorage(`, `getQuery(`, `loadMultiple(`,
      `loadByProperties(` or `::load(` call.
- [x] The moved logic lives in `i8_services` with constructor-injected dependencies (no `\Drupal::`
      static calls in the new service).
- [x] `tooling/check-boundary.sh` gains a rule that fails on entity-storage/query calls in the custom
      theme, and is confirmed to FAIL against the pre-move code (check out the old file, run it, see it
      go red) before being confirmed green after — a check nobody has watched fail is not a check.
- [x] New PHPUnit coverage for the moved logic — in particular `getAlternates()`, which is the piece
      that currently needs a browser to verify at all. Red-green per the test strategy.
- [x] The rendered pages are byte-for-byte equivalent where it matters: `/songs`, a plain song page, an
      alternate-version page and a parent page all render the same content as before, and the response's
      cache tags are unchanged (compare real responses before/after, per requirement 3).
- [x] Full Playwright suite still green — the existing `songs-landing`, `song-page` and `song-versions`
      specs are the regression net for this move and must pass **unmodified**. Needing to edit them
      would mean behaviour changed, which this ticket forbids.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true` — this is a refactor, so the bar is *behaviour-preserving*, and the existing
Playwright suites are the safety net rather than the deliverable. The new value is PHPUnit coverage of
logic that has never had any: `getAlternates()` and `getParent()` are pure entity-relationship
questions and should be kernel-tested directly (a song with two alternates, a song with none, an
unpublished alternate correctly excluded, an alternate whose parent is unpublished/deleted).

Command: `lando test` then `lando playwright` (separate services — test-strategy §2.2). The
boundary-check requirement above has its own explicit red-then-green step; do not skip it, since a
guard that has only ever been observed passing may be matching nothing at all — exactly the class of
inert check INT8-033 was filed for.

## Notes
- 2026-07-26 — created. Raised by the site owner during INT8-020's review; confirmed against
  `architecture.md` §2.1 (which names "version-display logic" as services-layer work almost verbatim)
  and against `tooling/check-boundary.sh` (read in full — it greps `use` statements between modules, so
  it structurally cannot catch a dynamic `\Drupal::entityTypeManager()` call in a `.theme` file).
- Cleanup backlog rather than the main sequence: it improves the internal structure of behaviour that is
  already shipped and already correct, and changes nothing a user can see (CONVENTIONS §6.6) — the same
  reasoning as INT8-032/033/034, and the opposite of what put INT8-027/029/031 in the main sequence.
- Scope covers **both** call sites deliberately. INT8-020 followed INT8-018's existing pattern rather
  than introducing it, so fixing only the newer one would leave the rule half-enforced and the older,
  larger violation in place.
- 2026-07-28 — **implemented.** Independent test authorship: an Opus subagent, given only the ticket
  and the *pre-move* theme code as the behavioural spec (not a future implementation), wrote
  `web/modules/custom/i8_services/tests/src/Kernel/SongVersionsTest.php` — the project's first Kernel
  test — covering both methods (two alternates sorted by title, none, an unpublished alternate
  excluded; a viewable parent, no parent, an unpublished parent, a deleted/dangling parent). Confirmed
  red for the right reason (`Class "Drupal\i8_services\SongVersions" not found`, at the point of
  instantiation — all scaffolding above it, including the anonymous-role permission grant the access
  assertions depend on, ran cleanly).
  Implemented `Drupal\i8_services\SongVersions` (`getParent()`, `getAlternates()`) and
  `Drupal\i8_services\SongTypeOptions` (`getTerms()`, the INT8-018 Type-dropdown lookup — split out as
  its own service, a separate genuine concern from song versions) with constructor-injected
  `EntityTypeManagerInterface`, registered in a new `i8_services.services.yml`. All 7 Kernel tests
  green. Thinned both theme preprocess functions to call the services and shape the result for Twig;
  `viewField()` stayed in the theme per the ticket (a render, not a lookup). Removed the now-unused
  `Drupal\node\Entity\Node` / `Drupal\node\NodeInterface` imports from the theme.
  Extended `tooling/check-boundary.sh` with a rule matching `(->|::)(getStorage|getQuery|loadMultiple|
  loadByProperties)\(` / `::load\(` against the custom theme. Confirmed it fails against the committed
  pre-move `interstate_85.theme` (`git show HEAD:...` piped through the same grep — 3 hits) before
  confirming the full boundary check passes clean post-move, per the DoD's explicit red-then-green
  requirement.
  Verified requirement 3 (cacheability) and the byte-for-byte requirement together: `git stash`'d just
  the code changes (ticket file/BOARD.md/check-boundary.sh left in place), cleared the Drupal cache,
  and for a plain song, an alternate-version song and its parent, captured both the rendered `#cache`
  tags (via `getViewBuilder('node')->view()` + `renderRoot()`, inspected through `drush php:eval` —
  `X-Drupal-Cache-Tags` isn't exposed by this site's headers, so this reads the same metadata directly)
  and the full HTML response for `/songs` and all three song pages. Popped the stash, cleared the cache
  again, re-captured both — cache tags were identical set-for-set and every HTML response was
  byte-for-byte identical (`diff` on all four pages, no output).
  Verification: `lando test` (PHPUnit 65/65 including the new Kernel test, PHPCS, PHPStan, boundary
  check) all green; full `lando playwright` — **565/565 passed**, `tests/playwright/tests/` untouched
  in the diff (`git status` confirms).
  **Sanity test:** `grep -rE '(->|::)(getStorage|getQuery|loadMultiple|loadByProperties)\(|::load\('
  web/themes/custom/interstate_85/interstate_85.theme` → no output.
