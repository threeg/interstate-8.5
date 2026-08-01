---
name: sfk-close-ticket
description: Finalize the current in-review ticket — mark it done and commit that alone — without starting the next ticket. Use to close out a reviewed ticket when you want to stop, or to run sfk-verify at a batch boundary, rather than letting sfk-next-ticket advance the queue. Trigger on "close ticket", "close this ticket", "finalize the ticket", "mark the ticket done", "close and commit", or "close it, don't start the next".
---

# sfk-close-ticket — finalize the reviewed ticket, and stop

Use when a ticket is `in-review` and you want to **approve and close it without advancing the queue** —
e.g. at a batch boundary before running `sfk-verify`, or to stop for now. It does exactly the finalize
that `sfk-next-ticket` performs first, but on its own: it **never** starts, edits, or stages the next
ticket.

Running this skill **is** your approval of the in-review ticket — the same signal as asking for the
next ticket, minus the "next".

## Procedure

1. **Find the in-review ticket.** In `spec/tickets/BOARD.md`, find the ticket at `in-review`. If none
   is `in-review`, say so and stop — there is nothing to finalize. (Normally exactly one; finalize each
   if somehow more.)

2. **Outstanding feedback?** If you have unaddressed feedback on it, do **not** close it — revise it
   (re-commit under its id, leave it `in-review`) first. Closing is approval.

3. **[PR mode] Merge the ticket's PR first.** In `pr` review mode (root `CLAUDE.md` › *Review mode*),
   **squash-merge** the ticket's pull/merge request — squash so the main line keeps one commit per ticket
   even after several `sfk-address-review` rounds. Your invocation was the approval; the merge is plumbing,
   not the signal, and the forge's Approve button is not used (a user cannot approve their own PR anyway).
   If the merge is **blocked** — a failing required check, a conflict, or branch protection demanding an
   approving review — **stop and say which**; do not force it and do not mark anything `done`. If it is
   already merged by hand, carry on. Skip this step entirely in `in-place` mode.

4. **Finalize, in its own commit.** Flip the ticket to `done`, update its `BOARD.md` row to `✅ done`
   (the board carries icon **and** token; the ticket file carries the bare token — CONVENTIONS.md §5.4),
   and — if it was the last open child of an epic — close that epic. Commit **only** this status change as
   `<PRJ>-NNN: mark done (reviewed)`. Bundle nothing else into it. This commit is status-only, so it
   carries **one** `Co-authored-by` trailer — the model performing it. The two-model pair belongs on the
   ticket's *work* commit (`sfk-next-ticket`), never here.

5. **Stop and hand off.** Report that the ticket is closed (and, in `pr` mode, that its PR is merged), and
   let the user choose what's next: `sfk-verify` at a batch boundary, `sfk-next-ticket` to implement the
   next ticket, or `sfk-signoff` if this was the milestone's last ticket.

   > **This skill is how a milestone's last ticket gets closed.** `sfk-signoff` does **not** finalize
   > tickets — it refuses to run while one is open — so the end of a building milestone is always
   > `sfk-close-ticket` then `sfk-signoff`.

## Rules

- **Finalize only.** This skill closes exactly one reviewed ticket and commits that alone. It never
  starts, edits, or stages the next ticket.
- **Never edit `.sfk/`** — it is the kit's read-only source.
- Only close a ticket the user has reviewed; if there is outstanding feedback, revise first.
- If no ticket is `in-review`, do nothing.
