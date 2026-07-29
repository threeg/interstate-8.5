---
id: INT8-037
title: Correct INT8-018's caching claim and decide whether the Songs landing's max-age 0 stands
type: task
status: in-review
milestone: 9
batch: cleanup
layer: config
depends_on: [INT8-018]
implements: []
tests_required: false
estimate: 2
---

## In plain English
The song list page is rebuilt from scratch on every visit for anyone logged in, instead of being reused
from cache. Ordinary visitors are unaffected. That may well be a fine trade — but our own notes say the
opposite is happening, so the first job is to make the record true, and the second is to write down
whether we're keeping it that way on purpose.

## Background

`/songs` is **uncacheable in Drupal's Dynamic Page Cache**:

```
$ curl -sI http://interstate-8-5.lndo.site/songs
X-Drupal-Cache: HIT
X-Drupal-Dynamic-Cache: UNCACHEABLE (poor cacheability)
```

**Cause, traced to core.** The View uses `cache: {type: none}` (`config/sync/views.view.songs.yml`).
`Drupal\views\Plugin\views\cache\None` does not override `CachePluginBase::getDefaultCacheMaxAge()`,
which returns **`0`** ("the default cache backend is not caching anything",
`web/core/modules/views/src/Plugin/views/cache/CachePluginBase.php:278`). That zero propagates into the
page's render array — confirmed directly:

```
RENDERABLE TAGS:   config:views.view.songs, node_list
RENDERABLE MAXAGE: 0
```

A `max-age` of 0 anywhere in a render tree makes the whole response uncacheable for the Dynamic Page
Cache, which is exactly what the header reports.

**The `cache: none` decision itself is sound and is not being reopened.** INT8-018 chose it for a real,
demonstrated reason: Views' result cache keys only on *exposed*-filter input, and this landing's three
custom handlers read the query string directly via `RequestStack`, so Views silently reused one result
set across every `?type=`/`?alt=` combination. That finding stands.

**What is wrong is the record.** INT8-018's notes state:

> Switched `cache: none`; Drupal's page/dynamic-page/render caches still layer on top correctly, now
> that `getCacheContexts()` on the filters declares the right `url.query_args:*` contexts.

The dynamic page cache does **not** layer on top — it is disabled for the route. The contexts fix was
necessary and correct, but it did not restore dynamic-page cacheability, and the note reads as though it
did.

**Actual impact, measured, so the decision is made on facts:**

- **Anonymous visitors: unaffected.** The internal page cache still serves `/songs` (`X-Drupal-Cache:
  HIT`), and invalidation is correct — the renderable carries `node_list` and `config:views.view.songs`,
  so adding or editing a song does clear the page.
- **Authenticated users: the full 490-row landing is rebuilt on every request.**
- **No requirement is breached.** NFR-4 explicitly defers all performance thresholds to a pre-launch
  pass, asking only that slice 1 avoid gratuitous regressions. This is therefore a recorded-decision
  question, not a gate failure — which is why it is cleanup backlog and not the main sequence.

## Technical requirements

1. **Correct INT8-018's `## Notes`.** Append a dated correction stating the real cacheability position:
   `cache: none` forces `max-age 0`, the dynamic page cache is off for `/songs`, the internal page cache
   and tag-based invalidation are unaffected. Append — do not rewrite the original note.

2. **Decide, and record the decision**, whether the Songs landing stays uncacheable for authenticated
   users through slice 1. Both outcomes are legitimate; what is not legitimate is leaving it undecided.
   Write the outcome into `spec/architecture/architecture.md`'s decisions log (or
   `content-model.md` §6 beside the existing FR-8 sort-mechanism decision, whichever the implementer
   judges the better home) so a future session does not re-derive it.

   If keeping it: say so plainly, cite NFR-4's deferral, and note it as a candidate for the pre-launch
   performance pass.

   If changing it: the shape that would work is a **small owned Views cache plugin** that keys the result
   cache on the `type`/`alt` query arguments — the piece Views' stock `tag` plugin lacks. That is the
   same "no D11-ready contrib, build a small owned plugin" pattern the project already used for
   `ArticleInsensitiveTitle` and the two filter plugins, so it is a known-good route rather than a new
   dependency. **Do not** simply switch back to `cache: {type: tag}` — INT8-018 already proved that
   serves one result set across every filter combination.

