# Wireframe 01 — Home

| | |
|---|---|
| **Screen** | Home |
| **Route** | `/` — a `page` node, not a route (FR-22) |
| **Status in slice 1** | **Design-only — not implemented.** Its job was the viability check: *can Claude Design produce a genuinely good look for Interstate-8?* Answered **yes**. |
| **Status in slice 2** | **Shell and hero are built.** The remaining components stay design-only. |
| **Implements** | FR-22, FR-23, FR-24, FR-25 (the shell and hero). The other components implement nothing yet. |

> This file fixes the **components** the home is built around; **layout is Claude Design's to decide and
> must not mimic v2.**
>
> **Two tiers, and the line between them is what a component needs to show real data.**
> **Built in slice 2:** the page shell and the hero. **Still design-only:** every component below that
> depends on a content type slice 2 does not build — news, tour dates, setlists, discography. Their
> content stays **placeholder**; the point there is the *feel*, not live data.

---

## Hero

Built in slice 2. Distinct from the site-wide `page_hero`, which renders a page title and does **not**
appear on the front page.

| Element | Behaviour | Implements |
|---------|-----------|-----------|
| **Message** | A set editorial line, authored in the CMS. Not the page title. | FR-23 |
| **Background** | One image drawn at random from the hero's library, re-picked on every page load. With an empty library, a plain background. | FR-25 |
| **Primary nav over it** | Transparent while the hero is in view; solid once scrolled past 24px. Links legible in both states. | FR-24, NFR-1 |

## Components

Grouped by intent; arrangement is Design's call. **All of these are design-only** — the hero above is
the slice-2 build.

| Component | Purpose | Data (built in) | Status |
|-----------|---------|-----------------|--------|
| **Latest news** | The most recent news article, given prominence | News (later slice) | Confirmed — "for now" |
| **Upcoming tour dates** | The next confirmed shows | Tour dates (later) | Confirmed |
| **Recently passed shows + setlists** | Just-played dates with the setlists people want right after a show | Tour + setlists (later) | Confirmed |
| **On this day / this week** | Shows played on *today's* date across the years **plus album/EP release anniversaries**; widen to "this week" or the nearest notable date when a day is bare (avoids empty days) | Setlists + discography (later) | Confirmed |
| **Tour-stats teaser** | Contextual stats, not random: "this tour — most-played / debuts / bustouts", or "X hasn't been played since…". Draws on v2's valued tour statistics | Setlists / stats (later) | Confirmed |
| **Song spotlight** | A featured/random song linking into the Songlist. **On trial** — shown in the mockup to judge, may be cut. (The one component that can be partly real in slice 1 — Songs is live.) | Songs (**live**) | On trial (mockup only) |
| **From the discography** | A featured release. **On trial** — shown in the mockup to judge, may be cut. | Discography (later) | On trial (mockup only) |
| **Contribute** | A visible call to submit setlists / corrections / tips (the site's human-curated sourcing model) | — | Confirmed (placement Design's call) |

**Dropped from v2:** Facebook/Twitter share widgets and the theme switcher. **Dropped from proposals:**
"Recently added" (would be ~99% setlists — low signal).

---

## Notes for Claude Design

- **This is where the look is judged** — composition, type, colour, and mood matter most here; it is
  the viability gate. Explore a few distinct directions (see `design-brief.md`).
- **Layout is yours** — do not replicate v2's news-column + sidebar arrangement; compose these
  components afresh. The home is built on the `page` content type with **Layout Builder**
  *(amended — 5.0.x-dev2)*, so assume a bespoke composed layout.
- Content is **placeholder** except that **Song spotlight** can reference real songs (the live section).
- Accessibility is structural even in the draft (semantic landmarks, one `<h1>`, heading order, NFR-1).
- **The hero is built, so draw it to be built from** — at every breakpoint, with the nav over it in
  both its transparent and solid states.

## States *(rewritten — 5.0.x-dev2)*

- **Populated** — the hero renders its message over a background image.
- **Empty library** — the hero renders a plain background; the message still shows (FR-25).
- **Not applicable** — the design-only components have no implemented states in slice 2.
