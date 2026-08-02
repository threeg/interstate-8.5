# Ticket workflow

The build runs ticket by ticket. The system is defined in `spec/tickets/CONVENTIONS.md`; the per-ticket
format in `spec/tickets/TICKET-TEMPLATE.md`; the execution order in `spec/tickets/BOARD.md`.

- **Work tickets, not epics.** Epics (`INT8-E0n`) are a capability view only — no code ships against
  them; they close when their children are `done`. The unit of work is the leaf ticket (`INT8-NNN`).
- **Go in order.** Pick the lowest-numbered `todo` ticket whose every `depends_on` id is `done` **and
  which no unfinished ticket names in its `before:` list**. `BOARD.md` **top-to-bottom** is the legal
  sequence — **id order is not**. **Never start a ticket whose dependencies aren't done.**
- **`before:` is the one edge that points backwards.** `depends_on` only ever names lower ids
  (CONVENTIONS.md §4.3), so when a *later*-numbered ticket must be worked *first* — a promoted cleanup
  ticket, §6.5 — the constraint goes in `before:` instead (§4.6) and the row moves up, flagged
  `🔺 before <id>`. Rare by design (slice 1 has two: INT8-022 and INT8-028). Never re-sort `BOARD.md` by
  id: it silently reverses these.
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
  (its own commit) — **the user invoking it is their approval**, in both review modes — then implements
  the next. To close a reviewed ticket **without** starting the next (e.g. before `sfk-verify`, at a
  milestone's end, or to pause), use `sfk-close-ticket`. **`sfk-signoff` never finalizes a ticket** — it
  stops if one is still open and tells you to run `sfk-close-ticket`. (This project is `in-place`; under
  `pr` both of those would also squash-merge the ticket's PR, and the forge's Approve button is still
  not used.)
- **Commit message:** `INT8-NNN: <short imperative>` for work; `INT8-NNN: mark done (reviewed)` for a
  finalize.
- **A ticket filed outside a sign-off gate is drafted by the `tests` model** (`claude-opus-4-8`, per the
  root `CLAUDE.md` › *Models*). That covers `sfk-verify`'s cleanup tickets and any ad-hoc *"file this as a
  ticket"* — spawn a subagent pinned to that model and let it write the ticket from the finding and the
  spec alone, with no sketch of the fix. Acceptance criteria are what the implementer's work gets checked
  against, so the same grader ≠ graded rule that governs tests governs writing one; tickets from the
  **generation milestone** are exempt because you sign those off.
- **Authorship trailers record who built it.** A ticket's **work** commit ends with a `Co-authored-by`
  trailer for **every model that built it** — both, where independent test authorship is configured and
  `tests_required: true` (the test author *and* the implementer); one otherwise. A **finalize** is
  status-only and carries one. This is the machine-readable half of the red-green record and `## Notes` is
  the other; **they fail independently**, so faultless notes sit happily beside a commit with no trailer,
  and a reviewer reading the notes finds nothing missing. Never rely on the runtime default — it supplies a
  trailer only for the model currently driving, which can never produce the pair.
- **Link every id you write into `BOARD.md`** — `[INT8-036](INT8-036-<slug>.md)`, in the `id` column,
  `depends_on` cells and prose alike. Decoration goes *inside* the link: `` [`INT8-036`](…) ``, never
  `` `[INT8-036](…)` `` — the latter renders as literal brackets because link syntax inside a code span is
  not a link (CONVENTIONS.md §5.4).
- **Close epics when their last child is finalized.** When the `in-review → done` finalize completes an
  epic's last open child, mark the epic `done` in both its ticket file and the `BOARD.md` epic table in
  that same finalize commit.
- **Run `sfk-verify` after each batch.** The `sfk-verify` skill (`.claude/skills/sfk-verify/SKILL.md`) audits the batch
  against the spec and reviews it for reuse, quality and efficiency, proposing cleanup tickets.
  Accepted tickets go to the cleanup backlog in `BOARD.md` (CONVENTIONS.md §6); critical ones are
  promoted into the main sequence before the gate they affect — which means `before:`, a row move, and a
  `🔺` flag, all three (CONVENTIONS.md §6.5).
