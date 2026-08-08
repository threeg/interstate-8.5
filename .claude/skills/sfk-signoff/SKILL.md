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

   > **Say what reviewing this deliverable means, because the two cases differ.** For a document this
   > milestone **created**, the useful act is a **full read end to end** — there is no prior version to
   > compare against, so nothing else will catch a rule that contradicts another sixty lines away. For a
   > document it **amended**, it is the **diff**: what changed, and whether each change is what was
   > intended. Say which case applies before asking for approval.
   >
   > **And report the fresh-eyes pass.** `sfk-next-milestone` step 6 requires that a *newly created*
   > binding document is read by someone who did not author it. State whether that happened, what it
   > found, or that it was skipped — the user is about to spend their one gate on this document, and
   > "nobody independent has read it" is the single most decision-relevant thing you can tell them.
   > **Never block on it**: report and let them choose. You are not a second gate.

2. **Account for the deliverable.**
   - For a **building** milestone the work was already committed per ticket by `sfk-next-ticket`; if any
     stray changes remain, commit them per the Commit protocol (agent commits in Code).
   - For an **authoring** milestone (Cowork / hand-off) the deliverable was intentionally **left
     uncommitted** through the feedback loop (see `sfk-next-milestone` step 4). Do **not** commit it as a
     separate step here — it lands together with the status flip as the **single** sign-off commit in
     step 5. (If the user took a mid-way checkpoint commit on request, that's fine; the final commit still
     carries whatever remains plus the status change.)
   - **In Cowork, do not run `git` to check any of this — not even read-only `git status` / `log` /
     `diff`.** It can leave an uncleanable `.git/index.lock` that breaks the user's own commits (Commit
     protocol, root `CLAUDE.md`). You already know the state from `spec/milestone-plan.md` and the user;
     that is the only source. Present commands; never probe `.git`.

