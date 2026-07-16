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
   under `spec/`. Per the Apply note:
   - **add:** insert the new section/heading where the new template (`.sfk/templates/…`) has it; leave
     the body empty, or interview if content is needed.
   - **amend:** apply the wording/guidance change; keep the user's edits in that section.
   - **interview:** ask the user, then write their answer.
   - **refresh:** for a project-owned file the changelog says to replace wholesale, confirm first.

   Use `.sfk/templates/` for the new exact text. **If an Apply note is ambiguous** — you cannot tell
   whether a difference is the kit's change or the user's own edit — recover the old pristine from git
   (`git show HEAD:.sfk/templates/<path>`) and reason three ways (user's file vs old pristine vs new
   pristine). If git is unavailable, ask the user rather than guess.

   Never overwrite filled-in content, and never touch generated artefacts (individual tickets, code) or
   the gitignored `spec/.sfk-feedback/` outbox.

4. **Leave lazily-created files alone.** Some project-owned files are created on demand by the skill
   that owns them, not by this one — `spec/verify/verify.md` is created by `sfk-verify` on its first
   run. If such a file does not exist, do not create it; if it *does* exist and the changelog changed its
   template, apply the delta to it like any other living doc (step 3).

5. **Offer optional backfills.** When a template gained a section that existing artefacts could also
   carry (e.g. the ticket template gained `## In plain English`), *offer* — do not force — to backfill
   it into the existing instances, interviewing per item for the wording. Skip if the user declines.

6. **Bump and commit.** Set the applied kit version in the root `CLAUDE.md` (*Project & kit*) to the
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
