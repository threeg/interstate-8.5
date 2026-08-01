---
name: sfk-todo
description: Capture a one-line parking-lot item into spec/TODO.md — work you know is coming but cannot ticket yet because the decision it depends on does not exist. Appends a dated, attributed entry that always names the decision owed, and commits spec/TODO.md on its own. No interview. Trigger on "sfk todo", "park this", "add a todo", "note this for later", "we can't ticket this yet", or "add to the parking lot".
---

# sfk-todo — capture a parking-lot item (no ceremony)

Use mid-flow to jot down work you **know** is coming but genuinely **cannot ticket yet** — because the
design or product **decision it depends on does not exist**. It writes one entry into `spec/TODO.md`
(the parking lot) and returns. It is deliberately **not** an interview: the value is that it costs
almost nothing while you are in the middle of a ticket. Anything worth a real interview is worth a real
ticket instead — put that on `spec/tickets/BOARD.md`, not here.

> **Is this actually a parking-lot item?** Only if it has an **open question that blocks it from being a
> ticket**. If it *can* be specified now, it is a ticket (or a `sfk-verify` cleanup finding), not a TODO.
> No decision owed ⇒ do not park it here.
>
> **Is it a parking-lot item at all, or an open question?** If what's missing is **work awaiting a decision
> of ours**, it is a TODO. If what's missing is **a value or a piece of information** — something to be
> told rather than decided — it belongs in `spec/open-questions.md` instead, which is recorded
> automatically and never blocks anything.

> **You may reach this skill two ways.** The user asks ("park this") — or **you offer**. Whenever work is
> deliberately stopped because a decision doesn't exist, say so and ask *"shall I park this?"*, rather than
> waiting to be asked; unparked work of that kind dies in a closed ticket's notes. Parking changes scope,
> so the offer needs the user's yes — unlike `spec/open-questions.md`, which is recorded without asking
> (root `CLAUDE.md`, *Non-negotiables*).

## Procedure

1. **Ensure the parking lot exists.** If `spec/TODO.md` is missing, copy it out of
   `.sfk/templates/spec/TODO.md` first (never edit inside `.sfk/`).

2. **Get the decision owed — the one question you must ask.** You take the item as a single line, but
   you **always** capture the *decision still owed* (the open question that stops this being a ticket).
   If the user's one line already makes it obvious, restate it back in one line and move on; if not, ask
   **once** for it. Do not interview beyond this — no scope, no estimates, no design. If it turns out
   there is no decision owed, say so and steer the user to a real ticket instead of parking it.

3. **Append the entry** to the *Entries* list in `spec/TODO.md`, newest first, using the template block
   in that file. Fill:
   - a stable `id` (`TODO-NNN`) — **next after the highest id anywhere in the file, counting the
     *Resolved* tombstones as well as the active entries.** Never reuse a number. Read both sections
     before choosing: a resolved entry's body is gone but its tombstone remains precisely so this
     arithmetic is right, and taking the highest *active* id instead reuses the number of something
     already ticketed. Do **not** reach for `git log` to reconstruct it — the file is self-sufficient by
     design, and this skill runs in runtimes where you may run no `git` at all;
   - the one-line **title**; **Raised:** today's date (ISO) by the author (the git/user name, or ask);
   - **Decision owed** (from step 2, required); **Reuse** and **Where it surfaced** if known;
   - a one/two-sentence **Context**.

4. **Commit `spec/TODO.md` on its own — per the Commit protocol** (root `CLAUDE.md`).
   - **Building runtime (Code):** stage **only** `spec/TODO.md` and commit it directly —
     `git add spec/TODO.md && git commit -m "todo: <id> <slug>"`. **Never** `git add -A`, and **never**
     fold this into a ticket's commit — it is its own small doc commit, so one-ticket-one-commit is
     untouched, and it never sweeps in the in-flight ticket's work.
   - **Hand-off runtime (Cowork):** do **not** run `git`. Present the exact
     `git add spec/TODO.md && git commit` command and have the user run it (append-only, so it is safe
     to run alongside their in-flight work).
   - Do **not** push — the entry syncs on the project's normal push / PR cadence.

5. **Return immediately.** Confirm the entry's `id` and one-line title, and that `spec/TODO.md` is
   committed (or that you handed off the command). Do not resume or narrate the ticket you interrupted —
   the point is to get out of the way.

## Rules

- **Decision owed is mandatory.** Every entry names the open question that blocks it from being a
  ticket. An entry without one is a ticket in disguise — refuse to park it and point at `BOARD.md`.
- **One entry, its own commit.** `sfk-todo` only ever touches `spec/TODO.md`. It never edits tickets,
  code, the spec, or milestone status, and never bundles into a ticket commit.
- **No interview, no promotion.** This skill captures only. Selecting parking-lot items into a version
  is `sfk-version`'s job (it harvests `spec/TODO.md` at version planning, and `sfk-signoff` sweeps it at
  each milestone boundary); converting a selected item into a ticket — and replacing its entry with a
  one-line tombstone in that same commit — happens at ticket generation, never at sign-off.
- **Never renumber, and never take the highest *active* id.** Ids are permanent because a `TODO-n` is
  **cited while it is open** — in a ticket's Background, in a board note, in a commit message — and those
  citations outlive the entry. Reusing a number silently redirects one. The *Resolved* tombstones are what
  make both things work: they keep those citations resolvable, and they let the next id be computed
  correctly from the file alone.
- **Never edit `.sfk/`** — copy `spec/TODO.md` out of `.sfk/templates/` if it does not exist yet.
- **Not a backlog.** Anything specifiable belongs on `spec/tickets/BOARD.md`, not here.
