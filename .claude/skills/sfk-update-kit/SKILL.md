---
name: sfk-update-kit
description: Bring a newer Spec-First Kit version into this project after its two kit-owned folders have been copied over. Reads the changelog as a migration script and applies the deltas to the files the project owns — the root CLAUDE.md and the spec documents — interviewing the user where a change needs input, never overwriting their content. Trigger on "update the process", "update the kit", "pull the latest starter kit", "upgrade sfk", or "apply the new kit version".
---

# sfk-update-kit — bring a newer kit version into this project

Use when a newer version of the kit has been copied over this project and you want its improvements
applied. **The copy is the easy half and the user does it; you do the semantic half** — bringing the
kit's declared changes into the files the *project* owns, without touching their content.

> **Why a copy is safe.** The payload is exactly two folders — `.sfk/` and `.claude/` — and both are
> **100% kit-owned**: nothing in a project ever edits them. Everything the project owns (the root
> `CLAUDE.md`, all of `spec/`) is *generated* from `.sfk/templates/` and is never shipped, so a copy
> cannot clobber it. There are no exceptions and no skill to merge.

## Inputs you need

Everything is **inside this project** — you never need an external kit, a temp folder, or a path to
fetch from. After the copy, the project already contains:

- the **new** `.sfk/manifest.md` (its `kit_version`), `.sfk/CHANGELOG.md` (your migration script), and
  `.sfk/templates/` (the new pristine text);
- the **new** `.claude/skills/`;
- the project's **own** files, untouched by the copy: the root `CLAUDE.md` (which records the *applied*
  kit version) and everything under `spec/`.

**If the copy has not happened yet**, stop and tell the user how — *commit the project, copy the newer
kit's `.sfk/` and `.claude/` folders over it, don't commit, then re-run me*. **Never fetch or copy the
kit yourself.**

## Procedure

1. **Check the preconditions.**
   - Compare the applied kit version (root `CLAUDE.md`, *Project & kit*) against `kit_version` in
     `.sfk/manifest.md`. Equal → report "already up to date" and stop. Applied is *higher* → stop and
     ask; something is off.
   - Prefer the copy to be **uncommitted**, so `HEAD` still holds the pre-update state — that is the
     optional fallback in step 3. If it was already committed, or the tree is dirty for other reasons,
     say so and continue; it only costs you that fallback.

2. **Collect the deltas.** From `.sfk/CHANGELOG.md`, take every entry newer than the applied version,
   oldest-to-newest. **The changelog is the migration script**: each entry's **Apply** note
   (*refresh* / *add* / *amend* / *interview*) declares what the kit changed and how to bring it in. You
   do **not** have to diff old-vs-new to discover the kit's delta — it is stated.
   - **Check for `Pre-copy` notes first.** Those were instructions to the *human*, to be done **before**
     the copy that has already happened — they exist because the copy destroys something. If one was
     missed, **stop and say so**; then recover if you can (if the copy is uncommitted, `HEAD` still holds
     the pre-copy state: `git show HEAD:<path>`) or ask the user for their backup. **Never silently
     proceed past a missed `Pre-copy` step** — the thing it protected is already gone from the working
     tree.

3. **Apply each delta to the files the project owns.** The kit-owned folders are already current (the
   copy did that) — **do not re-copy them**. What remains is the root `CLAUDE.md` and the documents
   under `spec/`.

   > **`spec/README.md` is the exception, and it is the one that gets missed.** The method guide is
   > **kit-owned in substance but lives in the project-owned tree**, so the copy does **not** cover it —
   > the payload is only `.sfk/` and `.claude/`. Read the sentence above literally and you will bucket
   > the guide as "kit-owned, therefore already handled", which is exactly wrong. Whenever a changelog
   > entry touches the method, **refresh it wholesale from `.sfk/templates/spec/README.md`**; step 7
   > checks that you did.
   >
   > This has happened. Two consecutive releases declared a guide refresh, both were skipped, and the
   > project ran two kit versions on a guide that actively contradicted the refreshed skills — which is
   > the worst possible file to have lagging, because it is what a confused agent reads to re-derive the
   > method.

   Per the Apply note:
   - **add:** **first check whether the project already has a section serving that role under another
     name** (see *Already present under another name*, below). Otherwise insert the new section/heading
     where the new template (`.sfk/templates/…`) has it; leave the body empty, or interview if content
     is needed.
   - **amend:** apply the wording/guidance change; keep the user's edits in that section.
   - **interview:** ask the user, then write their answer.
   - **refresh:** for a project-owned file the changelog says to replace wholesale, confirm first.

   Use `.sfk/templates/` for the new exact text. **If an Apply note is ambiguous** — you cannot tell
   whether a difference is the kit's change or the user's own edit — recover the old pristine from git
   (`git show HEAD:.sfk/templates/<path>`) and reason three ways (user's file vs old pristine vs new
   pristine). If git is unavailable, ask the user rather than guess.

   **Already present under another name.** Before acting on any **add**, check whether the project
   already has a section doing that job under a different heading. This happens *by construction*: the
   kit adopts ideas that came from projects (repo-root `FEEDBACK.md`), so the project that originated a
   feature is the first to meet it again as an `add` — and it is the project most likely to have the
   richer version. Followed literally, the note leaves an empty kit-named section sitting beside a
   populated local one, with the file's own prose pointing at the second.

   This is **not** the ambiguity case above. There the question is *"is this difference the kit's change
   or the user's edit?"*; here it is neither — the project independently implemented the same feature.
   So:

   - **Never add the duplicate.** Compare the two and keep whichever is richer, folding in any columns,
     fields or rules the kit's version has that the project's lacks.
   - **The project's heading wins** if the project prefers it. The mechanism is the point; the name is not.
   - **Record the mapping in the project's own file** — a one-line pointer under that heading naming the
     kit's term for it. Skills refer to these sections *by heading*, so without the pointer a later skill
     run looks for a heading that is not there. One line, in the file that owns the name, is the right
     home for it — not a hedge in every skill that mentions the section.
   - **Say so in your report:** that you reconciled rather than added, and which version you kept.

   Never overwrite filled-in content, and never touch generated artefacts (individual tickets, code) or
   the gitignored `spec/.sfk-feedback/` outbox.

