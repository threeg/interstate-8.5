---
id: INT8-020
title: Song versions (side-by-side lyrics + links)
type: story
status: done
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-019]
implements: [FR-13, FR-20]
tests_required: true
estimate: 3
---

## In plain English
When a song has an alternate version, show the two sets of lyrics side by side so fans can compare — and
link versions to each other. This is the site's distinctive bootleg-nerd feature.

## User story
As a fan
I want to see an alternate version's lyrics next to the original
so that I can compare how the song changed.

## Acceptance criteria

**Scenario 1: alternate version page**
- Given a song with a parent (`field_parent_song`)
- When I open it
- Then its lyrics show **side-by-side** with the parent's normal lyrics, with an "alternate title/lyrics
  for → parent" link (FR-20)
- And when `field_lyrics_same_as_parent` is set, the alternate side reads **"[same as normal version]"**
  (linking the parent) instead of repeating the lyrics (FR-20).

**Scenario 2: parent lists its alternates**
- Given a song that has alternate versions
- Then its page lists them as links (FR-13).

**Scenario 3: mobile**
- Given the alternate view on a narrow screen
- Then the two lyric sets stack, clearly paired (NFR-2).

## Technical approach
- Extend the song view mode / Twig (INT8-019) with the version logic: resolve `field_parent_song`
  (this song's parent) and the reverse (children) — a small `services` helper or a View relationship.
- Render the paired lyric columns (SDC "lyric pair") per `1B.dc.html`; stack under narrow widths.

## Design references
- Wireframe: spec/wireframes/03-song-page.md (Variant A alternate, Variant B parent)
- Design system: lyric pair component; `1B.dc.html` "Alternate version, side-by-side lyrics"

## Tests
- Playwright: alternate page shows both columns + parent link (FR-20); "[same as normal version]" path;
  parent page lists alternates (FR-13); mobile stack (NFR-2). Axe (NFR-1).
- Fixtures: parent + alternate (differing) + alternate (same-as-normal) from the shared fixture (§8).

## QA steps
- [x] Open an alternate → two lyric columns + "alternate title/lyrics for → parent".
- [x] Open a "same as normal" alternate → shows "[same as normal version]" link, no duplicate lyrics.
- [x] Open the parent → lists its alternate versions as links.
- [x] Narrow the window → columns stack, still paired.

## Definition of done
- [x] Acceptance criteria met
- [x] Playwright + Axe tests added and passing; `lando playwright` green
- [x] Tokens-only styling; matches `1B.dc.html`
- [x] Ticket status + notes and BOARD.md row updated in the same commit

## Notes
2026-07-26 — implemented. FR-13/FR-20: an alternate version's page shows a two-column lyric comparison
and links to its parent; a parent's page lists its alternates as links.

**Independent test authorship.** The 17 Playwright tests (`song-versions.spec.ts`, a new file, since
this is a self-contained feature with its own real-data fixtures) were written by a separate model from
the ticket + spec alone, before any implementation code existed, and confirmed 11 of 17 red for the
right reason first — the other 6 are stated-explicit regression/negative guards (e.g. "a plain song is
unaffected"), not dressed up as failing tests. The author independently queried the live dataset for
real fixtures (never guessed): 26 songs carry `field_parent_song`; the differing-lyrics case is "Lucky
Me Again (2006/11/05)" → "King Rat" (also the hi-fi's own worked example); the same-as-parent case is
"Your Life" → "Lives" (byte-identical lyrics, confirmed); the multi-alternate parent cases are "King Rat"
(2 children) and "Perpetual Motion Machine" (4 children, an intentionally stronger fixture than a
two-child one). Every lyric snippet used in assertions was counted across all four fixture songs to
confirm it appears in exactly the one song it's attributed to — the same discipline as every prior
ticket's independent test author.

**Two entity relationships neither expressible as a plain field render.** A `interstate_85_preprocess_
node__song()` (bundle-scoped — `full` is the only view mode this content type ever uses, so no second
case exists for it to wrongly fire on) resolves both directions:
- **This song IS an alternate** (has a parent): loads the parent, and renders the parent's OWN
  `field_lyrics` via `EntityViewBuilder::viewField()` — not `->value`, which would skip the text
  format's filtering. `viewField()`'s default formatter prints the field's label; explicitly hidden via
  `['label' => 'hidden']`, since nothing else on this page shows field labels (a real bug caught by
  hand-checking the rendered markup: the parent's lyrics arrived correctly, but wrapped by an unwanted
  second "Lyrics" heading).
- **This song HAS alternates** (is a parent): no field carries this — it's the *reverse* of
  `field_parent_song`, so it's a query (`condition('field_parent_song', $node->id())`), not a field
  read. Cache tags add the parent's/each alternate's own tags plus the generic `node_list` tag, since a
  brand-new alternate added elsewhere is exactly the "the SET of matching entities changed" case that
  tag exists for.

**The lyric-pair SDC stays purely structural — two slots, no props, no knowledge of labels or
same-as-parent logic** — deliberately, to avoid nesting one SDC's `{% embed %}` inside a block passed to
*another* embed. That exact nesting already broke `views-view--songs.html.twig` (INT8-018) and
`coming-soon-stub` avoided it the same way; `node--song--full.html.twig`'s own file comment now records
the reasoning at the point where a future reader would otherwise be tempted to "clean it up" by nesting
`section-label` inside `lyric-pair`'s blocks. The two column labels inside the pair are plain markup
reusing `.section-label`'s CSS classes directly, not the component's own template a second time.

**A real WCAG 1.4.1 finding, not a false start.** The first pass styled every cross-link with plain
`<a class="link link--inline">` markup, which failed Axe's `link-in-text-block` rule: a link inside
running text distinguished from its surroundings by colour alone is exactly what that rule exists to
catch, and this project already has a `link` SDC (built in an earlier ticket, description literally
naming "alternate title/lyrics for → parent" as its intended use, but never actually consumed until
now) whose `inline` variant adds a genuine underline for precisely this case. Fixing the markup fixed
the visual case but not the violation, for a second, more interesting reason: an SDC's CSS is only
attached to a page where the component is genuinely rendered (`{% embed %}`, not by reusing its class
names) — since every call site had been converted to plain classes, `link.css` was never attached
anywhere and the styling silently did nothing. Fixed by using two genuine `{% embed 'interstate_85:link'
%}` calls at the template's top level (the parent cross-reference line, and the alternate-versions list)
— both safe, since neither sits inside another component's block — which attaches `link.css` for the
whole page; the two remaining links nested inside `lyric-pair`'s blocks reuse the now-attached CSS via
plain classes, guaranteed to co-occur with one of the two genuine embeds on every page that renders them.

**Verification.** Default gate green (58 PHPUnit, PHPCS — now 10 checks — PHPStan, boundary check; this
ticket is theme/PHP-preprocess only, no schema change). Full Playwright suite **106/106 on chromium**
(20 net new across all suites, no regressions). No config drift — `drush cex`/`cim` both report nothing
to do.

2026-07-26 — **done (reviewed), but the feature is expected to be redesigned.** Closed as built: FR-13
and FR-20 are implemented and their tests pass. The site owner's review found it visually incomplete
against the hi-fi (the alternate block's light-blue `--color-tint` header bar is missing) and, more
substantially, judged the *design itself* not to work — the hi-fi only ever draws this composition as
an isolated panel, never in the full page layout, so how it should sit within the song page was never
really settled. **A redesign of this view is expected**, and no further patching happens against this
ticket: it would be work against a composition that is about to change. Logged in `spec/TODO.md` so it
survives outside this closed ticket, and will become its own ticket once the redesign exists.

Also raised in the same review and split out rather than fixed here: this ticket's preprocess does its
own entity queries directly in the theme layer, which the architecture's dependency rule assigns to
`services` (architecture.md §2.1 names "version-display logic" as a services-layer example almost
verbatim). It follows the precedent INT8-018 already set rather than inventing it, so both are moved
together — see **INT8-035**.
