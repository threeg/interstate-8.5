# <PROJECT> — the wireframes decisions

| | |
|---|---|
| **Document** | Decision record and superseded wording for `overview.md` |
| **Repository location** | `spec/wireframes/decisions.md` |
| **Status** | **Archive — not binding.** The binding document is `overview.md` |

> **This is an archive, and it is deliberately not in the reading path.** It exists so the binding
> document beside it can hold **builder instructions only** (`spec/README.md`, *How versions evolve*).
> Nobody reads this file routinely, and that is correct — its whole value is at the rare, expensive
> moment someone asks *"why is this rule like this, and can I just change it?"*
>
> **Do not summarise it upward into the binding document, and do not maintain it as though it were
> current.** Append; never rewrite.

## What belongs here

- **Decisions** — UI decisions from the wireframe interview — layout choices, ordering and grouping, what was deliberately left out. Record the options considered and the reason, not just the outcome.
- **Superseded wording** — when a rule in the binding document is rewritten, its previous text moves
  here **verbatim**. It does not stay beside the live rule, where it gets read as current.

## What does not

- **Rules.** If a sentence can be written as a rule, it belongs in the binding document.
- **Operational hazards** — a finding a builder would otherwise rediscover expensively, whose absence
  lets someone build the wrong thing. Those stay in the binding document; they are neither
  justification nor history.

## The reference runs one way

Entries are **keyed by the id or section they affect**, so "why is this like this" is a search
(`rg '<id>' spec/`). **A rule never cites its entry here.** Cite one and someone soon adds a sentence
explaining the citation, and the narration is back in the binding text. Wanting to point at this file
*from* a rule is the signal that the justification should have stayed out of the rule.

---

## Entries

> Newest last. One line each where possible; the reasoning lives here, so it may run longer than a rule
> would — but a decision is not an essay.

- **<DATE>** — `<screen / §n>` — <the decision, the options considered, and why this one>.
- **<DATE>** — `<screen / §n>` — amended in vX.Y.Z. Previously read: "<the exact superseded wording>".
  <Why it changed.>

_(No decisions recorded yet.)_
