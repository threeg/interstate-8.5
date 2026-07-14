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

3. **Finalize, in its own commit.** Flip the ticket to `done`, update its `BOARD.md` row, and — if it
   was the last open child of an epic — close that epic. Commit **only** this status change as
   `<PRJ>-NNN: mark done (reviewed)`. Bundle nothing else into it.

4. **Stop and hand off.** Report that the ticket is closed, and let the user choose what's next:
   `sfk-verify` at a batch boundary, `sfk-next-ticket` to implement the next ticket, or `sfk-signoff`
   if this was the milestone's last ticket.

## Rules

- **Finalize only.** This skill closes exactly one reviewed ticket and commits that alone. It never
  starts, edits, or stages the next ticket.
- **Never edit `.sfk/`** — it is the kit's read-only source.
- Only close a ticket the user has reviewed; if there is outstanding feedback, revise first.
- If no ticket is `in-review`, do nothing.
