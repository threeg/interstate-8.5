# Interstate-8 — Wireframes: Overview, Navigation and Conventions (v5, `5.0.x-dev` slice 1)

| | |
|---|---|
| **Document** | Wireframes overview |
| **Repository location** | `spec/wireframes/overview.md` |
| **Status** | Binding specification (for UI) — Milestone 4 signed off (2026-07-11) |
| **Chosen visual direction** | **6d** in `claude-design-hand-off/Interstate-8 Wireframes.dc.html` (go/no-go: **GO**). *(amended — 5.0.x-dev2: **superseded** as the wire set, and **moved** into the export bundle. Kept because shipped tickets cite it; still the record of the go/no-go.)* |
| **Current wire set** *(5.0.x-dev2)* | `claude-design-hand-off/` — `00-components`, `01-homepage`, `02-songs-landing`, `03-song-page`, one `.dc.html` per page. Supporting context; the markdown here binds. |
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
| 1 | Home | `01-homepage.md` | Bespoke landing. *(amended — 5.0.x-dev2)* **Shell and hero built in slice 2**; its remaining components stay design-only until the content types they need exist. |
| 2 | Songs landing (Songlist) | `02-songs-landing.md` | The filterable, complete song list. |
| 3 | Song page | `03-song-page.md` | A single song: text, video, and version cross-links. |

---

## 2. Navigation structure

```
Home  (shell + hero built in slice 2)
  │
  └─ global nav ─▶ Songs (Songlist) ─▶ Song page
                          ▲                 │
                          │   filters       └─ version link ─▶ another Song page
                          └─ reload same page (type / alt-titles)
```

- The **global nav** shows the intended v5 sections (Home, Tour Dates, Songs, Discography, Band, News)
  for design continuity. *(amended — 5.0.x-dev2)* In the **build**, only **Home** and **Songs**
  resolve; the rest are deferred — present in the design, not wired. Home resolves to a `page` node
  (FR-22), not a route.
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

### 4.1 The export bundle is generated — normalise it on arrival, then leave it alone

**`claude-design-hand-off/` comes from Claude Design and is replaced wholesale on every export.** Two
consequences, and they pull in opposite directions, so both are stated:

**On arrival, normalise the bundle.** The exporter's default shape is not the repository's, so every
export needs the same two corrections before it is committed:

1. **Flatten it.** The exporter nests the files under `<project-name>/project/`; this repository holds them
   flat in `claude-design-hand-off/`. Assets and `support.js` are referenced relatively, so flattening is
   safe — verify no `.md` outside the bundle still points at the nested path.
2. **Delete the generated `README.md`.** The exporter emits one in every bundle; it is **not** part of the
   design project and cannot be removed at source. It addresses coding agents and tells them the designs
   carry dimensions, colours and layout rules to be matched pixel-perfectly — **for a wireframe bundle
   that is the opposite of the truth** (§4.2, and `design-system.md` §1.1: these are grey-box structural
   wires and never a value source). Delete it rather than annotating it; an annotated file still carries
   the wrong instruction in every other line.

**After that, do not edit inside the bundle.** Any further change is lost at the next export, silently.

- To change a wire, change it **in Claude Design and re-export**, then normalise again.
- To remove a *design* file, delete it at source in Claude Design — that is project content and the
  deletion sticks. This is the opposite of the `README.md` case above, and the distinction is whether the
  exporter or the project owns the file.
- Anything that must survive an export — a decision, a correction, a rule about the wires — goes in the
  markdown **outside** the bundle: these files, or `decisions.md`.

### 4.2 What this folder binds

- **These files bind which surfaces and states exist**, and which content each surface carries. A
  surface or state absent here is not built; a state listed here MUST be designed and implemented.
- **The design file binds everything about how they look** — placement, proportion, type, colour,
  spacing, responsive behaviour.
- **Where a wireframe fixes a placement it says so explicitly**, naming it as an exception. Silence
  means the design decides.
- **A composition drawn only in isolation has not been designed.** A design artefact MUST show each
  composition **in the page it belongs to**, at every breakpoint it specifies. An isolated panel does
  not discharge a placement.

