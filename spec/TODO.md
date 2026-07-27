# Interstate-8.5 — TODO (deferred, not yet ticketed)

| | |
|---|---|
| **Document** | Deferred follow-ups that have no ticket yet |
| **Repository location** | `spec/TODO.md` |
| **Related** | `spec/tickets/BOARD.md` (the real queue), `spec/tickets/CONVENTIONS.md` §6 (cleanup backlog) |

> **What belongs here, and what does not.** This file is for work that is **known but not yet
> specifiable** — where the *decision* hasn't been made, so a ticket can't honestly be written yet (a
> ticket has to be implementable from itself plus the spec, per `TICKET-TEMPLATE.md`). Anything that
> *can* be specified belongs in `BOARD.md` instead — either the main sequence or the cleanup backlog —
> not here. This is deliberately not a second, parallel backlog.
>
> **Each entry names what has to be decided before it can become a ticket.** An entry that no longer
> has an open question is overdue for promotion; delete it from here in the same commit that files the
> ticket.

---

## Song page — redesign the alternate-version composition

**Raised:** 2026-07-26, reviewing INT8-020 (now `done`).

INT8-020 shipped FR-13/FR-20 as specified and its tests pass, but review found the result unsatisfying
in a way that isn't a bug list:

- The alternate block is missing the light-blue (`--color-tint`) header bar the hi-fi draws above the
  two lyric columns.
- More substantially: the hi-fi only ever draws this composition **as an isolated panel**, never
  within the full song-page layout — so how it should sit relative to the quote, the lyrics, the notes
  and the right-hand rail was never actually settled by the design. The site owner's assessment is
  that the current arrangement does not work.

**Not filed as a ticket because the design decision doesn't exist yet.** Patching the missing header
bar onto a composition that is about to be replaced would be work thrown away, and a ticket written
now could only restate the problem, not specify the outcome.

**What has to happen first:** a design pass that places the alternate-version view inside the real song
page — either an updated hi-fi export or an equivalent decision recorded in `design-system.md` §3
(Lyric pair) — resolving: where the pair sits relative to the page's other sections, whether it keeps
the panel framing (border + tint header) or dissolves into the page, and how the parent cross-link and
the "alternate versions" list relate to it.

**What already exists and should be reused, not rebuilt:** the `lyric-pair` SDC (deliberately
structural — two slots, no props), the `interstate_85_preprocess_node__song()` data resolution (moving
to `i8_services` under **INT8-035**), and `tests/playwright/tests/song-versions.spec.ts`, whose 17
assertions are written against *behaviour* (FR-13/FR-20) rather than layout — the geometry-specific
ones are the side-by-side/stacking checks, and those are the only ones a redesign should need to
revisit.
