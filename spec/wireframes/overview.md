# Interstate-8 — Wireframes: Overview, Navigation and Conventions (v5, `5.0.x-dev` slice 1)

| | |
|---|---|
| **Document** | Wireframes overview |
| **Repository location** | `spec/wireframes/overview.md` |
| **Status** | Binding specification (for UI) — Milestone 4 signed off (2026-07-11) |
| **Chosen visual direction** | **6d** in `Interstate-8 Wireframes.dc.html` (go/no-go: **GO**). Self-contained HTML canvas covering all three screens, desktop + mobile. |
| **Workflow** | This folder is the **binding structural spec**; the **visual wires are produced in Claude Design** and their exports return here as supporting context (see §4). |

> **Purpose.** The binding description of the slice-1 screens, their states, and the navigation between
> them. This overview indexes the screens and fixes shared conventions; one file per screen
> (`01-…`, `02-…`, `03-…`) describes each. **Fidelity is deliberately low here** — structure, content,
> states, and flow, not visual style. The look is explored in **Claude Design** (§4); tokens and
> components are fixed in Milestone 5 (Design system).

---

## 1. Screen index

| # | Screen | File | Purpose |
|---|--------|------|---------|
| 1 | Home | `01-homepage.md` | Bespoke landing. **Design-only in slice 1** — the go/no-go viability check; not implemented. |
| 2 | Songs landing (Songlist) | `02-songs-landing.md` | The filterable, complete song list. |
| 3 | Song page | `03-song-page.md` | A single song: text, video, and version cross-links. |

---

## 2. Navigation structure

```
Home  (design-only in slice 1)
  │
  └─ global nav ─▶ Songs (Songlist) ─▶ Song page
                          ▲                 │
                          │   filters       └─ version link ─▶ another Song page
                          └─ reload same page (type / alt-titles)
```

- The **global nav** shows the intended v5 sections (Home, Tour Dates, Songs, Discography, Band, News)
  for design continuity. In the slice-1 **build**, only **Home** (design-only) and **Songs** resolve;
  the rest are deferred — present in the design, not wired.
- Each song title on the landing links to its **Song page** (FR-16); a song page links **back to the
  landing** and across to its **version** pages (FR-13/FR-20).

---

## 3. Shared layout

The frame every screen sits in:

- **Header** — the Interstate-8 wordmark + tagline ("A Modest Mouse Fan Collaborative") and the global
  nav (§2).
- **Main content** — per-screen (files 01–03).
- **Footer** — minimal in slice 1 (identity / copyright). About, legal, contact, and the theme
  switcher (v2 had user-selectable themes) are **deferred**.

### Shared components

- **Global header/nav** — identical across screens; marks the current section.
- **Filter control** — labelled `<select>`/toggle used on the Songs landing (must be keyboard-operable
  and labelled, NFR-1).
- **Song link** — a text link to a song page; alternate-title songs carry a marker (§ song-landing).

### Shared vocabulary (must read identically everywhere)

Song types: **Modest Mouse**, **Ugly Casanova**, **Side projects**, **Covers** (plus **All** as the
unfiltered option). Section label: **Songs** / **Songlist**. Version wording: **"Alternate
title/lyrics for →"**.

---

## 4. Mockup conventions

- **Here (this folder):** low-fidelity, structural — grey-box regions and prose annotations. No colour,
  type, or spacing decisions.
- **Claude Design:** produces the actual visual wires/mockups (especially the homepage go/no-go),
  working from the per-screen specs and the design brief (`design-brief.md`, supporting).
- **Back into the repo:** Claude Design's exports (screenshots / HTML) are saved into
  `spec/wireframes/` as **supporting context** and referenced from the screen files — the markdown
  stays binding, the visuals sit beside it. (Keeps the spec on disk, per the project's premise.)
- **A visual-design pass follows** in **Milestone 5 (Design system)** — tokens, components, states.

> **Interactive HTML mockups** are part of this workflow, not an afterthought: the go/no-go was decided
> against a click-through canvas, `Interstate-8 Wireframes.dc.html` (all three screens, desktop +
> mobile), which sits beside these files as supporting context. Offer the same for any new screen.

---

## 5. State coverage matrix

| Screen | Empty | Loading | Populated | Error |
|--------|:-----:|:-------:|:---------:|:-----:|
| Home | — (design-only; not implemented in slice 1) | — | ☐ (static draft) | — |
| Songs landing | ☐ (no-results for a filter combo, FR-19) | ☐ (server render) | ☐ | ☐ (site error page) |
| Song page | ☐ (missing fields omitted cleanly, FR-15) | ☐ | ☐ (standard / alternate / parent variants) | ☐ (404 unknown slug) |

---

## 6. Decisions log

- **2026-07-07** — **Homepage is design-only** in slice 1 (the go/no-go viability check); not built.
- **2026-07-07** — **Homepage composition set as components, not layout** (grounded after reading v2
  `index.php`, which was news-first). **Confirmed:** latest news, upcoming tour dates, recently-passed
  shows + setlists, "on this day / this week" (broadened with album anniversaries + fallback),
  tour-stats teaser, and a visible Contribute call. **On trial (shown in the mockup, may be cut):**
  song spotlight, from the discography. **Dropped:** recently-added; and from v2, Facebook/Twitter
  share + theme switcher. Layout is Claude Design's and must **not** mimic v2. (Sketches convey content
  grouping, not layout.)
- **2026-07-07** — **Design direction captured** (`design-brief.md` + `references/`): centred layout;
  a highway/interstate motif as the identity through-line; three colour lanes for the three homepage
  directions — shield red/white/blue, the extracted muted-highway palette, and a third "surprise"
  scheme introduced at the actual-design stage. All lanes hold WCAG 2.1 AA contrast (NFR-1).
- **2026-07-11** — **Go/no-go: GO.** Claude Design produced `Interstate-8 Wireframes.dc.html`;
  **direction 6d chosen** (highway hero + "TAKE AN EXIT", muted-highway palette with a maroon accent,
  ledger + letter-rail songlist, side-by-side alternate lyrics). Covers all three screens, desktop +
  mobile, on the muted-highway lane. The other homepage variants (6a/6c) remain in Claude Design's
  archive, not exported. Full visual polish and the third "surprise" palette are Milestone 5.
- **2026-07-11** — **Song-page "coming soon" rail accepted.** 6d reserves a right-rail with disabled
  "coming soon" stubs for the deferred releases / last-played / tour-stats widgets so lyrics don't
  reshuffle when those ship. Consistent with FR-14 (no real release/live data is shown — same spirit as
  the disabled landing filters, FR-11); revisit at implementation if it reads as clutter.
- **2026-07-07** — **Global nav shown for continuity**, but only Home (design) and Songs (live) are in
  the slice-1 build; other sections deferred.
- **2026-07-07** — **Released / Played-live filters shown but disabled** on the landing (FR-11).
- **2026-07-07** — **Visuals produced in Claude Design**, exports returned to `spec/wireframes/`;
  structure/states/navigation stay binding here, visual system settles in Milestone 5.
