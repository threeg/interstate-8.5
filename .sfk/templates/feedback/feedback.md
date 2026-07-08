---
sfk_feedback: 1
kit_version: <KIT_VERSION_APPLIED>   # the kit version this project is on (root CLAUDE.md, Project & kit)
date: <DATE>                         # ISO date the feedback was captured
category: <CATEGORY>                 # bug | friction | doc-gap | enhancement | idea
area: <AREA>                         # what it concerns, e.g. sfk-next-ticket, spec/README.md, TICKET-TEMPLATE
severity: <SEVERITY>                 # blocker | major | minor | nice-to-have
---

# <ONE-LINE TITLE>

> **What this file is.** A single piece of feedback about the Spec-First Kit (SFK) *itself* — not about
> the project that produced it — captured by the `sfk-feedback` skill. It is written to `spec/.sfk-feedback/`,
> which is **gitignored**: it is never committed to this project. You send it to the SFK maintainer out
> of band; on the SFK side it is consumed and **deleted** (zero residue). One file = one piece of
> feedback.
>
> **Keep it shareable.** This file leaves your repository. Do **not** include secrets, credentials, or
> proprietary product detail. Describe the *process* friction, not your domain. Project provenance is
> optional — omit it if in doubt.
>
> Replace every `<PLACEHOLDER>` and delete this guidance block as you fill the sections. **Keep the
> final `## For the SFK maintainer` section verbatim** — it tells whoever consumes this file how to.

## Summary

<One sentence: what the feedback is, in plain language.>

## What happened

<The observation, with a concrete example. If it is friction or a bug: what you were doing, what you
expected the kit to do, and what it actually did. Point at the specific skill/doc/step (the `area`).
Be concrete enough that the maintainer can reproduce or picture it without asking you.>

## Suggested change (optional)

<If you have one: the concrete change you'd propose — reword this instruction, add this check, split
this skill, fix this template. Leave blank if you're only reporting the problem.>

---

## For the SFK maintainer (how to consume this)

> This section is standard and stays in every feedback file. It is the instruction to whoever runs the
> intake pass on the SFK side (see the repo-root `FEEDBACK.md`).

1. **Triage.** Judge this item against SFK's principles and current shape. Decide: **accept**,
   **reject**, or **defer**. `category`/`area`/`severity` in the frontmatter are the sorting keys;
   cluster duplicates from different projects.
2. **If accepted:** make the real change in the kit — the relevant `SKILL.md`, template in
   `.sfk/templates/`, `spec/README.md`, or `CLAUDE.md` — and add a `.sfk/CHANGELOG.md` entry with its
   **Apply** note. Record the *why* in `SFK-DESIGN.md` if it carries reasoning worth preserving.
3. **If rejected or deferred:** no durable record is kept (zero residue) — the decision lives only in
   the maintainer's judgement for this pass.
4. **Then delete this file.** Feedback files are never kept on the SFK side once triaged. Nothing here
   is retained after the pass.
