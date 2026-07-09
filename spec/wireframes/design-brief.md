# Interstate-8 v5 — Claude Design brief (slice 1)

| | |
|---|---|
| **Document** | Design brief for Claude Design (supporting — **not binding**) |
| **Repository location** | `spec/wireframes/design-brief.md` |
| **Use** | Paste/adapt into **Claude Design** to generate the visual wires. Binding structure lives in `overview.md` + `01–03`. |

> **The one job of this brief:** answer the project's **go/no-go** — can Claude Design produce a
> genuinely good look for Interstate-8? A strong homepage direction means continue; nothing landing
> means pause (brief §7). Direction chosen: **"surprise me" — explore a few distinct directions.**

---

## Context

**Interstate-8.com** is a long-running **Modest Mouse fan archive** (running 2006–2020, now being
rebuilt as v5 on Drupal 11). It's the definitive, detail-obsessed reference: a song catalogue with
lyrics/notes, a discography down to individual vinyl pressings, and a live-setlist archive indexed by
song. Audience: **hardcore fans, collectors, setlist trackers** — people who love depth and accuracy.

**Aesthetic context (inspiration, not a cage):** Modest Mouse is indie/alt-rock with a lo-fi,
DIY origin and distinctive, hand-drawn, surreal-melancholic album art (e.g. *The Moon & Antarctica*,
*Good News for People Who Love Bad News*). The archive's own character is reverent, nerdy, text-rich.
Aim for something that feels like it belongs to this band and rewards close reading — but you have room
to range.

## Visual direction (inspiration — not locked)

- **Centred layout.** The site is centred, as v1 and v2 were.
- **Highway / interstate motif — the identity through-line.** The name is a highway reference (I-8);
  v1 used grayscale highway header scenes, v2 used highway background images. Weave a highway element
  through the design — a photographic highway header band, subtle road / route-marker motifs,
  interstate-shield-style section markers — as a *design element*, not necessarily heavy full-bleed
  backgrounds.
- **Colour — three lanes, one per homepage direction:**
  1. **Shield-bold** — the US interstate shield's red / white / blue.
  2. **Muted highway** — the palette extracted from a favourite v2 background: Corduroy `#5E6B68`,
     Periwinkle Gray `#AFCDE1`, Pumice `#D3D6D5`, Polo Blue `#98B9D0`.
  3. **Surprise** — a third scheme of your own invention that departs from the first two, to widen the
     options. *(Introduce this at the **actual-design** stage, not the low-fi wires.)*
- **References** live in `references/` (see its README): the two v2 homepages, the v2 songlist, the
  interstate shield, and the extracted-palette board. Use them for mood / motif / colour — do **not**
  copy them.

All three lanes must still meet **WCAG 2.1 AA** contrast (NFR-1); the winning palette becomes the
design tokens in Milestone 5.

## What to produce

1. **Homepage — 3 distinct directions** (the go/no-go), each a full desktop composition **and** a
   mobile view, built around the **three colour lanes** in *Visual direction* below. **Compose the
   components in `01-homepage.md`** — latest news, upcoming tour dates, recently-passed shows +
   setlists, "on this day / this week", a **tour-stats teaser**, and a visible **Contribute** call;
   plus **song spotlight** and **from the discography** shown **"on trial"** (present so they can be
   judged, then cut if they don't earn a place). **Layout is yours — centred; do not mimic v2's
   news-column + sidebar.** Content is placeholder except song spotlight, which may use real songs.
2. **Songs landing** and **Song page** — in the **chosen** homepage direction (after I pick one), per
   `02-songs-landing.md` and `03-song-page.md`. Include the song page's **side-by-side lyrics** variant
   — it's the distinctive, must-nail detail.

## Constraints (hold across all directions)

- **Responsive**, usable from **320px** upward (NFR-2); show desktop + mobile.
- **Accessible** to **WCAG 2.1 AA** (NFR-1): semantic structure, one `<h1>` + real heading order,
  labelled controls, visible focus, and **colour contrast baked into the palette** (the palette
  becomes design tokens).
- **Buildable in the stack:** the site is themed with **SDC + Tailwind v4** over **CSS
  custom-property tokens** — so lean on a coherent token set (palette, type scale, spacing) rather than
  one-off values. Tokens are the durable layer that carries into Milestone 5.
- **Lyrics are hero content** — prioritise readable body typography and stanza spacing; the song page
  and the side-by-side view must read beautifully, including on mobile (where the two columns may
  stack).
- The catalogue's value is *seeing the whole body of work at once* — the Songs landing should feel
  complete and scannable, not paginated.

## After Design

Pick the winning homepage direction, have Design apply it to the two song screens, then **export the
results (screenshots / HTML) back into `spec/wireframes/`** as supporting context (referenced from the
screen files). The markdown here stays binding; the visuals sit beside it. Tokens and components are
formalised next in **Milestone 5 (Design system)**.