> `design-system.md` §1.1 (*Artefact authority*) records which artefact binds which kind of fact, and
> its wording is aligned to this at Milestone 14. §4.1's no-edit rule applies to **every** generated
> export bundle, including the design ones, not only the wires.

- **Here (this folder):** low-fidelity, structural — grey-box regions and prose annotations. No colour,
  type, or spacing decisions.
- **Claude Design:** produces the actual visual wires/mockups (especially the homepage go/no-go),
  working from the per-screen specs and the design brief (`design-brief.md`, supporting).
- **Back into the repo:** Claude Design's exports (screenshots / HTML) are saved into
  `spec/wireframes/` as **supporting context** and referenced from the screen files — the markdown
  stays binding, the visuals sit beside it. (Keeps the spec on disk, per the project's premise.)
- **A visual-design pass follows** in **Milestone 5 (Design system)** — tokens, components, states.

> **Interactive HTML mockups** are part of this workflow, not an afterthought: the go/no-go was decided
> against a click-through canvas, now at
> `claude-design-hand-off/Interstate-8 Wireframes.dc.html`. *(amended — 5.0.x-dev2.)* **The wire
> set is now one file per page** in that same folder, not a single canvas — a screen's wire is the file
> that names it, and a shared component's structure is defined once in `00-components` and composed, never
> redrawn, by the screen pages. Offer the same for any new screen.
>
> **But say what a mockup is *not*.** That canvas is a **proportion and structure reference, not a value
> source**: it predates the token set, its palette carried the wireframe's maroon accent rather than the
> shipped teal, and any artefact standing in for something not yet final (unavailable fonts, placeholder
> imagery, sample copy) carries compensation for the substitute — copy a value out of it and you ship the
> compensation as though it were the design. Which artefact *does* hold the binding values is recorded
> once, in `spec/design/design-system.md` §1.1 (*Artefact authority*). Offering a mockup without pointing
> at that is how an implementer ends up picking a value by eye.

> **Annotations: two properties, whatever carries them.** The carrier is this project's choice and may
> differ per artefact (prose beside a grey-box region here; a marked element or comment convention in an
> exported mockup). Whatever carries it MUST satisfy both:
>
> - **Unmistakable at the point of use.** An implementer reading the artefact must never have to ask
>   whether they are looking at the design or at a note about it. Visually *and* structurally distinct,
>   with a machine-findable marker so a check could count or strip them.
> - **Removable without loss.** Delete every annotation and a valid artefact must remain. If it doesn't,
>   something binding is living in an annotation — and an annotation is the one place a rule can neither
>   bind nor survive a re-export.
>
> **An annotation gives direction, and only where the drawing cannot.** It is not the place for why an
> alternative was rejected, how a neighbouring mechanism works, or what a later milestone will do — those
> have homes (root `CLAUDE.md`, *Write instructions, not arguments*). If the drawing already says it, the
> annotation is noise; if the annotation states a rule, the rule is in the wrong document.

---

## 5. State coverage matrix

| Screen | Empty | Loading | Populated | Error |
|--------|:-----:|:-------:|:---------:|:-----:|
| Home *(amended — 5.0.x-dev2)* | ☐ (hero with an empty image library → plain background, FR-25) | ☐ (server render) | ☐ (hero message over a background image, FR-23) | ☐ (site error page) |
| Songs landing | ☐ (no-results for a filter combo, FR-19) | ☐ (server render) | ☐ | ☐ (site error page) |
| Song page | ☐ (missing fields omitted cleanly, FR-15) | ☐ | ☐ (standard / alternate / parent variants) | ☐ (404 unknown slug) |

---

## 6. Decisions and superseded wording

> Not here — see **[`decisions.md`](decisions.md)** beside this file. This document holds **builder
> instructions only**: rules, contractual values, and operational hazards. Why a rule is what it is, and
> what it used to say, live in the archive so they are out of the reading path (`spec/README.md`, *How
> versions evolve*). The reference runs **one way** — entries there name rules here; a rule never cites
> an entry.
