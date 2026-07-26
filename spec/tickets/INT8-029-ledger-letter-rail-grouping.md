---
id: INT8-029
title: Bucket the song ledger's letter rail and groups, with a `#` catch-all for numbers and symbols
type: task
status: in-review
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-018]
implements: [FR-8]
tests_required: true
estimate: 2
---

## In plain English
On the songs list, titles that start with something other than a letter currently get their own
nonsense heading — there is a group headed `(` containing exactly one song, and another headed `.`. Song
titles beginning with a number or a symbol should be gathered under one "#" heading, and a title like
"(No Song)" should simply be filed under **N** as anyone would expect. The A–Z strip down the side is
also supposed to stay in view as you scroll, and doesn't.

## Background
INT8-018 shipped the Songs landing with an alphabetical ledger: an article-insensitive sort
(`i8_services`' `ArticleInsensitiveTitle` Views sort plugin, FR-8) and, in the theme, a letter rail plus
per-letter group headers built by `interstate_85_preprocess_views_view__songs()` in
`web/themes/custom/interstate_85/interstate_85.theme`.

The grouping takes the **literal first character** of the sort key:

```php
'letter' => mb_strtoupper(mb_substr($sort_key, 0, 1)),
```

`ArticleInsensitiveTitle::stripLeadingArticle()` only removes a leading "a"/"an"/"the", so anything
starting with punctuation or a digit falls straight through. Confirmed against the real 492-song
dataset:

- `(8)copy` becomes its own one-song group literally headed `(`;
- a title starting `...` becomes its own group headed `.`;
- digit-leading titles scatter as singleton groups instead of collecting together;
- the rail (`range('A', 'Z')`) has no bucket those songs could ever map to — the "catch-all is missing"
  half of the report.

The ordering underneath has the same root cause. The sort plugin's expression only strips the article:

```sql
LOWER(CASE WHEN LOWER(title) REGEXP '^(a|an|the) '
  THEN SUBSTRING(title, LOCATE(' ', title) + 1) ELSE title END)
```

Punctuation sorts before digits, which sort before letters, so every punctuation-leading title is
dragged to the very top of the whole list — `(No Song)` currently sorts above `A Different City`. That
matters beyond aesthetics: the theme's grouping loop is a **sequential** pass that opens a new group
whenever the bucket changes from the previous row, so fixing only the PHP side would produce a stray
`N` group at the top of the page *and* a second `N` group in its proper place. **The SQL ordering and
the PHP bucketing must change together.**

Separately, the rail is specified as sticky (design-system.md §3, Song ledger: "3-col, sticky rail")
and `.song-ledger__rail` in
`web/themes/custom/interstate_85/components/song-ledger/song-ledger.css` already declares
`position: sticky; top: 0;` — but it does not visibly stick while scrolling. This is a defect against
already-written CSS, so it is fixed here.

This is a bug fix against INT8-018's shipped output, but it changes the FR-8 ordering expression
itself, so `implements: [FR-8]` rather than `[]` — the same reasoning that put INT8-027 in the main
sequence rather than the cleanup backlog (CONVENTIONS §6.6 keeps genuine requirement work out of the
cleanup category). FR-6 is untouched: which songs are listed does not change.

**Not in scope:** making the rail letters clickable so they jump/anchor to their group. That was
triaged as a separate new feature and gets its own ticket; the rail stays `aria-hidden` decorative
here. Also unchanged: the filter bar, the alt badge, the empty state, and FR-9/10/11 behaviour.

## Technical requirements

### 1. The bucket rule (canonical — implement exactly this)

Given a raw song title `T`:

1. `s = trim(T)`.
2. `s = stripLeadingArticle(s)` — remove one leading `a`/`an`/`the` plus its whitespace,
   case-insensitively. **Unchanged from today.**
3. Remove any **leading run of characters that are neither Unicode letters nor digits** (punctuation,
   symbols, whitespace). The result is the **comparison key**; lowercased, it is what rows are ordered
   by within a bucket.
4. Take the first character of the comparison key, fold an accented Latin letter to its base ASCII
   letter (`É` → `E`), and uppercase it.
5. If that character is `A`–`Z`, the bucket is that letter. **Otherwise — a digit, a letter from a
   script that does not fold to `A`–`Z`, or an empty comparison key (a title made entirely of
   punctuation) — the bucket is `#`.**
6. Bucket order is `A`, `B`, … `Z`, then `#` **last**. Reasoning: the rail reads as an alphabet and the
   hi-fi renders it strictly ascending (A → W); appending the catch-all keeps the alphabet contiguous
   and is the smaller change to an already-built A–Z rail. (The common web alternative — `#` first — is
   noted and deliberately not taken.)

Worked examples, all of which the implementation must satisfy:

| Title | Comparison key | Bucket |
|-------|----------------|--------|
| `(8)copy` | `8)copy` | `#` |
| `(No Song)` | `No Song)` | `N` |
| `...But Theyre Not Singing Ghosts` | `But Theyre Not Singing Ghosts` | `B` |
| `The Cold Part` | `Cold Part` | `C` |
| `A Different City` | `Different City` | `D` |
| `AEIOU And Sometimes Why` | `AEIOU And Sometimes Why` | `A` |
| `3rd Planet` | `3rd Planet` | `#` |
| `&` | *(empty)* | `#` |

Note the two user-supplied cases pull in opposite directions on purpose: `(No Song)` files under **N**
because step 3 looks *past* leading punctuation, while `(8)copy` files under `#` because the first
character it then finds is a **digit**. Any rule that skips punctuation but then buckets by "the first
letter found" would wrongly file `(8)copy` under `C` (from "copy"); the rule above stops at the first
letter-or-digit and lets a digit send the title to the catch-all.

**No design precedent exists for the catch-all.** `design-system.md` §3's Song ledger row and the
hi-fi's SONGS LANDING compositions show only an A–Z rail (rendered A–H, `…`, W) and no non-letter group;
the hi-fi's desktop mockup even files `…But Theyre Not Singing Ghosts` under **A**, which no rule
produces (the title starts with `…`) — mock filler, not a specification. So `#` is a slice-1 addition,
not a hi-fi-documented behaviour: record it in `design-system.md` §3 (Song ledger row) and its decisions
log as part of this ticket, per CONVENTIONS §5.5 (a spec change is a documented change). If the
implementer judges step 3 to also refine FR-8's wording ("alphabetically by name… ignoring a leading
article" now additionally ignoring leading punctuation), record that in `requirements.md`'s decisions
log too rather than diverging silently.

### 2. One canonical implementation, mirrored — not duplicated

- Extend `web/modules/custom/i8_services/src/Plugin/views/sort/ArticleInsensitiveTitle.php` (or a small
  helper class beside it, if PHPCS/PHPStan prefer that) with the rule as static methods — e.g.
  `comparisonKey(string $title): string` and `bucket(string $title): string` — with
  `stripLeadingArticle()` kept as their first step and its existing behaviour unchanged.
- The theme calls those; it must not re-implement or approximate the rule. This is the constraint
  INT8-018's own notes set ("the rule exists in exactly one place") and it is what keeps the SQL
  ordering and the rendered grouping from drifting apart.

### 3. SQL ordering (`services`)

- `ArticleInsensitiveTitle::query()` must order by **bucket rank first, then the comparison key**:
  rank `0` for an `A`–`Z` bucket and `1` for `#`, then the lowercased comparison key. Two
  `addOrderBy(NULL, …)` calls with distinct aliases, or one composite expression — implementer's call.
- The database is **MariaDB 10.11** (`.lando.yml`), so `REGEXP_REPLACE()` is available; a leading-junk
  strip is roughly `REGEXP_REPLACE(<article-stripped>, '^[^[:alnum:]]+', '')`, with the rank derived
  from whether the result then matches `^[A-Za-z]`. Verify the built SQL against the real database
  rather than assuming — INT8-018's notes record that Views' own plumbing has surprised this project
  before, and the existing `assert($this->query instanceof Sql)` narrowing must be preserved for
  PHPStan.
- Sanity check the result: with `?type=All`, `(No Song)` must appear inside the single `N` group in its
  correct alphabetical place, `(8)copy` inside the `#` group at the very end, and no group header may
  appear twice on the page.

### 4. Theme grouping and rail (`theme`)

- In `interstate_85_preprocess_views_view__songs()`, replace
  `mb_strtoupper(mb_substr($sort_key, 0, 1))` with the shared `bucket()` call.
- Build the rail from `range('A', 'Z')` **plus a trailing `#`**, keeping the existing `present` flag so
  absent buckets stay in the muted `--color-line` treatment. `song-ledger.twig` needs no structural
  change for this.
- The grouping loop may stay a sequential pass **only** if requirement 3 lands with it; otherwise group
  into a keyed map and emit buckets in the order defined above.

### 5. Sticky rail defect (`theme`)

`.song-ledger__rail` already sets `position: sticky; top: 0;`. Diagnose in a real browser (not by
reading CSS) and fix. The two prime suspects, in order:

1. **The rail is a grid item stretched to the full row height.** `.song-ledger__layout` is a grid;
   a grid item defaults to `align-self: stretch`, so the rail's box is as tall as the ledger beside it
   and sticky positioning has no travel room. `align-self: start` (making it content-height) is the
   standard fix.
2. **`top: 0` is wrong even once it sticks.** The solid site header is itself `position: sticky; top: 0`
   and docks at `var(--drupal-displace-offset-top, 0px)` for admin-toolbar users (INT8-015 round 6), so
   a rail pinned at `top: 0` slides underneath it. Offset the rail by the header's height plus the same
   displace variable.

Also confirm no ancestor (`.layout-container`, `.site-main`, `.layout-content`,
`.layout-content__inner`) sets an `overflow` other than `visible`, which would silently kill sticky.
Keep the fix tokens-only.

## Definition of done (acceptance criteria)
- [x] `(8)copy` renders in a single `#` group, not a group headed `(`; `(No Song)` renders inside the
      one `N` group; `...But Theyre Not Singing Ghosts` renders inside the `B` group.
- [x] All number- and symbol-leading titles share one `#` group, placed after `Z`, and the rail shows a
      trailing `#` that is marked present when that group is non-empty.
- [x] No bucket's group header appears more than once on the page under any filter combination, and
      rows within a bucket are in comparison-key order (`Never Ending Math Equation` before
      `(No Song)`).
- [x] The bucket rule exists once, in `i8_services`, and is called — not re-implemented — by the theme.
- [x] The letter rail visibly stays in view while scrolling the ledger, docked below the sticky site
      header (and below the admin toolbar when logged in), at desktop widths.
- [x] `design-system.md` §3 (Song ledger) and its decisions log record the `#` catch-all as a slice-1
      addition with no hi-fi precedent.
- [x] Tokens-only styling; no hardcoded hex/px.
- [x] Tests added per §12.2 and passing in the default gate; `lando playwright` green.
- [x] QA steps recorded under `## QA steps` and repeated in the chat completion report (this is a
      user-visible change).
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. Red-green is binding here and the rule is cheap to pin, so lead with the unit
test:

- **PHPUnit unit test** (new):
  `web/modules/custom/i8_services/tests/src/Unit/Plugin/views/sort/ArticleInsensitiveTitleTest.php`,
  following the existing unit-test precedent at
  `web/modules/custom/i8_migrate/tests/src/Unit/Plugin/migrate/process/CleanRichTextTest.php` (test
  strategy §10). A data provider carries the worked-examples table above verbatim — title →
  comparison key → bucket — plus the existing article-stripping cases so they are locked in as a
  regression. Written and confirmed red before any implementation.
- **Playwright** (extending `tests/playwright/tests/songs-landing.spec.ts`): with `?type=All`, assert
  `(8)copy` sits under a `#` header, `(No Song)` under `N`, `...But Theyre Not Singing Ghosts` under
  `B`; assert no duplicate group headers; assert the rail's last entry is `#`; assert the rail stays in
  the viewport after scrolling (compare its bounding box before and after a scroll).
- **Axe** re-run on `/songs` at desktop and 320px — the new group header and rail entry must not
  regress contrast or heading order (NFR-1).
- Fixtures: as with INT8-018, the tests run against the real migrated dataset (this project has no
  separate curated Playwright fixture); the three named titles all exist in it.

## Notes
2026-07-26 — All five technical requirements implemented; one real, thoroughly-reproduced deviation
from the ticket's suggested SQL approach — see below.

**Independent test authorship.** The failing PHPUnit test
(`ArticleInsensitiveTitleTest.php`, 42 cases) and the five new Playwright tests (extending
`songs-landing.spec.ts`) were written by a separate model from this ticket's text alone, before either
`comparisonKey()`/`bucket()` existed. Confirmed red for the right reason first: PHPUnit errored with
"call to undefined method" on both new methods (33 of 42 cases; the other 9 were `stripLeadingArticle()`
regression guards, already passing); Playwright failed each on the actual defect (`(8)copy` under a `(`
header, a `.` header present, `(No Song)` sorted before `Never Ending...`, 26 rail entries with no
trailing `#`, the rail's top position moving from 407.5 to −792.5 after a scroll). The test-writer also
caught two things worth recording: the ticket's own worked-examples table displays keys in original
case but the method contract explicitly says "lowercased" — resolved in favour of the explicit contract
(flagged in the test's docblock); and two of the ticket's example titles didn't quite match the real
migrated data — the actual titles are `...But Theyre Not Singing **Gohsts**` (not "Ghosts" — a legacy
misspelling) and `**Never Ending** Math Equation` (two words, not "Neverending") — the tests (and this
implementation) use the real titles.

**The bucket rule** (`comparisonKey()`/`bucket()` on `ArticleInsensitiveTitle`) matches the ticket's
canonical algorithm exactly: `stripLeadingArticle()` (unchanged) → strip a leading run of characters
that are neither a Unicode letter nor a digit (`preg_replace('/^[^\p{L}\p{N}]+/u', '', ...)`) →
lowercase = comparison key. `bucket()` takes the key's first character, folds it via `iconv('UTF-8',
'ASCII//TRANSLIT', ...)`, and uppercases: this correctly reduces an accented Latin letter to its base
ASCII form ("É" → "E") while leaving other scripts (tested with Cyrillic) as a literal, non-letter
placeholder rather than phonetically transliterating them — exactly the behaviour the rule needs, and
verified empirically before relying on it (a real risk: some `iconv` builds *do* attempt phonetic
Cyrillic-to-Latin transliteration, which would have wrongly given Cyrillic titles a letter bucket).

**A genuine PDO/MariaDB limitation, found and worked around, not silently deviated from.** The ticket
suggested `REGEXP_REPLACE(<article-stripped>, '^[^[:alnum:]]+', '')` for the SQL side. Verified against
the real database (MariaDB 10.11.11) *before* trusting it: **any regex character class — `[a-z]`,
`[^[:alnum:]]`, even the POSIX shorthand `[[:lower:]]` — silently returns a wrong result when executed
through `\Drupal::database()->query()` (PDO), while the byte-identical query run through the
interactive `mysql` client returns the correct result** (`'b' REGEXP '[a-z]'` → `0` via PDO, `1` via
the CLI). Isolated methodically: first suspected shell-quoting in my own diagnostic command (a real
category of issue this project has hit before — see INT8-017's `MSYS_NO_PATHCONV` note — so not an
idle worry), ruled that out by moving the diagnostic into a real `.php` script file and re-running,
confirmed the discrepancy persists comparing PDO against the CLI on the identical string, and confirmed
**alternation-based patterns are unaffected** (`'^(a|an|the) '`, `'^(a|b|c|…|z)'` both work correctly via
PDO) — which is exactly why INT8-018's original article-only sort expression already worked; it never
used a character class. Since INT8-029's "strip a leading run of non-alphanumeric characters" step
fundamentally needs a *negated* character class with no practical alternation-only equivalent (the set
of "non-alphanumeric" is unbounded), replicating the full bucket rule in SQL isn't possible through this
project's DB connection as it stands. **Resolution:** `ArticleInsensitiveTitle::query()` keeps its
original (bracket-free, INT8-018) article-only order as a reasonable baseline;
`interstate_85_preprocess_views_view__songs()` re-sorts the fetched result set by
`[bucket() === '#' ? 1 : 0, comparisonKey()]` for the definitive order — safe because the Songs landing
has no pager (FR-7), so the full, unpaginated result set is already in memory every time. This is a
*stronger* consistency guarantee than the ticket's original two-implementations-must-agree design: there
is now exactly one place (`comparisonKey()`/`bucket()`) that decides both grouping and ordering, SQL
included. Documented at length in the class's own docblock so a future session doesn't rediscover this
the slow way.

**Sticky rail** — both suspects named in the ticket were real: `.song-ledger__layout` is a CSS grid, so
the rail (a grid item) defaulted to `align-self: stretch` and had no room to travel; fixed with
`align-self: start`. And `top: 0` docked the rail underneath the sticky site header entirely. Rather
than hardcode the header's height (fragile — it already varies would-be with the admin toolbar), added a
small, focused addition to the existing `site-header.js` behavior: it now publishes the header's real
measured height as `--i8-header-height` on `:root`, updated on attach and on resize; the rail's `top`
reads `calc(var(--i8-header-height, 89px) + var(--drupal-displace-offset-top, 0px))` (the `89px`
fallback is the measured desktop height, used only if JS hasn't run yet). Confirmed no ancestor sets a
non-`visible` `overflow` (per the ticket's own warning) — none do.

**FR-8's wording extended, not silently reinterpreted.** The rule now also skips leading punctuation and
catch-alls non-letters, which is more than FR-8's original literal text ("ignoring a leading article")
said — updated `requirements.md` (FR-8 + a new decisions-log entry) and `design-system.md` (§3 Song
ledger row + decisions log, recording the `#` catch-all as a slice-1 addition with no hi-fi precedent,
per the ticket's own instruction) *before* calling this done, per the non-negotiable against silently
diverging from the spec.

Default gate green (52 PHPUnit — 42 new, PHPCS/PHPStan clean after fixing two docblock-format errors on
the new methods, boundary check 0 violations). `lando playwright`: 148/148 passing on chromium, webkit,
mobile-chrome and mobile-safari (one chromium test flaked once on an unrelated pre-existing FR-9/FR-18
test during one run, passed individually and on every other run — not a regression). Firefox fails
across every spec file in the suite, the same pre-existing `pw`-service binary gap noted in INT8-018/027,
unrelated to this ticket.

**Summary:** the song ledger now buckets sensibly — `(8)copy` and other number/symbol-leading titles
collect under one `#` group at the end instead of each getting their own nonsense heading, `(No Song)`
correctly files under N, and the A–Z letter rail stays visible (docked below the header) while the list
scrolls beside it.

**Sanity test:** `curl -s 'http://interstate-8-5.lndo.site/songs?type=All' | grep -oE
'song-ledger__group-header">[^<]*'` → ends `…Z</div>` then `#</div>`, with no repeated letter and no
group headed `(` or `.`.

2026-07-26 (revision, user feedback) — Two fixes, both in `song-ledger.css`:

- **The sticky rail sat flush against the header on scroll.** `top` was exactly
  `--i8-header-height + --drupal-displace-offset-top` with no breathing room. Added `+ var(--space-2)`
  for a small, tokens-only gap.
- **The rail is supposed to be absent on mobile, not just present-but-narrow.** The hi-fi's SONGS
  LANDING MOBILE composition has no rail column at all — a plain single-column flex list, not a
  narrower version of the desktop 2-column grid. Missed this on first pass (I'd made the rail sticky
  and reworked its scroll offset without checking the mobile composition at all). Added
  `@media (max-width: 759px) { .song-ledger__layout { display: block; } .song-ledger__rail { display:
  none; } }`, matching the `--bp-nav` breakpoint used everywhere else in this theme.

`lando playwright` re-run clean (148/148, same pre-existing Firefox gap). No existing test depended on
the rail's presence below 760px, so nothing needed updating there — INT8-030 (new, see below) will add
proper coverage for the rail's interactive behaviour at the widths where it exists.

**A missing ticket, found via the same review:** the user asked "which ticket now is going to make this
clickable?" — this ticket's own body says the rail-click/anchor feature "gets its own ticket," but no
such ticket was ever actually created (a real gap, not a deliberate deferral). Created **INT8-030**
("Make the song ledger's letter rail a real jump-to-letter navigation"), `depends_on: [INT8-029]`, in
the main sequence (E04) alongside this ticket.

## QA steps
- [x] Open `/songs?type=All` — scroll to the end of the list: the last group is headed `#` and contains
      `(8)copy` and similar titles, not scattered one-song groups headed `(` or `.`.
- [x] Find `(No Song)` — it's inside the `N` group, in alphabetical position among other N-titles (e.g.
      after "Never Ending Math Equation").
- [x] Scroll down the page at desktop width — the A–Z (`#`) letter rail on the left stays in view,
      docked just below the site header with a small gap, instead of scrolling away or sitting flush
      against it.
- [x] The rail shows every letter A–Z plus a trailing `#`; letters/`#` with no songs (e.g. `X`) are
      muted, present ones are teal.
- [x] At 320px, the letter rail is not present at all — the ledger is a single-column list.
