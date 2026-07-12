---
id: INT8-018
title: Songs landing (View + filters + ledger)
type: story
status: todo
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
- **FR-8 sort:** implement the article-insensitive sort — **Views Sort Expression** (verify D11) or a
  small owned Views sort handler (content-model §6). Decide here; record in Notes.
- Render via the ledger/letter-rail **SDC** (INT8-016) matching `1B.dc.html` (SONGS LANDING); alt badge
  on parented songs. Layer: `theme` + thin `services` for the sort.
- Song links → `/songs/<slug>` (FR-16).

## Design references
- Wireframe: spec/wireframes/02-songs-landing.md (populated / empty states)
- Design system: filter bar, song ledger, alt badge; `1B.dc.html` SONGS LANDING

## Tests
- Playwright: list completeness + exclusion (FR-6/7), sort (FR-8), type default + narrowing (FR-9/18),
  alt-titles toggle (FR-10), disabled filters (FR-11), empty state (FR-19), link → song page (FR-16).
- Axe + focus/keyboard on the filter controls (NFR-1); 320px assertion (NFR-2).
- Fixtures: the shared Songs fixture (test strategy §8).

## QA steps
- [ ] Open `/songs` → expect all songs, one page, A–Z (The World… under W).
- [ ] Type defaults to Modest Mouse → switch to All → list grows.
- [ ] Alt-titles Hide → marked alternates disappear.
- [ ] Released/Played-live look disabled, not broken.
- [ ] Filter to nothing → empty state + reset.

## Definition of done
- [ ] Acceptance criteria met
- [ ] Playwright + Axe tests added and passing in the default gate; `ddev playwright` green
- [ ] Tokens-only styling; matches `1B.dc.html`
- [ ] View/config exported (site-building parts verified by Claude)
- [ ] Ticket status + notes and BOARD.md row updated in the same commit
