# Wire request — Claude Design, slice 2 (`5.0.x-dev2`)

| | |
|---|---|
| **Document** | The brief handed to Claude Design to rebuild the wireframe canvas |
| **Repository location** | `spec/wireframes/wire-request-5.0.x-dev2.md` |
| **Status** | **Supporting, not binding.** The binding structural spec is `overview.md` + `01`–`03` |
| **Supersedes** | The single-canvas approach of `Interstate-8 Wireframes.dc.html` (slice 1) |

> Paste the section below into Claude Design. It is self-contained — it does not assume the repository.

---

## The prompt

**Project.** Interstate-8 is a long-running Modest Mouse fan archive — a setlist and tour-date archive
indexed by song, a discography including bootlegs and side projects, news, and fan contributions. This
is v5, being rebuilt one section at a time.

**What I need.** Rebuild the wireframe set. These are **low-fidelity structural wireframes**, not visual
design — a separate hi-fi pass follows later and will be built from these. Expect this to replace the
existing single-canvas wireframe file entirely.

### Deliverable shape

**One page per screen, plus a components page. Export one file per page into a folder** — not a single
combined canvas. Name them so they pair with the written spec:

```
00-components.dc.html
01-homepage.dc.html
02-songs-landing.dc.html
03-song-page.dc.html
```

Each page is the sole source for the screen it names. The components page defines each shared
component's structure once; the screen pages compose them and never redraw their internals.

**Draw every screen at two widths: desktop and mobile.** Mobile must work from **320px**.

### Fidelity

- Grey-box regions and structural layout only.
- **No colour, type or spacing decisions.** Those belong to the hi-fi pass.
- What you are fixing is: what is on each screen, how it is grouped, what states it has, and how the
  screens connect.

### Annotations — read this carefully

Annotations exist for exactly one purpose: **to tell the hi-fi designer something the drawing itself
cannot show.** A behaviour, a state that only appears under a condition, a constraint on how something
must respond.

- **They are not justification.** No reasoning, no rejected alternatives, no history, no "we chose this
  because". If a sentence explains *why*, delete it.
- **They must be unmistakable.** Visually *and* structurally distinct from the wire — a reader must never
  have to wonder whether they are looking at the design or at a note about it. Give every annotation a
  consistent, machine-findable marker in the markup (a `data-annotation` attribute or equivalent) so a
  script could count or strip them all.
- **They must be removable without loss.** Delete every annotation and a valid, complete wireframe must
  remain. If removing one takes information with it, that information was in the wrong place — put it in
  the drawing.

### Shared frame (every screen)

- **Header** — the Interstate-8 wordmark, the tagline "A Modest Mouse Fan Collaborative", and the global
  nav: Home, Tour Dates, Songs, Discography, Band, News. Only Home and Songs resolve in the build; the
  rest are shown for continuity. Mark the current section.
- **Footer** — minimal: identity and copyright.

**Vocabulary that must read identically everywhere.** Song types: **Modest Mouse**, **Ugly Casanova**,
**Side Projects**, **Covers**, plus **All** as the unfiltered option. Section label: **Songs** /
**Songlist**. Version wording: **"Alternate title/lyrics for →"**.

---

## 00 — Components

Define each of these once, with its states:

| Component | What it is | States to draw |
|---|---|---|
| **Global header / nav** | The shared header above | Default (solid); **transparent over a hero**; current-section marked; mobile (collapsed) |
| **Footer** | Identity and copyright | One |
| **Filter control** | A labelled select/toggle used on the Songs landing | Default, active/selected, disabled |
| **Song link** | A text link to a song page | Default; **alternate-version variant** (carries a marker) |
| **Lyric pair** | Two sets of lyrics shown together, each under a column heading naming its version | Side-by-side (wide); stacked (mobile); one side reading "[same as normal version]" |
| **Homepage hero** | Full-width image area carrying a set editorial message | With background image; with no image (plain background) |
| **"Coming soon" rail stub** | A disabled placeholder for deferred content | One |

---

## 01 — Home

Two tiers on this page, and the line between them matters:

**Built now — draw these properly, they are being implemented:**

- **Hero.** Full-width. Carries a **set editorial message** — a line of copy an editor writes, **not the
  page title**. Behind it, a background photo drawn at random from a library on each page load; when the
  library is empty it falls back to a plain background with the message still readable.
- **The global nav sits over the hero**, transparent while the hero is in view, turning solid once the
  page scrolls. Draw both states. Nav links must stay legible against a photo in the transparent state.

**Still placeholder — draw them for composition, they are not being built yet:** latest news, upcoming
tour dates, recently-passed shows with setlists, "on this day / this week", a tour-stats teaser, a song
spotlight, a featured release from the discography, and a visible **Contribute** call.

Layout is yours — do **not** reproduce a news-column-plus-sidebar arrangement. The page will be
composed in a page builder, so assume a bespoke stacked composition.

**States:** hero with image · hero with empty library (plain background) · error page.

---

## 02 — Songs landing (Songlist)

The complete song list on **one page, no pagination** — the point is seeing the whole body of work at
once (~490 songs).

- Ordered alphabetically, ignoring a leading "A"/"An"/"The", with a letter rail for jumping.
- **Type filter** — All plus the four song types; defaults to **Modest Mouse**.
- **Alternate-titles filter** — defaults to showing alternates, marked as such; can hide them.
- **Released** and **Played live** filters appear but are **disabled** — the data behind them does not
  exist yet.

**States:** populated · no results for a filter combination · loading · error.

---

## 03 — Song page

A single song: title, quote, lyrics, notes, an embedded video when present, and a path back to the
Songlist. The song's type/group is **not** shown. No release, setlist, tab or studio data — but the
page reserves a right-hand rail of disabled "coming soon" stubs so the layout does not reshuffle when
those arrive.

Three variants:

**Standard song** — the above.

**Alternate version** — this is the page's distinctive feature and the detail to get right:

- The **lyric pair occupies the Lyrics section, in place.** The quote stays above it, notes below, the
  rail unchanged. A standard song and an alternate version have **the same page shape** — only the
  contents of that one section differ.
- The pair is this version's lyrics beside the parent song's normal lyrics, **each under its own column
  heading naming which version it is.** Side-by-side on wide screens, stacked on mobile.
- **No panel framing** — no border, no tinted header bar. The column headings are what separate the two
  sets. These lyrics are the page's substance, not a widget sitting inside it.
- The **"Alternate title/lyrics for → [Parent]"** link sits with the page title, as part of the page's
  identity — not attached to the lyric block.
- When the alternate's lyrics are identical to the parent's, its side reads **"[same as normal
  version]"** and links to the parent instead of repeating them.

**Parent with alternates** — lists its alternate versions as links.

> **Draw the lyric pair inside the full page, at both widths.** A standalone panel showing just the two
> columns does not answer the question — where it sits in the page *is* the question.

**States:** populated (each of the three variants) · missing fields omitted cleanly, no empty headings ·
404 for an unknown song.

---

## After the export

Exports return to `spec/wireframes/` as supporting context; the markdown files stay binding. The old
single canvas is marked **superseded** rather than deleted — it is cited by shipped tickets — and the
four citations of it are updated in the same pass: `overview.md`'s *Chosen visual direction* row and its
§4 note, `design-system.md` §1.1's illustrative-only row, and `spec/contents.md`.
