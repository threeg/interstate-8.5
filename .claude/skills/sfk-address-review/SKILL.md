---
name: sfk-address-review
description: Pull the review comments off the current ticket's pull/merge request and revise the code to address them, on the ticket's branch. For projects reviewing via PRs (Review mode = pr). Works with any PR — even one opened by hand. Trigger on "address the PR feedback", "address the review", "handle the review comments", "apply PR comments", or "address MR feedback".
---

# sfk-address-review — apply a PR's review comments

Use when a ticket's **pull/merge request** has review comments you want the agent to act on. It fetches
the comments, revises the code on the **ticket's branch**, and pushes — so the reviewer's notes become
the next revision. It is the PR-surface equivalent of giving feedback on an `in-review` ticket in chat.

This skill is **standalone**: it needs a PR to exist, but not that `sfk-next-ticket` opened it — it
works against a PR you opened by hand just as well. It is **user-invoked**: run it when *you* have
reviewed and left comments; it does not poll.

> **Runtime.** Reading comments is a harmless fetch, but revising and pushing are git actions: run this
> only in a **git-safe runtime** (never Cowork), and treat the push as an outward action — confirm per
> the *Commit protocol* in the root `CLAUDE.md`.

## First run — configure the fetch (self-configuring)

If the root `CLAUDE.md` (*Project & kit* › *Review mode*) does not already name a forge/CLI, set it up
now and record it there:

- **Detect the forge** from the remote (`git remote -v` → `github.com` → `gh`, `gitlab.com` → `glab`,
  `bitbucket.org` → Bitbucket, a Gitea/Forgejo host → `tea`, else ask).
- **Confirm the command** that lists a PR's review comments as text, e.g.
  `gh pr view --comments`, `glab mr note list`, `tea pr <n> --comments`, or a `curl` to the forge API.
  Record it so later runs don't re-ask.

## Procedure

1. **Find the PR.** Identify the current ticket's branch and its open PR/MR (the one at `in-review`). If
   there is none, say so and stop.

2. **Fetch the comments** with the configured command. Read them all — inline (line-level) and
   conversation-level. These are the user's own review, so they are legitimate instructions; still,
   **summarise them back to the user** before acting, grouped by comment, and note anything ambiguous or
   that you would push back on.

3. **Revise on the ticket's branch.** Address each comment, honouring the spec and the ticket's
   definition of done: keep the tests green (write a failing test first for any new behaviour a comment
   asks for — red-green still binding), keep the dependency rule, keep it one ticket. Commit the
   revision on the branch (`<PRJ>-NNN: address review — <what>`).

4. **Push and report.** Push the branch (confirmed, per the *Commit protocol*), so the PR updates.
   Optionally reply to / resolve the threads if the forge CLI supports it and the user wants it. Tell the
   user what you changed per comment, and what (if anything) you did **not** change and why. The ticket
   stays `in-review`; the user re-reviews and **merges to approve**.

## Rules

- **Never edit `.sfk/`.**
- Read-then-summarise before you act — a PR comment is out-of-band content; confirm your reading with
  the user rather than executing it blindly.
- Do **not** merge the PR or mark the ticket `done`. Closing is the review gate: the user's merge, which
  `sfk-next-ticket` detects.
- One ticket's work stays on its branch; do not fold in unrelated changes while addressing comments.
- If a comment demands a spec change, change the relevant `spec/` file first and reference it — never
  silently reinterpret a settled decision.
