# Ticket workflow

The build runs ticket by ticket. The system is defined in `spec/tickets/CONVENTIONS.md`; the per-ticket
format in `spec/tickets/TICKET-TEMPLATE.md`; the execution order in `spec/tickets/BOARD.md`.

- **Work tickets, not epics.** Epics (`<PRJ>-E0n`) are a capability view only — no code ships against
  them; they close when their children are `done`. The unit of work is the leaf ticket (`<PRJ>-NNN`).
- **Go in order.** Pick the lowest-numbered `todo` ticket whose every `depends_on` id is `done` **and
  which no unfinished ticket names in its `before:` list**. `BOARD.md` **top-to-bottom** is the legal
  sequence — **id order is not**. **Never start a ticket whose dependencies aren't done.**
- **`before:` is the one edge that points backwards.** `depends_on` only ever names lower ids
  (CONVENTIONS.md §4.3), so when a *later*-numbered ticket must be worked *first* — a promoted cleanup
  ticket, §6.5 — the constraint goes in `before:` instead (§4.6) and the row moves up, flagged
  `🔺 before <id>`. Rare by design. Never re-sort `BOARD.md` by id: it silently reverses these.
- **One ticket per commit.** A commit moves exactly one ticket: its code, its tests, its
  `status`/`## Notes`, and its `BOARD.md` row — together. This keeps the history honest and reviewable.
  The later `in-review → done` finalize is a separate small status-only commit for that same ticket.
  **Stage deliberately** — commit only the ticket's own files; never `git add -A` blindly (it sweeps in
  stray sanity-test artifacts). Run throwaway sanity checks outside the repo (e.g. `/tmp`) or clean them
  up, and check `git status` before you commit.
- **Status lifecycle:** `todo → in-progress → in-review → done` (`blocked` when stuck). Set
  `in-progress` when you start; set **`in-review`** when implementation is finished and the definition
  of done holds (this is where `sfk-next-ticket` leaves a ticket); `done` only after the user's review.
- **In a ticket file the status is the bare token; in `BOARD.md` it is `<icon> <token>`** — ⬜ `todo` ·
  🔶 `in-progress` · ⛔ `blocked` · 👀 `in-review` · ✅ `done`. The board is scanned by eye across
  hundreds of rows, so it gets the icon; a ticket's `status:` frontmatter is machine-read and does not.
  **Always write both on the board, never the icon alone** — status is `grep`-ed, and a sweep that
  matches nothing looks exactly like a sweep that found nothing wrong (CONVENTIONS.md §5.4).
- **Finalize before starting the next.** `sfk-next-ticket` first flips any `in-review` ticket to `done`
  (its own commit) — the user invoking it is their approval — then implements the next. To close a reviewed
  ticket **without** starting the next (e.g. before `sfk-verify`, at a milestone's end, or to pause), use
  `sfk-close-ticket`. In `pr` mode both of those **squash-merge** the ticket's PR as part of finalizing;
  the forge's Approve button is not used. **`sfk-signoff` never finalizes a ticket** — it stops if one is
  still open and tells you to run `sfk-close-ticket`.
- **Commit message:** `<PRJ>-NNN: <short imperative>` for work; `<PRJ>-NNN: mark done (reviewed)` for a
  finalize.
- **A ticket filed outside a sign-off gate is drafted by the `tests` model**, where the root `CLAUDE.md`
  › *Models* names one distinct from `implementation`. That covers `sfk-verify`'s cleanup tickets and any
  ad-hoc *"file this as a ticket"* — spawn a subagent pinned to that model and let it write the ticket
  from the finding and the spec alone, with no sketch of the fix. Acceptance criteria are what the
  implementer's work gets checked against, so the same grader ≠ graded rule that governs tests governs
  writing one; tickets from the **generation milestone** are exempt because you sign those off. Degrade
  to drafting it here when no distinct `tests` model is configured.
- **`## Notes` quotes the red you saw — the test's name and its failure message, verbatim.**
  `` `rounds a computed 57.5 up`: `AssertionError: expected 57 to be 58` ``. *"All tests passed first
  time"* does not discharge it: that is equally true of a test written from the spec beforehand and one
  written afterwards to fit working code. **This is the one definition-of-done item that cannot be audited
  later** — a gate re-runs and an amendment can be re-read, but *when* the failing test was written leaves
  no artefact unless the work commit captures one. Copy the message the moment you see red. If there is
  honestly no red, name the permitted substitute (root `CLAUDE.md` › *Definition of done*) — **never
  manufacture a failure to satisfy the form**.
- **Authorship trailers record who built it.** A ticket's **work** commit ends with a `Co-authored-by`
  trailer for **every model that built it** — both, where independent test authorship is configured and
  `tests_required: true` (the test author *and* the implementer); one otherwise. A **finalize** is
  status-only and carries one. This is the machine-readable half of the red-green record and `## Notes` is
  the other; **they fail independently**, so faultless notes sit happily beside a commit with no trailer,
  and a reviewer reading the notes finds nothing missing. Never rely on the runtime default — it supplies a
  trailer only for the model currently driving, which can never produce the pair.
- **Link every id you write into `BOARD.md`** — `[<PRJ>-036](<PRJ>-036-<slug>.md)`, in the `id` column,
  `depends_on` cells and prose alike. Decoration goes *inside* the link: `` [`<PRJ>-036`](…) ``, never
  `` `[<PRJ>-036](…)` `` — the latter renders as literal brackets because link syntax inside a code span is
  not a link (CONVENTIONS.md §5.4).
- **Close epics when their last child is finalized.** When the `in-review → done` finalize completes an
  epic's last open child, mark the epic `done` in both its ticket file and the `BOARD.md` epic table in
  that same finalize commit.
- **Correcting a false record means re-opening the work done from it.** When you fix a document, a
  `## Background` or a set of acceptance criteria that others implemented from, **name the tickets worked
  against the false version and say, per ticket, whether their work stands** (CONVENTIONS.md §5.5). A
  correction is not neutral: afterwards a reader sees a `done` ticket beside a true document and **nothing
  marks it as suspect**, so stopping at the record hides the gap instead of closing it. If that leaves work
  to redo, file a **record-correction ticket** (§6.7) — the one cleanup kind with a deadline, worked
  **before the next batch starts**, because while it waits, more tickets close against the record it exists
  to fix.
- **Run `sfk-verify` after each batch.** The `sfk-verify` skill (`.claude/skills/sfk-verify/SKILL.md`) audits the batch
  against the spec and reviews it for reuse, quality and efficiency, proposing cleanup tickets.
  Accepted tickets go to the cleanup backlog in `BOARD.md` (CONVENTIONS.md §6); critical ones are
  promoted into the main sequence before the gate they affect — which means `before:`, a row move, and a
  `🔺` flag, all three (CONVENTIONS.md §6.5).