4. **Leave lazily-created files alone.** Some project-owned files are created on demand by the skill
   that owns them, not by this one — `spec/verify/verify.md` is created by `sfk-verify` on its first
   run. If such a file does not exist, do not create it; if it *does* exist and the changelog changed its
   template, apply the delta to it like any other living doc (step 3).

5. **Offer optional backfills.** When a template gained a section that existing artefacts could also
   carry (e.g. the ticket template gained `## In plain English`), *offer* — do not force — to backfill
   it into the existing instances, interviewing per item for the wording. Skip if the user declines.

6. **Offer to prune the root `CLAUDE.md`.** This skill is one of the things that *writes* correction notes
   into that file — and at the moment of an edit, a note saying the old value is gone is the honest thing to
   add. Nothing else in the kit ever decides, a version later, that the note has outlived its purpose, so the
   always-loaded file only grows. You are the natural place to close that loop, because you are already
   editing it and you already know which version's deltas are being applied.

   Scan it for material that has served its purpose and **offer** to remove each — never delete silently from
   a file the project owns:
   - **Correction notes from *earlier* versions** (*"corrected in v0.1.1: this previously said…"*). For each,
     check whether the **owning document's decisions log** already carries it. Where it does, offer to drop
     the inline note — the corrected value stands alone and the record is not lost. Where it does not, offer
     to **move** it there first. Never simply delete an unrecorded reason.
   - **Temporary blocks whose retirement condition has been met** — a build-state snapshot naming tickets that
     have since landed, a workaround for a fixed bug. If a block names no retirement condition, say so and
     offer to add one rather than guessing whether it is still live.

   **Why this is worth a step rather than left to tidiness:** the cost of a bloated always-loaded file is not
   tokens, it is dilution — and a rule that goes unread is how rules fail. Report what you propose to remove
   and why it is safe (naming the decisions log that now holds it), and leave anything the user does not
   confirm exactly where it is.

7. **Self-check the guide, before you bump anything.** Compare the `| **Kit version** | vX.Y.Z |` row in
   the project's `spec/README.md` against `kit_version` in `.sfk/manifest.md`. **They must match.** If
   they differ, the guide refresh was missed — **refresh `spec/README.md` from
   `.sfk/templates/spec/README.md` now**, then re-check. Do not proceed while they disagree, and do not
   "fix" it by editing the row: refreshing the guide is what *sets* that row, which is the only thing
   that makes this check honest rather than cosmetic.

   **Order matters — this runs *before* step 8's bump**, or the bump satisfies the check by itself and
   it tests nothing.

   **Why a check and not more instruction:** this failure is silent, self-concealing and cumulative — a
   lagging guide offers the wrong mental model to the next agent that reads it, so the drift compounds
   rather than surfacing. Instruction has already failed to prevent it twice; a one-line comparison
   catches it on the run that makes it. If the row is missing entirely (a project from an older kit),
   the refresh adds it — that is the same fix, not a special case.

8. **Bump and commit.** Set the applied kit version in the root `CLAUDE.md` (*Project & kit*) to the
   `kit_version` from `.sfk/manifest.md`. Commit the copied kit folders **and** the applied deltas
   together (per the **Commit protocol** in the root `CLAUDE.md` — hand off if you are not in a git-safe
   runtime), e.g. `process: update kit to vX.Y.Z`. Summarise for the user what changed, what you
   interviewed them about, and anything you deliberately left for them.

## Rules

- **Never fetch or copy the kit yourself.** The user copies the two kit-owned folders; you apply the
  semantic half. If they have not, say so and stop.
- **No kit file is ever merged.** `.sfk/` and `.claude/` are wholesale-replaced by the copy — a project
  never edits a skill. `sfk-verify` is neutral; its project-specific half is `spec/verify/verify.md`,
  which is an ordinary living doc.
- Never overwrite the user's filled-in living docs or their code; apply only the kit's declared deltas.
- The CHANGELOG is authoritative for *what* changed; `.sfk/templates/` for the *new* exact text; git
  (`HEAD`) for the *old* text on the rare occasion you need it.
- Do not mark milestones complete or alter project status — this skill changes the *method*, not the
  *project's* progress.