3. **If — and only if — step 2 changes behaviour**, add a Playwright assertion covering it (the header on
   `/songs`, and that two different `?type=` values still return different result counts — the exact
   regression `cache: tag` caused). A pure record correction needs no new test.

Out of scope: NFR-4's deferred performance thresholds themselves; the internal page cache; any other
route's cacheability; the `cache_metadata` block in the exported View config (Drupal regenerates it).

## Definition of done (acceptance criteria)
- [x] INT8-018's `## Notes` carries a dated correction that matches observable behaviour.
- [x] The keep-or-change decision is recorded in a durable spec document, with its reasoning.
- [ ] N/A — behaviour did not change (decision: keep `cache: none`/uncacheable-for-authenticated as-is).
- [x] If behaviour did not change: no config diff — `lando drush cim -y` reports no changes to import.
- [x] `lando test` green; `lando playwright` green.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: false` — **docs-only** exemption by default: the baseline deliverable is a record
correction plus a recorded decision, with no behaviour change. The conditional test obligation in step 3
covers the case where the decision goes the other way, and is deliberately conditional rather than
assumed, following the pattern INT8-032 uses for its own conditional finding.

Verify the current state with:

```
curl -sI http://interstate-8-5.lndo.site/songs | grep -i dynamic-cache
for t in "Modest%20Mouse" "All"; do
  curl -s "http://interstate-8-5.lndo.site/songs?type=$t" | grep -c 'href="/songs/'
done
```
→ today: `UNCACHEABLE (poor cacheability)`, then `278` and `490`.

## Notes
- 2026-07-27 — created by `sfk-verify` on the theme batch (INT8-015…021, 027–031). Found by checking the
  live cache headers rather than reading the ticket's claim, then tracing `max-age 0` to
  `CachePluginBase::getDefaultCacheMaxAge()` and confirming it on the built renderable. Cleanup backlog
  rather than main sequence: NFR-4 defers performance thresholds outright, anonymous visitors are
  correctly cached and correctly invalidated, and nothing a user can see is wrong — which is what
  CONVENTIONS §6.6 reserves the backlog for.
- 2026-07-28 — **resolved.** Re-verified the live behaviour matches the ticket's account exactly:
  `curl -sI /songs` still reports `X-Drupal-Dynamic-Cache: UNCACHEABLE (poor cacheability)`; a second
  request shows `X-Drupal-Cache: HIT` (anonymous internal-page-cache path unaffected); `?type=Modest%20
  Mouse` vs `?type=All` still return 278 vs 490 links, confirming the underlying `cache: none` fix from
  INT8-018 is still doing its job.
  Appended a dated correction to INT8-018's `## Notes` (did not rewrite the original) stating plainly
  that the dynamic page cache does **not** layer on top of `cache: none` — it is disabled for the route
  — while confirming what the original note got right (internal page cache + tag invalidation for
  anonymous visitors).
  **Decision: keep the Songs landing uncacheable for authenticated users through slice 1**, recorded with
  its reasoning in `content-model.md` §9's decisions log (chosen over `architecture.md`, which has no
  decisions-log section of its own — `content-model.md` §9 already holds this project's decisions log and
  sits right beside §6's FR-8 sort-mechanism precedent this ticket's reasoning mirrors). Reasoning: NFR-4
  explicitly defers all performance thresholds to a pre-launch pass against real measured data; anonymous
  visitors (this fan-archive's actual traffic) are unaffected; the fix (an owned Views cache plugin keying
  the result cache on `type`/`alt`) is real, non-trivial engineering effort for a benefit that reaches only
  the small authenticated population — exactly what the project's lazy-adoption principle says not to build
  speculatively. Flagged as a candidate for the pre-launch performance pass rather than closed off.
  No behaviour change, so no test obligation (ticket's own conditional): `lando drush cim -y` reports "no
  changes to import" for this branch's own diff (an unrelated pre-existing `system.menu.footer` config
  drift was present in the site's active config before this ticket touched anything, and importing it
  merely synced the site to what `config/sync` already had committed — confirmed via `git status`
  showing no config file changes from this ticket's work).
  Verification: `lando test` (PHPUnit 65/65, PHPCS, PHPStan, boundary check) all green; `lando playwright`
  full suite green (see chat completion report for the exact count).
  **Sanity test:** `curl -sI https://interstate-8-5.lndo.site/songs | grep -i dynamic-cache` →
  `X-Drupal-Dynamic-Cache: UNCACHEABLE (poor cacheability)` (expected — matches the recorded decision to
  keep it, not a regression).