3. **Sweep the two registers — report, ask once, never block.** Both `spec/TODO.md` and
   `spec/open-questions.md` have scheduled reads **coarser than a milestone** (the parking lot is harvested
   at `sfk-version`; the register is only *sharpened* at batch boundaries), so an item whose blocker cleared
   mid-version can quietly age out an entire version. This boundary is the cheapest place to catch that: the
   user is already reviewing, already holding the milestone in mind, already answering a yes/no. Two file
   reads — no `git`, so it is safe in every runtime.

   - **`spec/TODO.md`** — surface entries whose **Where it surfaced** names this milestone, or whose
     **Decision owed** names a milestone now passed. **Sweep the *Entries* list only — the *Resolved*
     table at the foot of the file is out of scope.** Those rows are tombstones for entries that already
     became tickets, and a row reads exactly like a parked item whose decision has just been made.
     Ask once: *is that decision now made?* If it is, **do
     not file a ticket here.** An entry leaves the parking lot at **ticket generation**, behind that step's
     hard gate, and its decision must land in a spec document first. The useful output is a note recording
     which upcoming milestone now owes the decision, or an explicit "carry it to `sfk-version`". Never write
     `BOARD.md` from this skill.
   - **`spec/open-questions.md`** — surface rows whose **Needed by** names this milestone or the next. Ask
     **two** things, because they fail differently: *has the answer arrived?* and, if not, *has the ask
     actually been sent?* The second catches the common case — a question sharpened into something precisely
     answerable that nobody ever sent. If an answer **has** arrived, **offer** to close it as its own commit
     (that file's *When an answer arrives* amends the owning document first); do not do it inline and do not
     fold it into the sign-off commit.

   **Matching is deliberately loose** — a textual match on the milestone number and its deliverable
   description is enough. A false positive costs the user one glance; a false negative costs a version.
   **This step can never block a sign-off:** "not now" is a complete answer, and you proceed unchanged. The
   value is entirely in the prompt existing. Skip silently if a file is absent or empty.

4. **Mark it `Complete` (✅)** in `spec/milestone-plan.md` and **move the *Current position*** line
   to the next milestone (or, if this was the version's last milestone, note the version is ready to
   ship/tag and that `sfk-version` starts the next one).

   **Then refresh `spec/contents.md`** for the folders this milestone touched, so the specification index
   is current at the moment the milestone closes. Walk those folders for `*.md`, and:
   - add a row per file that isn't listed, with a one-line description — the section's **binding master
     first**, supporting files under it;
   - **preserve every description already there verbatim** — they are hand-written, so add and remove rows
     rather than rewriting the file;
   - drop rows whose file no longer exists, and delete a whole section for a milestone the version dropped;
   - **never enumerate `tickets/<PRJ>-*.md`** — `BOARD.md` is their index and listing them buries
     everything else;
   - link the **file**, never a numbered-section anchor (slugs embed section numbers and break silently).

   This is why the index does not rot: one refresh per milestone, at the point its files are final, rather
   than relying on anyone updating it per file. It rides along in step 5's commit. Skip silently if
   `spec/contents.md` does not exist (a project on an older kit version).

5. **Commit — per the Commit protocol.** For an **authoring**-milestone sign-off (Cowork), present the
   exact `git` commands and have the user run them; this is the **single** commit for the milestone,
   carrying the finished deliverable *and* the status flip + *Current position* move together (e.g.
   `process: <milestone> — signed off (complete)`). For a **building**-milestone sign-off (Code) the
   agent commits, and this commit carries only the status change (the deliverable was already committed
   per ticket).

   Either way the commit carries **one** `Co-authored-by` trailer — the model performing the sign-off.
   **Include it in the commands you present** when handing off, or the user's commit goes out bare and the
   authorship record has a hole exactly where the milestone closed.

6. **For a building milestone (scaffolding, tooling deltas, or implementation): require a clean queue —
   do not finalize tickets yourself.** Read `spec/tickets/BOARD.md` — a plain file read, which is all you
   need and, in Cowork, all you may be permitted. If **any** ticket is `in-review`, **stop** and tell the
   user to run **`sfk-close-ticket`** first, naming the ticket. Do not flip it to `done`, do not merge
   anything, and do not sign off around it. Sign-off means the milestone's tickets are **all already
   `done`** and the gates pass.

   In **`pr` mode you do not need to inspect the PR** — `sfk-close-ticket` merges *before* it marks a
   ticket `done`, so `done` on the board already implies a merged PR. Do **not** run `git` or a forge CLI
   to check: the board is the source of truth, exactly as `spec/milestone-plan.md` is for milestone state.

   > **Why this skill doesn't close tickets.** Two reasons. **Responsibility:** a ticket's lifecycle belongs
   > to the ticket skills (`sfk-next-ticket`, `sfk-close-ticket`) — invoking one of those *is* the user's
   > approval of the ticket, and sign-off is approval of a **milestone**, which is a different decision
   > about a different thing. **Runtime:** this skill frequently runs in **Cowork, where it may run no
   > `git` at all** — not even read-only — so it cannot be relied on to merge a PR or verify one was
   > merged. A step that only works in some runtimes is worse than a step that refuses honestly. The cost
   > is one extra command at each building milestone's end; the gain is a boundary that holds everywhere.

7. **If this was the version's LAST milestone, tag the release.** Signing off the final milestone *is*
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

8. **Hand off.** Tell the user what is next: `sfk-next-milestone` for the following milestone, or
   `sfk-version` if the version is complete (and the release tag is in place).

## Rules

- **Never edit `.sfk/`** — it is the kit's read-only source (templates, changelog, manifest).
- Run only on explicit user approval. The agent never self-signs-off a milestone.
- Sign-off is a status event: it flips the milestone and moves the *Current position*. The one
  exception is a version's **final** milestone, where it also tags the release and **offers** the push
  (step 7) — it never pushes unconditionally.
- If the milestone isn't actually done — tickets still `todo`/`in-progress`/`blocked`, open feedback,
  or failing gates — refuse and return to `sfk-next-milestone` or `sfk-next-ticket`. A ticket left
  `in-review` **is** a blocker: this skill does not finalize tickets, so stop and send the user to
  `sfk-close-ticket` (step 6).
- **Read the registers, never rewrite them** (step 3). Sign-off may surface a parked entry or an answerable
  question and *offer* to act; it never files a ticket, never closes a question inline, and never lets that
  sweep block the sign-off itself.
