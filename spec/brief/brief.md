# Project Brief: Interstate-8 — v5 (`5.0.x-dev`)

| | |
|---|---|
| **Document** | Project brief |
| **Repository location** | `spec/brief/brief.md` |
| **Status** | Approved — Milestone 1 signed off (2026-07-07) |
| **Date** | 2026-07-07 |

> **Purpose of this document.** The brief fixes *what* we are building and *why*, the boundaries of
> the first release, and how we will know it is done. It is **binding**: once approved it is not
> reopened casually. Keep it stable — running status lives in `spec/milestone-plan.md`, not here.
> Approval of this brief closes Milestone 1.
>
> **Approved and binding** (Milestone 1 signed off 2026-07-07): laid down by `sfk-version` and
> approved directly on review. "First release" here means the rolling `5.0.x-dev` line, delivered in
> thin vertical slices building toward a `5.0.0` launch. This brief scopes the **northstar** (the whole
> of v5) plus **slice 1**, the first increment.

---

## 1. Overview

Interstate-8.com is a long-running Modest Mouse fan archive, originally built around 2006. **v5** is a
ground-up rebuild of the shipped **v2** site on **Drupal 11**, preserving roughly 99% of the existing
functionality behind a new responsive look and feel, a faster front end (Drupal 11 render/caching),
and a much better, faster editing experience on the back end. The single sentence of value: *the
definitive Modest Mouse resource — setlists indexed by song, a complete discography, and news —
rebuilt to be fast, responsive, and pleasant to maintain.*

**Meta-goal.** The spec-first method (SFK) is treated as a deliverable in its own right —
externalising the mental model onto disk so the project survives multi-year gaps and stays
agent-legible. v2's near-frictionless build is the north star for that method; shipping v5 in thin
slices is how the method proves itself.

## 2. Problem statement

v2 shipped and ran for years, but it was dated — an old stack, a non-responsive design, and a slow
editing experience — and it has since been **taken down**: the site has been offline for a few years.
The two attempts to replace it — **v3 and v4 — both died at design stalls** and never shipped. The
status quo is therefore **no live site at all**, plus a graveyard of stalled rebuilds — which raises
the stakes on shipping.
v5's central job is to **break the stall pattern**: deliver working software in small end-to-end
slices under a rolling `5.0.x-dev`, so progress is continuous and design risk is retired early rather
than deferred until it kills the project.

## 3. Users

- **Fans (primary, public).** Read-heavy visitors on a wide range of devices — responsive design is
  essential, not optional. They browse songs, setlists, discography, and news.
- **Operator / editor (Gregg, solo).** Needs a fast, pleasant back end; owns content-model and
  architecture decisions directly, with agents executing repetitive work.
- **Fan contributors.** Existing v2 contribution features carry forward (later slices).

## 4. Goals (slice 1 of `5.0.x-dev`)

The northstar is the full v5 rebuild (§10 roadmap holds the rest). Slice 1 is the first increment and
must deliver, in order:

1. **Dev stack stood up** — Drupal 11, DDEV, a testing harness, the essential contrib modules, and an
   admin theme, ready for day-to-day work.
2. **A repeatable Songs import** from the v2 MySQL dump via the Migrate API (rollbackable), Songs
   being the most self-contained content type to start with.
3. **The Songs section** — a landing page plus song detail pages showing song data, lyrics, notes,
   and music videos, with categories/tags only. **No cross-entity relationships yet** (no "appears on
   release", no "played live at").
4. **A homepage design draft in Claude Design** good enough to answer the project's go/no-go: *can a
   genuinely good redesign be achieved?* Plus the Song-section designs (the only ones built in slice
   1), the shared atoms, and the molecules those screens use — bounded deliberately.

## 5. Domain model / core structure

The archive's full entity set, for context: **Songs**, **Releases** (albums, EPs, bootlegs, side
projects — inclusion anchored to core members Isaac Brock, Jeremiah Green, Eric Judy), **Concerts /
Setlists** (tour dates indexed by song, back to 1994), **News**, and fan contributions.

Slice 1 models **only the Song entity**, but designs its field schema **with the full model in mind**,
leaving **nullable seams** for the relationships it does not yet populate (releases a song appears on,
live performances, a `setlistfm_id`). This is the same seam pattern used elsewhere, and it avoids
remodelling the Song entity when later slices add relationships.

## 6. Core approach — vertical-slice delivery

