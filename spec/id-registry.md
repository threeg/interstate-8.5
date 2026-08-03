# Interstate-8.5 — Id family registry

| | |
|---|---|
| **Document** | Id family registry |
| **Repository location** | `spec/id-registry.md` |
| **Last updated** | 2026-08-01 (created at the v1.4.3 kit update; seeded from the families slice 1 already uses) |

The spec cites itself by id — `FR-9`, `NFR-3`, and whatever families this project invents. This document
says **what each family of ids means and which document defines it**, so a bare `DR-2` in a ticket is never
opaque.

> **This is a navigation aid, not the specification.** Nothing here is binding: the owning document named
> in each row is. Never record a rule's *content* in this file — a second copy of a requirement is a second
> source of truth, and it will drift.

---

## Families

> One row per **family**, not per id. Link the **document**; leave the section number as plain text (see
> *Resolving an id* in `spec/README.md` for why).

| Prefix | Means | Defined in | Minted by |
|--------|-------|------------|-----------|
| `FR-n` | Functional requirement — observable behaviour | [`requirements.md`](requirements/requirements.md) §4 (by capability) and §5 (behaviour/flow) | Requirements milestone |
| `NFR-n` | Non-functional requirement — qualities, limits, thresholds | [`requirements.md`](requirements/requirements.md) §6 | Requirements milestone |
| `DR-n` | Domain rule — an invariant of the song data model (one type per song, parent links, what makes a song an alternate version) | [`requirements.md`](requirements/requirements.md) §3 | Requirements milestone |
| `D-x` | Decision a version owes — a choice that version exists to make, lettered (`D-a`…) and scoped to one version brief. **Not** an open question: a `D-x` is ours to settle, and it is retired by the milestone that settles it rather than answered from outside | that version's brief, e.g. [`5.0.x-dev2-brief.md`](brief/5.0.x-dev2-brief.md) §3 | `sfk-version`; extended by the brief's ratification milestone |
| `Q-n` | Open question for someone outside the team — a value we assume until it is confirmed | [`open-questions.md`](open-questions.md) §1 | Any milestone or ticket |
| `S-n` | Open question we owe ourselves | [`open-questions.md`](open-questions.md) §2 | Any milestone or ticket |
| `TODO-n` | Parking-lot item — work awaiting a decision of ours | [`TODO.md`](TODO.md) | `sfk-todo`, any time |
| `INT8-nnn` | Implementation ticket | [`tickets/BOARD.md`](tickets/BOARD.md) | Ticket generation |
| `INT8-E0n` | Capability epic — a container, outside the execution order | [`tickets/BOARD.md`](tickets/BOARD.md) | Ticket generation |

---

## Resolving a specific id

To find what an individual id **says**, search the repository for it — e.g. `rg 'FR-5'` or your editor's
find-in-files. Ids are unique, permanent and always written in backticks, so the first hit inside the owning
document is the definition and the rest are its citations. That is usually more useful than a jump to the
definition alone, because it also shows you everywhere the rule is relied on.

This file deliberately does **not** list individual ids. See *Resolving an id* in `spec/README.md`.

---

## Conventions

- **Add a row when you invent a family, not when you invent an id.** Families are rare and stable; ids are
  many. A family's row is written once, in the milestone that first mints that family.
- **Ids are permanent** — never reused, never renumbered (see `requirements.md` §1). That is what makes
  searching for one reliable.
- **If a family's entries are ever removed from the document that lists them, that document must keep a
  permanent record of the id.** Otherwise "next after the highest" is computed from an undercount and
  reuses a number — a collision nothing in the file can detect, because the evidence is exactly what was
  removed. `TODO-n` is the case here: a resolved entry's body goes, but a one-line tombstone stays in
  `TODO.md`'s *Resolved* table. Families whose entries persist (`FR-`, `NFR-`, `DR-`, `Q-`, `S-`, tickets)
  need nothing extra. **Check this before inventing a family with a delete-on-resolve lifecycle.**
- **Never link an id to a numbered-section anchor.** The reason, and what to do instead, is in
  *Resolving an id* in `spec/README.md`.
