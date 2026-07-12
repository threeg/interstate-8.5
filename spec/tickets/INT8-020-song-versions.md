---
id: INT8-020
title: Song versions (side-by-side lyrics + links)
type: story
status: todo
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
- [ ] Open an alternate → two lyric columns + "alternate title/lyrics for → parent".
- [ ] Open a "same as normal" alternate → shows "[same as normal version]" link, no duplicate lyrics.
- [ ] Open the parent → lists its alternate versions as links.
- [ ] Narrow the window → columns stack, still paired.

## Definition of done
- [ ] Acceptance criteria met
- [ ] Playwright + Axe tests added and passing; `ddev playwright` green
- [ ] Tokens-only styling; matches `1B.dc.html`
- [ ] Ticket status + notes and BOARD.md row updated in the same commit