Each slice cuts **end-to-end through one content type**: migrate → model → pages → design. Proving the
whole pipeline on one self-contained type before scaling is the concrete antidote to the v3/v4 design
stall. Migration follows **Path A**: the **v2 MySQL dump is the sole source of truth**, imported via
the Migrate API (porting/adapting v2–v3 source plugins), and the import is **repeatable and
rollbackable** from day one.

## 7. Design as an early viability gate

Because v3 and v4 died on design, the **homepage design draft is pulled forward as a cheap go/no-go**.
Its job is not to be built in slice 1 — it is to answer whether Claude Design can produce a genuinely
good look for the site. A good-enough draft is the signal to carry on; a poor one is the signal to
reconsider before investing further. Only the **Song-section** designs are implemented in slice 1.

## 8. Technical direction

Drupal 11 / PHP, local development via **DDEV**. Front end: an owned starterkit-generated theme with
**SDC** as the component layer and **Tailwind v4** hand-wired without SASS (design tokens as CSS
custom properties); Layout Builder scoped narrowly. **Search API is deferred** until a content type
needs it — a View covers the Songs landing for now (lazy adoption). Data enters through the **Migrate
API** from the v2 dump. **Hard constraint:** never hand-author Drupal config YAML — generate it via
the admin UI/API and verify the exported config against the spec. Default gate: `ddev exec phpunit`;
front-end tests run on the sections built. These are directional; the Architecture milestone makes
them binding.

## 9. Out of scope (slice 1)

- **The phpBB board / forum** — removed from v5 entirely (it was a subdomain anyway).
- **Cross-entity relationships on songs** — releases, live performances/setlists; deferred to later
  slices, with schema seams left in place.
- **Releases, Concerts/Setlists, News sections** — not built in slice 1.
- **Search API / faceted search** — deferred until a concrete trigger.
- **Homepage implementation** — design draft only (the viability gate); no build.
- **setlist.fm integration** — deferred (nullable `setlistfm_id` seam left).
- **Fan-contribution features** — later slice.

## 10. Future roadmap (post-release, not committed)

- Remaining content types and their relationships: **Releases** (with the core-member inclusion
  rule), **Concerts/Setlists** indexed by song, **News**.
- **Search API** adoption once a content type justifies it.
- **setlist.fm integration** (the `setlistfm_id` seam is left now).
- **Fan-contribution features.**
- **Full homepage build** to the approved design.

## 11. Success criteria

Slice 1 is done when:

1. A fresh checkout can `ddev start` + install and bring the site up.
2. Running the migration imports the Songs from the v2 dump (repeatable/rollbackable), verifiable by
   row counts and spot checks.
3. A visitor can browse the Songs landing page and open a song page showing its data, lyrics, notes,
   and videos — responsively.
4. Front-end tests for the Songs landing and song pages pass, alongside the `ddev exec phpunit` gate.
5. A homepage design draft exists in Claude Design, judged good enough to continue (the go/no-go), and
   the Song-section designs the pages are built to exist.

Additionally, for the meta-goal:

6. Every milestone is documented in Markdown and committed; work is tracked as one ticket file per
   unit, updated as work completes.

## 12. Risks and open questions

| Risk / question | Notes / mitigation |
|-----------------|--------------------|
| Design stall (the historical killer of v3/v4) | Pull the homepage design forward as an early, cheap go/no-go; bound design scope to the slice-1 screens + shared atoms/molecules. |
| Content-model rework | Model the Song entity now with nullable relationship seams; plan the full content model as a companion doc (`content-model.md`) in the Architecture milestone. |
| Migration fidelity from the v2 dump | Repeatable/rollbackable migration; row-count and spot-check verification; lean on the Migrate module's own coverage rather than custom migration tests. |
| Over-adoption of tooling | Lazy adoption — defer Search API and other machinery until a concrete trigger. |
| Front-end test tool | Open: Nightwatch (ships with Drupal core) vs Playwright — decided in the Test-strategy milestone. |

## 13. Repository strategy

**Single repository**, spec-first-kit layout: `spec/` holds all documentation (this brief,
requirements, architecture, test strategy…), `spec/tickets/` holds one Markdown ticket per unit of
work living *beside* the code, and the Drupal application tree (docroot layout finalised in the
scaffolding milestone). Tickets update in the **same commits** as the work they describe.

---

*Approval of this brief closes Milestone 1.*
