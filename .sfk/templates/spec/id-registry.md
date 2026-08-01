# <PROJECT> — Id family registry

| | |
|---|---|
| **Document** | Id family registry |
| **Repository location** | `spec/id-registry.md` |
| **Last updated** | <DATE> (<one-line note: which family was added or moved>) |

The spec cites itself by id — `FR-9`, `NFR-3`, and whatever families this project invents. This document
says **what each family of ids means and which document defines it**, so a bare `C-2` in a ticket is never
opaque.

> **This is a navigation aid, not the specification.** Nothing here is binding: the owning document named
> in each row is. Never record a rule's *content* in this file — a second copy of a requirement is a second
> source of truth, and it will drift.

---

## Families

> One row per **family**, not per id. Link the **document**; leave the section number as plain text (see
> *Resolving an id* in `spec/README.md` for why). Delete the rows that don't apply and add your own.
>
> Early on, a row may point at a document that **has not been authored yet** — the milestone named in
> *Minted by* creates it (`requirements.md` appears at the requirements milestone, not at init). That is
> expected, not a broken link, and it resolves itself as the spec milestones run.

| Prefix | Means | Defined in | Minted by |
|--------|-------|------------|-----------|
| `FR-n` | Functional requirement — observable behaviour | [`requirements.md`](requirements/requirements.md) §4 | Requirements milestone |
| `NFR-n` | Non-functional requirement — qualities, limits, thresholds | [`requirements.md`](requirements/requirements.md) §6 | Requirements milestone |
| `Q-n` | Open question for the client — a value we assume until they confirm it | [`open-questions.md`](open-questions.md) §1 | Any milestone or ticket |
| `S-n` | Open question we owe ourselves | [`open-questions.md`](open-questions.md) §2 | Any milestone or ticket |
| `TODO-n` | Parking-lot item — work awaiting a decision of ours | [`TODO.md`](TODO.md) | `sfk-todo`, any time |
| `<PRJ>-nnn` | Ticket | [`tickets/BOARD.md`](tickets/BOARD.md) | Ticket generation |
| `<X>-n` | `<what this project's own family means>` | [`<doc>.md`](<folder>/<doc>.md) `<§n>` | `<which milestone allocates it>` |

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
  removed. `TODO-n` is the case in this kit: a resolved entry's body goes, but a one-line tombstone stays
  in `TODO.md`'s *Resolved* table. Families whose entries persist (`FR-`, `NFR-`, `Q-`, `S-`, tickets) need
  nothing extra. **Check this before inventing a family with a delete-on-resolve lifecycle.**
- **Never link an id to a numbered-section anchor.** The reason, and what to do instead, is in
  *Resolving an id* in `spec/README.md`.
- If this project only ever uses `FR`/`NFR`, this file earns little — it pays off from the first
  project-specific family onward.
