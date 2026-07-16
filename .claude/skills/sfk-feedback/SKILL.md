---
name: sfk-feedback
description: Capture structured feedback about the Spec-First Kit itself and write it to spec/.sfk-feedback/ (gitignored, never committed to the project) so it can be sent back to SFK and consumed there. One file per piece of feedback, from a standard template. Trigger on "sfk feedback", "give feedback on the kit", "feedback to sfk", "the process is annoying", "report a kit problem", or "something about the kit could be better".
---

# sfk-feedback — capture feedback about the kit, to send back to SFK

Use whenever you hit something about the **kit itself** worth telling its maintainer — friction, a bug
in a skill, a confusing doc, a missing check, an idea. You capture it as one or more **standard
feedback files** in `spec/.sfk-feedback/`, which is **gitignored** so it never lands in this project's
history. The user then sends those files to the SFK maintainer out of band; on the SFK side they are
consumed and deleted (zero residue).

This is about the *kit*, not the *product*. Product/spec decisions belong in `spec/`; a bug in the
software belongs in a ticket. Feedback here is "the method or its tooling could be better."

> **`.sfk/` is read-only.** The feedback template source lives at `.sfk/templates/feedback/feedback.md`.
> Copy it *out* to `spec/.sfk-feedback/` and fill the copy — never edit inside `.sfk/`.

## Procedure

1. **Make the outbox safe before writing anything.** Confirm `spec/.gitignore` exists and contains a
   `.sfk-feedback/` rule. If it is missing (an older project, or a project that never had one), create or
   append it **first**, so no feedback file can ever be staged. Then ensure the `spec/.sfk-feedback/` folder
   exists. Never write a feedback file until the ignore is in place. **Feedback files go only in
   `spec/.sfk-feedback/`** — never in your agent's own memory, notes, or scratch directory, and never
   anywhere else in the repo.

2. **Interview.** Draw out each distinct piece of feedback. For every item capture:
   - **category** — `bug` | `friction` | `doc-gap` | `enhancement` | `idea`;
   - **area** — the specific skill, doc, template, or step it concerns (e.g. `sfk-next-ticket`,
     `spec/README.md`, `TICKET-TEMPLATE`);
   - **severity** — `blocker` | `major` | `minor` | `nice-to-have`;
   - **what happened** — the observation with a concrete example (expected vs actual for a bug/friction);
   - **suggested change** — optional.
   If the user raises several unrelated things, treat each as its **own** item (one file each).

3. **Write one file per item — from the template, always.** You **MUST** use
   `.sfk/templates/feedback/feedback.md`: copy it out to `spec/.sfk-feedback/<slug>-<shortid>.md` and
   fill it in — `<slug>` a short kebab summary, `<shortid>` a few random characters so files from
   different projects don't collide when they reach SFK. **Do not invent a custom structure or custom
   frontmatter**; a non-conformant file has to be rewritten before it can be consumed. Fill the
   frontmatter and body: `kit_version` is this project's **applied** kit version (root `CLAUDE.md`,
   *Project & kit*); `date` is today (ISO). Two instructions that are routinely missed — do both:
   - **Delete** the `> **What this file is.**` guidance block once you have filled the sections. It is
     instructions *to you*, not content, and must not survive into the finished file.
   - **Keep** the `## For the SFK maintainer` section **verbatim** — that is what makes the file
     self-describing on the SFK side.

4. **Keep it shareable.** These files leave the repository. Do not write secrets, credentials, or
   proprietary product detail into them; describe the process, not the domain. Project provenance is
   optional — omit it if in doubt.

5. **Do not commit.** The folder is gitignored, so there is nothing to commit and nothing should be
   staged. Tell the user where the files are (`spec/.sfk-feedback/`) and that the next step is to send them
   to the SFK maintainer (however they share files). Offer to list the current feedback files, and to
   clear any they confirm are already sent.

## Rules

- **Never commit feedback files.** They are local-only, gitignored, and must never enter this project's
  history. If `spec/.gitignore` lacks the `.sfk-feedback/` rule, add it before writing.
- **The template is binding.** Every feedback file is `.sfk/templates/feedback/feedback.md`, filled —
  never a custom format. Its frontmatter fields and section headings are the contract the SFK-side
  intake reads.
- **Never edit `.sfk/`** — copy the template out to `spec/.sfk-feedback/` and edit the copy.
- One file per distinct piece of feedback; keep each self-contained (the maintainer has no access to
  this conversation).
- This skill only writes into `spec/.sfk-feedback/`. It does not touch the project's living docs, tickets,
  code, or milestone status.
- Keep every file shareable and free of proprietary or secret content.
