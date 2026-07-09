# Wireframe 01 — Home (design-only, go/no-go)

| | |
|---|---|
| **Screen** | Home |
| **Route** | `/` |
| **Status in slice 1** | **Design-only — not implemented.** Its job here is the viability check: *can Claude Design produce a genuinely good look for Interstate-8?* |
| **Implements** | — (no `FR`; not a slice-1 build target) |

> The homepage exists in slice 1 **only as a design draft in Claude Design** — the project's go/no-go
> (brief §7). This file fixes the **components** the home is built around; **layout is Claude Design's
> to decide and must not mimic v2.** All content is **placeholder** (news, tour dates, setlists,
> discography are later slices) — the point is the *feel*, not live data.

---

## Components

Grouped by intent; arrangement is Design's call.

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
  components afresh. The FE proposal expects the real home to be built later with **Layout Builder**
  (the one page that justifies it), so assume a bespoke composed layout.
- Content is **placeholder** except that **Song spotlight** can reference real songs (the live section).
- Accessibility is structural even in the draft (semantic landmarks, one `<h1>`, heading order, NFR-1).

## States

Not applicable — a static design draft, not an implemented, data-driven screen in slice 1.
