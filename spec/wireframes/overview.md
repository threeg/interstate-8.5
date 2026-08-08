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

Song types: **Modest Mouse**, **Ugly Casanova**, **Side Projects**, **Covers** (plus **All** as the
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
>
> **But say what a mockup is *not*.** That canvas is a **proportion and structure reference, not a value
> source**: it predates the token set, its palette carried the wireframe's maroon accent rather than the
> shipped teal, and any artefact standing in for something not yet final (unavailable fonts, placeholder
> imagery, sample copy) carries compensation for the substitute — copy a value out of it and you ship the
> compensation as though it were the design. Which artefact *does* hold the binding values is recorded
> once, in `spec/design/design-system.md` §1.1 (*Artefact authority*). Offering a mockup without pointing
> at that is how an implementer ends up picking a value by eye.

---

## 5. State coverage matrix

| Screen | Empty | Loading | Populated | Error |
|--------|:-----:|:-------:|:---------:|:-----:|
| Home | — (design-only; not implemented in slice 1) | — | ☐ (static draft) | — |
| Songs landing | ☐ (no-results for a filter combo, FR-19) | ☐ (server render) | ☐ | ☐ (site error page) |
| Song page | ☐ (missing fields omitted cleanly, FR-15) | ☐ | ☐ (standard / alternate / parent variants) | ☐ (404 unknown slug) |

---

## 6. Decisions and superseded wording

> Not here — see **[`decisions.md`](decisions.md)** beside this file. This document holds **builder
> instructions only**: rules, contractual values, and operational hazards. Why a rule is what it is, and
> what it used to say, live in the archive so they are out of the reading path (`spec/README.md`, *How
> versions evolve*). The reference runs **one way** — entries there name rules here; a rule never cites
> an entry.
