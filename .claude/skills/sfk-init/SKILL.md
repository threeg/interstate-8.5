---
name: sfk-init
description: Bootstrap the basic environment for a new spec-first project from the starter kit. Use ONCE, in an otherwise-empty repository that contains this kit. Optionally takes the project code as an argument, e.g. "/sfk-init ACME". Copies the environment templates out of .sfk/templates/ into their working locations and fills them; does not start any milestones. Trigger on "init", "initialise the project", "bootstrap from the starter kit", or "set up this kit".
---

# sfk-init — set up the project environment

Run this once, in a fresh repository that contains the starter kit. Your only job is to prepare the
working environment by **copying templates out of `.sfk/templates/`** and filling the copies.
You do **not** start any milestones and you do **not** write application code — that comes later, via
`sfk-version` then `sfk-next-milestone`.

> **`.sfk/` is read-only.** It is the kit's pristine source (templates, changelog, manifest).
> **Never edit anything inside `.sfk/`.** Always copy a template *out* to its working location and edit
> the copy. Only `sfk-update-kit` ever writes inside `.sfk/`.

**Project code.** This skill may be invoked with the project code as an argument, e.g.
`/sfk-init ACME`. The code is a short uppercase token used as the **ticket prefix** (`ACME-001`). It is
optional: if an argument is supplied, use it without asking; otherwise ask for it in the interview.

## Procedure

1. **Confirm the situation.** Check that the repo contains the kit (`.sfk/templates/`,
   `.claude/skills/`) and little or no application code. If it looks already-bootstrapped (a root
   `CLAUDE.md` and filled `spec/` docs exist), stop and ask before proceeding.

2. **Short essentials interview** (one round, then proceed). Ask only what the environment needs — not
   the product itself (that is the brief, owned by `sfk-version` → `sfk-next-milestone`):
   - the **project code / ticket prefix** — use the argument if passed (e.g. `/sfk-init ACME` →
     `ACME`); otherwise ask;
   - project name and a one-line description;
   - **models (optional):** whether the failing test should be written by a *different, stronger* model
     than the implementer — **independent test authorship** (the test isn't shaped to fit the code that
     must pass it). Default **no** — one model does everything. If yes, take the *implementation* model
     and the *tests* model.
   - **review mode:** how finished tickets are reviewed — `in-place` (commit and leave `in-review` on
     the branch; the **default**) or `pr` (a branch + pull/merge request per ticket; your merge is the
     approval). Offer `pr` only if the repo has a **remote** and the runtime is git-safe (not Cowork);
     **detect the forge from the remote** (`git remote -v` → e.g. `github.com` → `gh`) and confirm the
     CLI rather than asking cold. Default `in-place`.
   - **audience (optional, offered once):** ask whether they'd like a personal `CLAUDE.local.md` recording
     how they prefer things explained — their role, register, vocabulary to avoid. **Offer, don't press:**
     one question, and if the answer is no or a shrug, move on and don't raise it again. It is per-person
     and gitignored, so it captures whoever runs `sfk-init` and nobody else; teammates create their own.

   > **Do not ask about the stack, the layering or the commands.** Those are *not* environment facts —
   > the layering and dependency rule are the **architecture milestone's** deliverable (decided from the
   > brief and requirements), and the command runner and gates are settled at the **test-strategy** and
   > **scaffolding** steps, where the stack actually exists. Asking on day one invents facts the project
   > has to unpick later, and leaves a visibly half-filled `CLAUDE.md`. Nor should you ask whether there
   > is a UI: `sfk-version` asks that when it lays down the milestone table, because it is what consumes
   > the answer. If the user volunteers stack preferences here, note them for the architecture milestone
   > rather than writing them into `CLAUDE.md` as settled.

