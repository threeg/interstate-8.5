---
name: sfk-update-kit
description: Pull a newer version of the Spec-First Kit into an existing project without disturbing the project's filled-in docs. Compares kit versions, refreshes kit-owned files and the pristine template mirror, and applies changelog deltas to the living spec — interviewing the user where a change needs input. Trigger on "update the process", "update the kit", "pull the latest starter kit", "upgrade sfk", or "apply the new kit version".
---

# sfk-update-kit — bring a newer kit version into this project

Use when a newer version of the kit has shipped and you want its improvements in an existing project.
You apply the *method's* updates to the project's living spec **without overwriting the user's
content**. This is a semantic migration, not a blind file copy — a blind copy would clobber filled-in
docs, because the kit also ships working-named files for fresh inits.

## Inputs you need

- **This project**, whose *applied* kit version is recorded in the root `CLAUDE.md` (*Project & kit*
  section). `.sfk/manifest.md` here is the kit identity it was last refreshed from.
- **The newer kit**, available somewhere readable (a clone of the kit repo, or a temp folder the user
  points you at). You will read its `.sfk/manifest.md` (its `kit_version`), its
  `.sfk/CHANGELOG.md`, its `.sfk/templates/` mirror, and its kit-owned files.

If you cannot see the newer kit, ask the user where it is before proceeding.

## Procedure

1. **Compare versions.** Read the project's applied kit version (root `CLAUDE.md`, *Project & kit*) and
   the newer kit's `kit_version` (its `.sfk/manifest.md`). If
   they are equal, report "already up to date" and stop. If the project's is higher, stop and ask
   (something is off).

2. **Collect the deltas.** From the newer kit's `CHANGELOG.md`, take every entry with a version greater
   than the project's applied kit version, oldest-to-newest. The changelog is your migration script:
   each entry carries an **Apply** note (*refresh* / *add* / *amend* / *interview*).

3. **Refresh kit-owned files.** Overwrite the files the user does not edit, from the newer kit: the
   skills in `.claude/skills/` (**except `sfk-verify`** — the project fills it in for its own stack, so
   it is merged, not overwritten; see step 6), `spec/README.md`, `spec/.gitignore` (create it if the
   project predates the feedback loop, so `spec/.sfk-feedback/` is ignored), and the `.sfk/` machinery
   (`manifest.md` body, `CHANGELOG.md`). Before overwriting any kit-owned file, check whether the user
   has locally modified it (compare against the old pristine where one exists); if so, show the
   difference and confirm rather than silently discarding their change.

4. **Refresh the pristine mirror.** Copy the newer kit's `.sfk/templates/` over the project's,
   but **keep the previous mirror** available for the three-way comparison in step 5 (e.g. read the old
   one from version control, or copy it aside first).

5. **Apply each delta to the living docs.** For every changed living file, reason three ways — the
   user's working file vs the *old* pristine mirror vs the *new* pristine mirror — and apply only the
   kit's change, preserving the user's content:
   - **add:** insert the new section/heading where the new template has it; leave the body empty (or
     interview the user if they want it filled now).
   - **amend:** apply the wording/guidance change; keep any user edits in that section.
   - **refresh:** for a living file the changelog says to replace wholesale, confirm with the user first.
   - **interview:** when the change needs a decision or content, ask the user, then write their answer.
   Never overwrite filled-in content, and never touch generated artefacts (individual tickets, code) or
   the gitignored `spec/.sfk-feedback/` outbox.

6. **Merge `sfk-verify` — never overwrite it.** `sfk-verify` is the one skill the project fills in for
   its own stack at the scaffolding milestone, so its working copy at
   `.claude/skills/sfk-verify/SKILL.md` holds project-specific gate commands and stack-specific checks.
   Do **not** refresh it wholesale. Instead bring the newer kit's improvements into the filled-in copy,
   aided by the user:
   - Read the sources available: the project's **filled** `sfk-verify` and the **newer kit's**
     `sfk-verify` template (the new pristine). If the version the project originally filled from is
     recoverable (the pre-scaffolding commit in git history), use it as the old pristine for a
     three-way reason; otherwise reason two-way.
   - The **generic, instructional parts** — the *What to check* list, new check categories, wording,
     the *Rules* — are the kit's delta to bring in. The **filled-in specifics** — real gate commands,
     stack-specific checks, the named spec sections — are the user's content and are preserved.
   - Where the new template adds a check with no analog in the filled copy, adapt it to the project's
     stack, **interviewing** the user for the concrete command or spec section rather than leaving a
     `PLACEHOLDER`.
   - Present the proposed merged `sfk-verify` for approval before writing it. Never discard a
     stack-specific check in order to take a generic one.

7. **Offer optional backfills.** When a template gained a section that existing artefacts could also
   carry (e.g. the ticket template gained `## In plain English`), *offer* — do not force — to backfill
   it into the existing instances, interviewing per item for the wording. Skip if the user declines.

8. **Bump and commit.** Set the applied kit version in the root `CLAUDE.md` (*Project & kit*) to the
   newer kit's `kit_version`; the refreshed `.sfk/` now carries that kit's identity. Commit the
   refresh + applied deltas together (per the **Commit protocol** in the root `CLAUDE.md` — hand off if
   you are not in a git-safe runtime), e.g. `process: update kit to vX.Y.Z`. Summarise for the user what
   changed, what you interviewed them about, and anything you deliberately left for them.

## Rules

- Never overwrite the user's filled-in living docs or their code; apply only the kit's deltas.
- Kit-owned files are refreshed wholesale, but warn before discarding any local modification to one.
  **`sfk-verify` is the exception:** it is merged, not overwritten (step 6) — the project's
  stack-specific fill-in is preserved while the kit's generic improvements are brought in, aided by the
  user.
- The CHANGELOG is authoritative for *what* changed; the pristine mirrors are authoritative for the
  *exact* before/after text. Use both.
- Do not mark milestones complete or alter project status — this skill changes the *method*, not the
  *project's* progress.
