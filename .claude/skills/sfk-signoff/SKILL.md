---
name: sfk-signoff
description: Sign off the current in-progress milestone — the human gate. Marks it Complete, moves the Current position to the next milestone, and commits that status change; on a version's final milestone it also tags the release and offers to push it. Only run when the user explicitly approves the milestone's deliverable. Trigger on "sign off", "sign off the milestone", "approve this milestone", "mark it complete", or "this milestone is done".
---

# sfk-signoff — complete a milestone (the human gate)

Run this **only when the user explicitly approves** the current milestone's deliverable. It is the one
place a milestone becomes `Complete`. `sfk-next-milestone` produced and committed the draft; this skill
records the user's sign-off and advances the project.

## Procedure

1. **Confirm approval.** Verify the user is signing off the milestone that is currently `In progress`
   (🔶) in `spec/milestone-plan.md`. If they have outstanding feedback, do **not** sign off — hand
   back to `sfk-next-milestone` to revise first.

2. **Check the deliverable is committed.** The milestone's draft and any revisions should already be
   committed (by `sfk-next-milestone`). If there are uncommitted changes, commit them **per the Commit
   protocol** (root `CLAUDE.md`) — hand off in authoring/Cowork; agent commits in building/Code.

3. **Mark it `Complete` (✅)** in `spec/milestone-plan.md` and **move the *Current position*** line
   to the next milestone (or, if this was the version's last milestone, note the version is ready to
   ship/tag and that `sfk-version` starts the next one).

4. **Commit the status change — per the Commit protocol.** For an **authoring**-milestone sign-off
   (Cowork), present the exact `git` commands and have the user run them; for a **building**-milestone
   sign-off (Code), the agent commits. Message e.g. `process: <milestone> — signed off (complete)`.
   This commit carries the status flip and the *Current position* move; the deliverable itself was
   already committed.

5. **For a building milestone (scaffolding or implementation)**, first **finalize any ticket left
   `in-review`**: signing off the milestone is your approval of that last reviewed ticket. For each,
   flip it to `done`, update its `BOARD.md` row, close any epic whose last open child it completes, and
   commit as `<PRJ>-NNN: mark done (reviewed)` (its own commit, before the milestone status change).
   Sign-off then means the milestone's tickets are all `done` and the gates pass.

6. **If this was the version's LAST milestone, tag the release.** Signing off the final milestone *is*
   the release moment — the version number is already in `spec/milestone-plan.md` (the milestone table
   is grouped under it), so act on it rather than just mentioning it. Do this only for the final
   milestone; intermediate sign-offs are not releases.
   - **Check before tagging, and ask rather than guess** if any of these is off: the version number is
     missing or ambiguous in the plan; a tag of that name already exists; the working tree is not
     clean; the `v`-prefix convention is unclear (e.g. `v0.1.0` vs `0.1.0` — follow whatever existing
     tags use).
   - **Create an annotated tag** on the sign-off commit, per the **Commit protocol** (root
     `CLAUDE.md`): the final milestone is a *building* milestone, so in Code you may run
     `git tag -a <VERSION> -m "<PROJECT> <VERSION>"` directly; in a hand-off runtime, present the exact
     command instead.
   - **Offer the push — never push unconditionally.** Present the exact commands
     (`git push origin <branch>` / `git push origin <VERSION>`) and let the user confirm. Pushing is
     outward; it is their call.

7. **Hand off.** Tell the user what is next: `sfk-next-milestone` for the following milestone, or
   `sfk-version` if the version is complete (and the release tag is in place).

## Rules

- **Never edit `.sfk/`** — it is the kit's read-only source (templates, changelog, manifest).
- Run only on explicit user approval. The agent never self-signs-off a milestone.
- Sign-off is a status event: it flips the milestone and moves the *Current position*. The one
  exception is a version's **final** milestone, where it also tags the release and **offers** the push
  (step 6) — it never pushes unconditionally.
- If the milestone isn't actually done — tickets still `todo`/`in-progress`/`blocked`, open feedback,
  or failing gates — refuse and return to `sfk-next-milestone` or `sfk-next-ticket`. A ticket at
  `in-review` is *not* a blocker: sign-off finalizes it (step 5).
