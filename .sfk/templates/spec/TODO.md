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
- **It is harvested at version planning.** `sfk-version` scans this file at the start of each version
  and asks which entries the new version will commit to resolving — that is the scheduled read that
  keeps the list alive, and the moment an owed decision gets pulled into scope.
- **Entries leave with zero residue.** An entry is **deleted in the same commit that files its real
  ticket** (its *reuse* and *where it surfaced* notes carry into the ticket's Background). Nothing is
  left behind once the work is ticketed.
- **Capture is cheap but disciplined.** `/sfk-todo <one line>` appends an entry without ceremony, but
  always records the decision owed — so the fast path can't erode the rule above.

## Lifecycle of an entry

```
captured here (decision owed, unspecifiable)
   → selected at sfk-version (its owed decision is pulled into the version's scope)
   → the spec milestones make that decision (brief / requirements / architecture / design / …)
   → ticket generation files a real ticket AND deletes this entry, in one commit
```

An entry never becomes a ticket directly — its blocking decision must be made first, and that happens
in the spec milestones that run **before** ticket generation. That is why the parking lot is read at
`sfk-version` (to pull the decision into scope), not first noticed at ticket generation (too late).

---

## Entries

> One block per item. Keep each self-contained (a stable `id` keeps concurrent appends merge-friendly).
> Delete a block in the commit that files its ticket. Newest first.

<!-- Template for an entry — copy, fill, place at the top of the list:

### TODO-NNN — <one-line title>

- **Raised:** <ISO date> by <author>
- **Decision owed:** <the open question that must be answered before this can be a ticket — REQUIRED>
- **Reuse:** <what already exists that should survive the decision — components, tests, endpoints>
- **Where it surfaced:** <the ticket / screen / milestone this came out of, if any>
- **Context:** <one or two sentences: what the work is and why it can't be ticketed yet>

-->

_(No parking-lot items yet.)_