3. **Copy the environment templates out of `.sfk/templates/`** to their working locations, then
   fill the copies (replace every `<PLACEHOLDER>`):
   - `.sfk/templates/CLAUDE.md` → `./CLAUDE.md` (root). Fill it, and in its *Project & kit*
     section record the **project code**, set **Spec-First Kit version applied** to the
     `kit_version` from `.sfk/manifest.md`, fill the **Models** line from the interview (one model, or a
     distinct `tests` model for independent test authorship), and fill the **Review mode** line
     (`in-place`, or `pr` + the detected forge/CLI). (This is where project state lives — not in `.sfk`.)
     **Leave *Architecture dependency rule*, *Stack* and *Commands* exactly as they ship** — marked not-set,
     with their shape in HTML comments. They are filled by the milestones that settle them; do not guess
     them, and do not delete the markers.
   - `.sfk/templates/CLAUDE.local.md` → `./CLAUDE.local.md` — **only if the user accepted the audience
     offer.** Fill it from what they said and delete the sections they had nothing to say about. It is
     gitignored (the root `.gitignore` covers it), so **never commit it** — leave it out of the initial
     commit commands you present. Skip this file entirely if they declined.
   - `.sfk/templates/spec/milestone-plan.md` → `spec/milestone-plan.md`. Leave the
     milestone table **empty** with a *Current position* line "Environment bootstrapped; run
     `sfk-version` to start the first version." — the table is laid down by `sfk-version`.
   - `.sfk/templates/spec/README.md` → `spec/README.md` — the method guide. **Kit-owned: copy it
     verbatim, fill nothing.** (It is not shipped in the payload; `spec/` is created entirely here.)
   - `.sfk/templates/spec/gitignore` → `spec/.gitignore` — ignores the `.sfk-feedback/` outbox. Copy
     verbatim.
   - `.sfk/templates/spec/TODO.md` → `spec/TODO.md` — the parking lot, laid down **empty** (it ships
     with "no items yet"). Replace `<PROJECT>` in its title; otherwise copy verbatim. It is committed and
     shared; `sfk-todo` appends to it and `sfk-version` harvests it.
   - `.sfk/templates/spec/contents.md` → `spec/contents.md` — the specification index. Replace `<PROJECT>`,
     then **delete the rows for documents that do not exist yet** (everything from *1. Brief* onward, plus
     `verify/verify.md`) while **keeping their section headings**, so the shape of the spec is visible from
     the start. `sfk-signoff` fills each section in as its milestone lands. Keep the *Status and the method*,
     *Living registers* and *7. Tickets* rows — those files exist now.
   - `.sfk/templates/spec/open-questions.md` → `spec/open-questions.md` — the open-questions register,
     laid down **empty** (both tables keep their placeholder row only). Replace `<PROJECT>`; otherwise copy
     verbatim. Rows are added **as questions arise**, automatically, from any milestone or ticket — not
     here, and never by interview at init.
   - `.sfk/templates/spec/id-registry.md` → `spec/id-registry.md` — the id family registry. Replace
     `<PROJECT>` and the `<PRJ>` ticket prefix, and **keep only the rows that apply**: the shipped
     `FR-`/`NFR-`/ticket rows stay, and the trailing `<X>-n` example row is deleted (a project adds a
     row later, when it first invents a family of its own). Do **not** invent families here — none
     exist yet.
   - `.sfk/templates/spec/tickets/*` → `spec/tickets/*`, and
     `.sfk/templates/spec/templates/layer-CLAUDE.md` → `spec/templates/layer-CLAUDE.md`.
     Adapt the prefix and layer names.
   - Do **not** copy out the per-milestone spec docs (brief, requirements, architecture, wireframes,
     design, test-strategy) — `sfk-next-milestone` copies each out when its milestone is worked. Do
     **not** copy out `spec/verify/verify.md` either — `sfk-verify` creates it by interview on its
     first run.
   - **Root `.gitignore`:** if the repo has **no** `.gitignore`, copy `.sfk/templates/gitignore` out to
     `./.gitignore` and uncomment the build-artefact lines your stack uses. If the repo **already has**
     a `.gitignore` (e.g. from a framework scaffold), leave it as the source of truth — do **not**
     overwrite it — but make sure it ignores **`.claude/settings.local.json`** and **`CLAUDE.local.md`**,
     appending whichever lines are missing. Check `CLAUDE.local.md` specifically: a generic `*.local`
     pattern does **not** match it, and an accidentally-committed one puts one person's preferences on
     everybody.

4. **Stop and hand off.** Tell the user the environment is ready and the next step is `sfk-version`
   (give it a version number and goals). Do **not** start Milestone 1. To commit the initial scaffold,
   follow the **Commit protocol** you just wrote into the root `CLAUDE.md`: **do not run `git`
   yourself** — present the exact `git add` / `git commit` commands and have the user run them (safe in
   every runtime for this first commit).

## Rules

- **Never edit `.sfk/`** — copy templates out and edit the copies. Project state goes in the
  root `CLAUDE.md`, never in `.sfk`.
- Environment only. No milestones, no brief content, no application code.
- `sfk-init` runs **once** per project and may be deleted afterwards (one-time scaffolding).
- Never mark a milestone complete (that is `sfk-signoff`).
