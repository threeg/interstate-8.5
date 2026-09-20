# Design request — Claude Design, slice 2 (`5.0.x-dev2`)

| | |
|---|---|
| **Document** | The brief handed to Claude Design to restructure the hi-fi and author slice 2's designs |
| **Repository location** | `spec/design/design-request-5.0.x-dev2.md` |
| **Status** | **Supporting, not binding.** The binding document is `design-system.md` |
| **Supersedes** | The single-canvas approach of `Interstate-8 1B.dc.html` (slice 1) |

> Paste the section below into Claude Design. It is self-contained — it does not assume the repository.

---

## The prompt

**Project.** Interstate-8 is a long-running Modest Mouse fan archive — a setlist and tour-date archive
indexed by song, a discography including bootlegs and side projects, news, and fan contributions. This is
v5. The visual direction is already chosen and shipped; this is not a redesign.

**Two jobs, in this order. The first must land before the second starts.**

### Job 1 — restructure the existing hi-fi into one file per page

Today all three screens, the component library and the token panel live in a single canvas. Split them.
**Export one file per page into a folder, flat:**

```
00-tokens.dc.html
00-components.dc.html
01-homepage.dc.html
02-songs-landing.dc.html
03-song-page.dc.html
```

- **`00-components`** — every shared component, with all its states, defined **once**. This page is the
  authority for a component's **shape and states**.
- **`00-tokens`** — a readable rendering of the token set. **It is not a source.** The project's
  `tokens.css` is the binding set; this page displays it. If the two ever disagree, `tokens.css` is right.
- **`01`–`03`** — each page's **composition and placement** only. Compose components from the components
  page; **never redraw a component's internals inside a page file.** If a page seems to need a component
  shaped differently, that is a question to raise, not a variation to draw.

**Migrate the existing screens as they are — do not redraw them.** Songs landing and the standard song page
are shipped and working; they move into the new layout unchanged. Only the two designs named in Job 2 are
new work.

**Do not include a generated README in the export.** It instructs coding agents to match designs
pixel-perfectly, which is wrong for the tokens page and for anything that is a rendering rather than a
source.

### Job 2 — author two designs into the new structure

Only start these once the split above is done and the components page exists.

#### 2a. Song page — the alternate-version lyric pair

This is a **correction to a shipped screen**. The current design draws the pair only as an isolated panel,
so where it sits in the page was never decided, and what shipped was judged unsatisfying. The placement is
now fixed and is not open:

- The **lyric pair occupies the Lyrics section, in place.** The quote stays above it, notes below, the
  right-hand rail unchanged. A standard song and an alternate version have **the same page shape** — only
  the contents of that one section differ.
- The pair is this version's lyrics beside the parent song's normal lyrics, **each under its own column
  heading naming which version it is** ("THIS VERSION" / "NORMAL VERSION →").
- **No panel framing** — no surrounding border, no tinted header bar. The column headings and the existing
  `2px dashed` split rule are what separate the two sets; that is the same divider treatment as the page's
  main/rail split, not a colour specific to this component. Stacked on mobile, the rule turns horizontal.
- The **"alternate title/lyrics for → [Parent]"** link belongs with the page title, as part of the page's
  identity — not attached to the lyric block.
- When the alternate's lyrics match the parent's, its column reads **"[same as normal version]"** and links
  to the parent instead of repeating them.

**Draw it inside the full song page, at every breakpoint.** A standalone panel showing the two columns does
not answer the question — where it sits in the page *is* the question, and drawing it in isolation is what
produced the problem being fixed.

#### 2b. Homepage hero

The homepage is being built for the first time, but **only its shell and this hero.** Everything else on the
page stays a placeholder composition.

- Full-width hero carrying a **set editorial message** — a line of copy an editor writes. **Not the page
  title.** This is what distinguishes it from the existing page-title hero used on secondary pages.
- Behind it, a background photo drawn **at random from a library, re-picked on each page load**. With an
  empty library it falls back to a plain background, message still legible.
- **The primary nav sits over it:** transparent while the hero is in view, solid once scrolled. **Draw both
  states.** Nav links must stay legible against a photo in the transparent state — there is an existing
  token for the transparent-state hover colour.
- The two heroes are separate components: **homepage hero** (message) and **page-title hero** (page title,
  secondary pages, never on the front page). Keep them distinct on the components page.

**Still placeholder on the homepage — compose them, don't invest in them:** latest news, upcoming tour
dates, recently-passed shows with setlists, "on this day / this week", a tour-stats teaser, a song
spotlight, a featured release from the discography, and a Contribute call.

### Constraints that hold throughout

- **The token set is fixed.** Use the existing tokens; do not introduce new colours, type sizes or spacing
  values. If something genuinely cannot be built from them, say so rather than inventing a value.
- **Contrast holds to WCAG 2.1 AA** on all real text. Watch the hero especially — text over a photograph
  needs its scrim to carry the ratio at every image in the library, not just the one drawn in the mockup.
- **Responsive from 320px.**
- **Draw at the real output dimensions.** A mockup drawn at some other size gives coordinates that are
  proportionally wrong by a margin small enough to survive review.

---

## After the export

Exports return to `spec/design/claude-design-hand-off/`. **Normalise on arrival:** flatten out of the
exporter's `project/` subfolder, and delete the generated `README.md` if one appears. After that the bundle
is not edited — changes go through Claude Design and a re-export (`design-system.md` §1).

`Interstate-8 1B.dc.html` is **kept and marked superseded**, not deleted — shipped tickets cite it. Where a
per-page file covers the same screen, that file wins.
