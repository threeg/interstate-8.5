# Interstate-8 — the wireframes decisions

| | |
|---|---|
| **Document** | Decision record and superseded wording for `overview.md` |
| **Repository location** | `spec/wireframes/decisions.md` |
| **Status** | **Archive — not binding.** The binding document is `overview.md` |

> **This is an archive, and it is deliberately not in the reading path.** It exists so the binding
> document beside it can hold **builder instructions only** (`spec/README.md`, *How versions evolve*).
> Nobody reads this file routinely, and that is correct — its whole value is at the rare, expensive
> moment someone asks *"why is this rule like this, and can I just change it?"*
>
> **Do not summarise it upward into the binding document, and do not maintain it as though it were
> current.** Append; never rewrite.

## What belongs here

- **Decisions** — UI decisions from the wireframe interview — layout choices, ordering and grouping, what was deliberately left out. Record the options considered and the reason, not just the outcome.
- **Superseded wording** — when a rule in the binding document is rewritten, its previous text moves
  here **verbatim**. It does not stay beside the live rule, where it gets read as current.

## What does not

- **Rules.** If a sentence can be written as a rule, it belongs in the binding document.
- **Operational hazards** — a finding a builder would otherwise rediscover expensively, whose absence
  lets someone build the wrong thing. Those stay in the binding document; they are neither
  justification nor history.

## The reference runs one way

Entries are **keyed by the id or section they affect**, so "why is this like this" is a search
(`rg '<id>' spec/`). **A rule never cites its entry here.** Cite one and someone soon adds a sentence
explaining the citation, and the narration is back in the binding text. Wanting to point at this file
*from* a rule is the signal that the justification should have stayed out of the rule.

---

## Entries

> Newest last. One line each where possible; the reasoning lives here, so it may run longer than a rule
> would — but a decision is not an essay.
>
> **Relocated verbatim from `overview.md` §6 at the v1.4.7 kit update (2026-08-08).** Order is as it
> stood there; nothing was reworded.

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

---

## Slice 2 (`5.0.x-dev2`) — Milestone 13

- **2026-08-02** — **`D-a` settled: the lyric pair replaces the Lyrics section in place, unframed**
  (`03-song-page.md`, Variant A). Options weighed: *in place* (chosen), an *additive panel below the
  lyrics* (what the hi-fi drew and `INT8-020` shipped), and a *full-width band* breaking the main
  column. In-place won on page-shape consistency — a standard song and an alternate then differ only in
  the contents of one section, which is the same argument the 6d "coming soon" rail already won on
  (nothing reshuffles). The additive panel was rejected because it makes an alternate version's *own*
  lyrics read as an appendix to another song's, when an alternate is a full song in its own right
  (`DR-2`). Framing dissolved for the same reason: a border plus tinted header bar reads as a widget
  embedded in the page, and lyrics are the page's substance.
  **Root cause, recorded because the parking-lot entry assumed otherwise.** `TODO-001` read as a design
  that came out badly. It was not: `03-song-page.md` handed the pairing arrangement to Design
  (*"pairing arrangement is Design's"*, *"the layout is yours"*) and the hi-fi only ever drew the pair as
  an isolated panel — so **in-page placement was owned by nobody**. The fix is therefore an ownership
  fix, not a redraw.
  **Superseded wording, verbatim** — `03-song-page.md`, Variant A bullets 1–2:
  > - A **"alternate title/lyrics for → [Parent]"** link.
  > - This version's lyrics and the **parent's normal lyrics** shown **clearly paired** (side-by-side on
  >   wide screens; may stack on mobile, NFR-2 — pairing arrangement is Design's).

  And the intro blockquote's arrangement clause:
  > Arrangement (single column, main + rail, where the video sits, how the side-by-side lyrics are laid
  > out) is **Claude Design's to improve upon**

  And the *Notes for Claude Design* bullets:
  > - The **side-by-side lyrics** (Variant A) is the distinctive, bootleg-nerd feature — make the two
  >   sets clearly paired and readable, including how they behave on mobile. This is the detail to nail.
  > - Lyrics are the hero content: prioritise readable typography and stanza spacing. Feel free to
  >   rethink the page shape entirely — the video and any future related content need a home, but the
  >   layout is yours.

- **2026-08-02** — **`D-e` settled: sharpen the split rather than demote wireframes.** Wires bind *which
  surfaces and states exist*; the design file binds *everything about how they look*
  (`overview.md` §4.1). The word **structure** previously appeared on both sides of
  `design-system.md` §1.1 — wires "binding for structure and state coverage", the hi-fi binding
  "placement, structure, hierarchy" — and that overlap is what let a wire be read as an implementation
  reference. Demoting wires to non-binding inputs was rejected: a hi-fi rarely draws every empty,
  loading and error state, so state coverage would have ended up owned by nothing, which is `D-a`'s
  failure repeated one level up. §1.1's matching wording is aligned at M14, which owns that document.
  **New rule carried from `D-a`'s root cause:** *a composition drawn only in isolation has not been
  designed*. It is stated in `overview.md` §4.1 as a requirement on design artefacts rather than as an
  observation, because the isolated-panel hi-fi satisfied every rule that existed at the time.

- **2026-08-02** — **Homepage reclassified from design-only to partly built** (`01-homepage.md`,
  `overview.md` §1, §5). Slice 2 builds the shell and the hero; every other component stays design-only.
  The dividing test is whether a component needs a content type slice 2 does not build, matching the
  version brief §5. The hero is drawn as a build target — every breakpoint, nav over it in both states.
  **Superseded wording, verbatim** — `01-homepage.md` *States*:
  > Not applicable — a static design draft, not an implemented, data-driven screen in slice 1.

  And `overview.md` §5's Home row:
  > | Home | — (design-only; not implemented in slice 1) | — | ☐ (static draft) | — |

  And the *Notes for Claude Design* layout bullet's expectation:
  > The FE proposal expects the real home to be built later with **Layout Builder** (the one page that
  > justifies it), so assume a bespoke composed layout.
