---
name: sfk-next-ticket
description: Advance the build queue by one ticket, during the scaffolding and implementation milestones. First finalizes the previously reviewed ticket if one is left in-review (marks it done and commits that), then implements the next ready todo ticket test-first where applicable and leaves it in-review for the user to review. Keeps the ticket, board, and tests honest in the work commit. Trigger on "next ticket", "work the next ticket", "implement the next ticket", or "keep building".
---

# sfk-next-ticket — implement one ticket

Use during the **building milestones — scaffolding and implementation** (both are worked ticket by
ticket, one at a time). One invocation **finalizes the previously reviewed ticket** (if one is left
`in-review`) and then **implements the next one**, leaving it `in-review`. Follow the ticket-workflow
rules in `spec/tickets/CLAUDE.md` and the definition of done in the root `CLAUDE.md`.

## Procedure

1. **STOP — finalize the previously reviewed ticket before you do anything else.** Check
   `spec/tickets/BOARD.md` for a ticket already `in-review`. If one exists, you **must** close it out in
   **its own commit** before you touch the next ticket — do **not** start, edit, or stage the next
   ticket, and **never** bundle the closure into the next ticket's work or a later fix commit. The user
   asking for the next ticket **is** their approval: flip it to `done`, update its `BOARD.md` row, close
   its epic if it was the last open child, and commit **only** that change as
   `<PRJ>-NNN: mark done (reviewed)`. Confirm that commit exists, then continue. (Normally exactly one;
   finalize each if somehow more.)
   - **Exception — outstanding feedback.** If the user has given feedback on the in-review ticket rather
     than approving it, do **not** finalize: revise the ticket, re-commit under its id, leave it
     `in-review`, and stop. Feedback is handled before the queue advances.

2. **Pick the next ticket.** From `spec/tickets/BOARD.md`, take the lowest-numbered `todo` ticket whose
   every `depends_on` id is `done`. Never start a ticket whose dependencies are not done. If none are
   ready, say so and stop (after any finalize in step 1).

3. **Load context.** Read the ticket file, the `## Notes` of its `depends_on` tickets, and the spec
   sections it references (`spec/requirements/requirements.md` for its `implements` ids,
   `spec/architecture/architecture.md`, `spec/architecture/api-contract.md`, the relevant
   wireframe). The ticket plus that spec should be enough — no conversational context required.

4. **Set `in-progress`** in the ticket and its `BOARD.md` row.

5. **Implement — test-first, and that is binding.** Honour the architecture dependency rule. For
   deterministic and contract-pinned work: **write the failing test FIRST**, run it, **confirm it fails
   for the right reason**, and only **then** write the implementation. Do not write implementation
   first and back-fill tests — that is a process violation, not a shortcut, and it loses coverage you
   will not notice missing. Red-green is the default for **all** implementation work; it is overridden
   only where `spec/test-strategy/test-strategy.md` **explicitly names** that layer as exempt (§1).
   Characterisation tests for probabilistic/external layers. New or changed numbered-requirement
   behaviour ships with its tests **in the same commit**.

6. **Run the gates.** The default gate must pass with zero warnings; run the heavier gate the ticket
   names (model / perf / e2e) where it applies; hold the core coverage gate for core-touching work.

7. **Close for review, in one commit.** Set the ticket **`in-review`** (not `done` — that waits for the
   user's review), append a dated `## Notes` line with the **completion report** (plain-language summary
   + one-line sanity test; for UI tickets, fill `## QA steps`), and update the `BOARD.md` row — all in
   the same commit as the code and tests. Commit message: `<PRJ>-NNN: <short imperative>`. Do **not**
   set `done` and do **not** close the parent epic here — that happens when the ticket is finalized
   (step 1 of the next run, or `sfk-signoff` for the last ticket).

   Then **print the completion report to the chat**, in this order: the ticket **id + title**, its
   **`## In plain English`** line (both echoed from the ticket), then the summary, the sanity test, and
   — for UI tickets — the QA steps. The id, title, and plain-English are chat-only; they already live in
   the ticket, so they are not written into `## Notes`. Tell the user it is ready for review, and that
   asking for the next ticket will finalize it (or giving feedback will revise it).

8. **At batch boundaries, run `sfk-verify`.** After a batch of related tickets, invoke `sfk-verify` to
   review for reuse/quality/efficiency and propose cleanup tickets; promote any critical finding before
   the gate it would affect.

When the last `todo` ticket has been implemented, one ticket will remain `in-review`. `sfk-signoff`
finalizes it (→ `done`) as it completes the implementation milestone; there is no need to trigger
`sfk-next-ticket` again just to finalize it.

## Rules

- **Never edit `.sfk/`** — it is the kit's read-only source (templates, changelog, manifest).
- **Finalize before starting.** Every run first flips any `in-review` ticket to `done` (its own commit)
  unless the user has outstanding feedback on it.
- One ticket's *work* is one commit; its later `in-review → done` finalize is a separate small
  status-only commit for that same ticket. Never combine unrelated changes.
- A freshly implemented ticket rests at `in-review`; it becomes `done` only once reviewed (the next run
  or `sfk-signoff`).
- If implementing reveals the spec is wrong, change the relevant `spec/` file first and reference it
  — do not silently reinterpret a settled decision.
- **External/environmental errors are not licence to edit the spec.** If an external dependency errors
  (API 404, auth failure, missing key), reproduce and diagnose it (`curl`, config, keys) — **never**
  change a contractual value (model name, endpoint, threshold) to dodge it. If unresolved, STOP and ask
  the user.
