# Wireframe 03 — Song page

| | |
|---|---|
| **Screen** | Song page |
| **Route** | `/songs/<slug>` |
| **Implements** | FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-20 |

> A single song: name, quotes, lyrics, notes, and its embedded video — plus version cross-links. The
> song's **type/group is not shown** (FR-12); release/setlist/tab/studio data is **omitted** in slice 1
> (FR-14).
>
> **This lists the content and behaviour — not a layout.** Arrangement (single column, main + rail,
> where the video sits, how the side-by-side lyrics are laid out) is **Claude Design's to improve
> upon** — v2's frameset-era main-column + right-rail is a starting reference, not a target.

---

## Content (standard song — no parent, no alternates)

| Element | Behaviour | Implements |
|---------|-----------|-----------|
| **Title** | The song name. | FR-12 |
| **Quote** | Shown if present; omitted cleanly if not. | FR-12, FR-15 |
| **Lyrics** | The song's lyrics. | FR-12 |
| **Notes** | Shown if present; omitted if not. | FR-12, FR-15 |
| **Video** | Embedded inline (oEmbed remote video) when present; omitted if not. | FR-17, FR-15 |
| **Back to Songs** | A path back to the landing. | FR-16 |
| **(not shown)** | Type/group (FR-12); releases / live / tabs / studio (FR-14). | FR-12, FR-14 |

## Variant A — alternate version (this song has a parent, FR-20)

- A **"alternate title/lyrics for → [Parent]"** link.
- This version's lyrics and the **parent's normal lyrics** shown **clearly paired** (side-by-side on
  wide screens; may stack on mobile, NFR-2 — pairing arrangement is Design's).
- When `field_lyrics_same_as_parent` is set, the alternate side reads **"[same as normal version]"**
  (linking the parent) instead of repeating the lyrics.

## Variant B — parent with alternates (FR-13)

- A song that *has* alternate versions lists them as links so the reader can jump to each variant.

## States

- **Populated** — one of the three variants (standard / alternate / parent).
- **Missing fields (FR-15)** — omit absent sections cleanly (no empty headings).
- **Not found** — unknown slug → 404.

## Navigation

- **Back to Songs** returns to the landing (FR-16).
- Version links jump between a song and its parent/alternates (FR-13/FR-20).

## Notes for Claude Design

- The **side-by-side lyrics** (Variant A) is the distinctive, bootleg-nerd feature — make the two sets
  clearly paired and readable, including how they behave on mobile. This is the detail to nail.
- Lyrics are the hero content: prioritise readable typography and stanza spacing. Feel free to rethink
  the page shape entirely — the video and any future related content need a home, but the layout is
  yours.
