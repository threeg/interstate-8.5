# <PROJECT> — Parking lot

A **waiting room** for work you *know* is coming but genuinely **cannot ticket yet** — because the
design or product **decision it depends on does not exist**. This is the one place that work is allowed
to live, so the reasoning behind "we deliberately stopped here" lands on disk instead of dying in a
closed ticket's notes. It is committed and shared, so anyone on the team (or a BA planning the next
version) can see it.

> **This is not a second backlog.** Anything that *can* be specified goes to `spec/tickets/BOARD.md`,
> not here. An entry belongs here **only** while it has an open question that blocks it from being a
> ticket. The moment that question is answered, the entry is overdue — it becomes a real ticket and
> leaves this file (see *Lifecycle* below).

## The discipline (why this file doesn't rot)

- **Every entry names the decision still owed.** This is the whole rule. An entry with no open question
  is not a parking-lot item — it is a ticket waiting to be written. No "decision owed" ⇒ it does not
  belong here.
- **It is read twice, on two different rhythms.** `sfk-version` **harvests** it at the start of each
  version and asks which entries that version commits to resolving — the moment an owed decision gets
  pulled into scope. `sfk-signoff` also **sweeps** it at every milestone boundary, surfacing entries related
  to the milestone just finished and asking whether their owed decision has now been made. The sweep exists
  because version planning alone is too coarse: an entry parked early in a version would otherwise wait for
  the *next* version's planning even when its blocker cleared mid-version. The sweep only reports and asks —
  an entry still leaves at ticket generation, never at sign-off.
- **An entry leaves the active list, but its id stays.** The entry **body** is removed in the same commit
  that files its real ticket (its *reuse* and *where it surfaced* notes carry into the ticket's Background),
  and a **one-line tombstone** is added to *Resolved* below. The active list stays short; the record survives.
  **Why the id must survive — citation integrity.** A `TODO-n` is **cited while it is open** — in a ticket's
  `## Background`, in a board note, in a commit message — and those citations are written to last. The
  tombstone is what stops a live citation resolving to nothing. That is the same job `spec/id-registry.md`
  does for every other id family, which is why the rule generalises rather than being a quirk of this file.
  **The consequence that makes a violation detectable:** ids are assigned as "next after the highest", so if
  resolved entries vanished the next id would be computed from an undercount and **reuse a number** — a
  collision nothing could catch, because the evidence would be exactly what was deleted. Note that the
  arithmetic alone would be satisfied by remembering one number; it is the citations that require a **row**.
  This also matches how the kit treats its other registers: `BOARD.md` collapses shipped versions rather than
  deleting them, and `spec/open-questions.md` keeps closed rows. Demote, don't erase.
- **Capture is cheap but disciplined.** `/sfk-todo <one line>` appends an entry without ceremony, but
  always records the decision owed — so the fast path can't erode the rule above.

## Lifecycle of an entry

```
captured here (decision owed, unspecifiable)
   → selected at sfk-version (its owed decision is pulled into the version's scope)
   → the spec milestones make that decision (brief / requirements / architecture / design / …)
   → ticket generation files a real ticket AND tombstones this entry, in one commit
```

An entry never becomes a ticket directly — its blocking decision must be made first, and that happens
in the spec milestones that run **before** ticket generation. That is why the parking lot is read at
`sfk-version` (to pull the decision into scope), not first noticed at ticket generation (too late).

---

## Entries

> One block per item. Keep each self-contained (a stable `id` keeps concurrent appends merge-friendly).
> When a block's ticket is filed, remove the block and add its tombstone to *Resolved*. Newest first.

<!-- Template for an entry — copy, fill, place at the top of the list:

### TODO-NNN — <one-line title>

- **Raised:** <ISO date> by <author>
- **Decision owed:** <the open question that must be answered before this can be a ticket — REQUIRED>
- **Reuse:** <what already exists that should survive the decision — components, tests, endpoints>
- **Where it surfaced:** <the ticket / screen / milestone this came out of, if any>
- **Context:** <one or two sentences: what the work is and why it can't be ticketed yet>

-->

_(No parking-lot items yet.)_

---

## Resolved

> One line per entry that has become a ticket — a **forwarding address**, not a parking-lot item.
> **Never delete a line from here:** it is what keeps a live `TODO-n` citation resolvable, and the trace
> from a parked idea to the work it became.
>
> **Never harvested, never swept.** `sfk-version` harvests this file and `sfk-signoff` sweeps it, and a
> resolved row reads exactly like a parked item whose decision has just been made. **Only the *Entries*
> list above is in scope for either read.**

| Id | What it asked | Answer | Became | Retired |
|----|---------------|--------|--------|---------|
| `TODO-000` | `<the decision that was owed>` | `<what was decided>` | `<PRJ>-000` | `<ISO date>` |

_(Nothing resolved yet.)_

> **Why *what it asked* rather than a title.** An entry's identity **is** its owed decision (see *The
> discipline*) — a title names the topic, and the topic is not what was undecided. A citation cites the
> entry for its question, so that is what the row has to answer.
>
> **`Answer` is the column that carries what would otherwise be lost.** A ticket states a decision as a
> premise; it does not record the question it settled, so an answer that did not survive into the ticket
> survives nowhere. Three cases are worth writing down explicitly, because none of them does: the work
> **widened beyond the entry's scope** at scoping; the answer **reversed a decision made earlier**; or
> **it was never an open decision at all** — the spec already required it — which is a finding about the
> parking lot rather than about the work.
>
> **The row records the answer, not the reasoning.** Reasoning belongs to the ticket that inherited it,
> and a second copy here is exactly the residue the *Lifecycle* rule exists to prevent. Keep it to one
> line: the wider columns invite a paragraph, and a paragraph belongs in the ticket named under *Became*.
> This table grows once per *resolved* entry — a handful per version — so it can afford a sentence where
> the active list above cannot afford a paragraph.
