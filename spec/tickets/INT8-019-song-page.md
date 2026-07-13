---
id: INT8-019
title: Song page (view mode + Twig + video)
type: story
status: todo
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-013, INT8-015, INT8-016]
implements: [FR-12, FR-14, FR-15, FR-17]
tests_required: true
estimate: 3
---

## In plain English
The page for a single song: its name, any quote, the lyrics, notes, and an inline video — nothing about
releases or live shows yet.

## User story
As a fan
I want to open a song and read its lyrics, notes and watch its video
so that I have the song's full record in one place.

## Acceptance criteria

**Scenario 1: standard song**
- Given a song with content
- When I open its page
- Then I see name, quote (if any), lyrics, notes, and the **embedded** video (FR-17)
- And the song's **type/group is not shown**, and no release/live/tab/studio data appears (FR-12, FR-14).

**Scenario 2: missing fields**
- Given a song with no quote / no video / no notes
- Then those sections are omitted cleanly — no empty headings (FR-15).

**Scenario 3: unknown song**
- When I request an unknown slug
- Then I get a 404.

## Technical approach
- A dedicated **view mode** + **Twig** override for `song`, rendered with the theme SDC (quote block,
  hero, video). Video embeds via the Remote-video media (oEmbed, FR-17).
- The "coming soon" right-rail stubs (releases / last-played / tour-stats) reserve space (FR-14 spirit;
  no real data). Type/group omitted (FR-12).
- Route `/songs/<slug>` (api-contract §2.2). Version side-by-side is **INT8-020**.

## Design references
- Wireframe: spec/wireframes/03-song-page.md (standard variant, missing-fields)
- Design system: song page layout, video, quote block; `1B.dc.html` SONG PAGE

## Tests
- Playwright: renders name/quote/lyrics/notes/video; omits absent fields (FR-15); no type/release/live
  (FR-12/FR-14); 404 on bad slug. Axe (NFR-1); 320px (NFR-2).
- Fixtures: shared Songs fixture incl. an empty-fields song (§8).

## QA steps
- [ ] Open a song → name, lyrics, notes, inline video; no "band tag", no releases/live.
- [ ] Open a lyrics-only song → no empty video/notes headings.
- [ ] Hit a bad URL → 404.

## Definition of done
- [ ] Acceptance criteria met
- [ ] Playwright + Axe tests added and passing; `lando playwright` green
- [ ] Tokens-only styling; matches `1B.dc.html`
- [ ] Ticket status + notes and BOARD.md row updated in the same commit
