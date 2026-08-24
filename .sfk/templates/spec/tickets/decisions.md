# <PROJECT> — Ticket-system decisions

| | |
|---|---|
| **Document** | Decision record for the ticket system — verification passes, promotions, deferrals |
| **Repository location** | `spec/tickets/decisions.md` |
| **Status** | **Archive — not binding.** `BOARD.md` is the queue; `CONVENTIONS.md` is the process |

> **This is an archive, and it is deliberately not in the reading path.** It exists so `BOARD.md` can stay
> what its own header calls it — a **derived, topological index** — instead of accumulating a paragraph of
> narrative per verification pass. Nobody reads this file routinely, and that is correct: its value is at
> the rare moment someone asks *"why was that promoted, and why was this one left?"*
>
> **It is not the board's history.** It records decisions the **ticket system** took: what a pass found,
> what was promoted and against which gate, what was deliberately deferred and why, and which findings
> turned out to be specification changes rather than tickets. Append; never rewrite.

## What belongs here

- **Per-pass narrative.** One entry per `sfk-verify` code-mode pass: the boundary it ran at, the tickets it
  produced, and the shape of what it found.
- **Deferral reasons.** Why a cleanup ticket was *not* promoted is a decision, and it is invisible
  everywhere else — a row that simply sits in the backlog records no reasoning at all.
- **Findings that became something else** — a spec change rather than a ticket, a parked item, a rejected
  observation.

## What does not

- **A promotion's constraint.** That is the row: its position, its `🔺 before <id>` flag, and the ticket's
  `before:` field (`CONVENTIONS.md` §4.6, §6.5). Constraints are data and belong on the board.
- **A promotion's reasoning.** That belongs in the promoted ticket's `## Background`, where the person
  implementing it will read it. Only the *pass-level* narrative belongs here.

## The reference runs one way

Entries name tickets and passes; **a board row never cites an entry here**, and neither does a ticket. If
you find yourself wanting to point at this file from `BOARD.md`, the fact you are pointing at is one a
builder needs — so it belongs in the ticket, not the archive.

---

## Moving existing backlog prose here

**The recommended answer is: don't.** Let it decay. As each ticket is next touched its rationale moves
into it and the board note goes, and the whole problem dissolves without a migration. The rule above
governs the **next** pass; nothing requires you to relocate what is already written.

**Why "move it, don't delete it" is not the safe option it sounds like.** Relocation preserves the content
and **breaks every reference to where it was**. One project measured its board's backlog as the target of
**27 references across 13 files** — version briefs, the milestone plan, `CLAUDE.md`, `CONVENTIONS.md`, six
ticket files, the board itself — plus an anchor link in the board's own *Contents* list. The
reference-update is not a footnote to the move; it is comparable in size to it, and every one is a chance
to break something that no gate will catch.

**If you move it anyway, the order is the point:**

1. **Sweep and list every reference** — to the *section name*, so **prose citations and anchor links
   both**. Enumerate spellings first: a compound noun that is sometimes hyphenated (`cleanup backlog` /
   `cleanup-backlog`) will otherwise return a plausible number and omit the rest. Search
   case-insensitively, and carry a positive control (`sfk-verify` step 4).
2. **Move the text**, unedited.
3. **Update every reference** on the list, including the *Contents* anchor.
4. **Re-sweep** and confirm the list is empty.

**A rename has the same problem as a move.** Renaming the section breaks exactly the same references, so
the same four steps apply.

---

## Entries

> Newest last, dated. One entry per pass.

- **<DATE> — `sfk-verify` code mode at <boundary>.** <What the pass covered.>
  - **Promoted:** `<PRJ>-NNN` — <the gate it would have failed>.
  - **Deferred:** `<PRJ>-NNN` — <why it can wait>.
  - **Not a ticket:** <finding> — <where it went instead>.

_(No passes recorded yet.)_
