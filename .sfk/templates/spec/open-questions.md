# <PROJECT> — Open questions

| | |
|---|---|
| **Document** | Open questions register |
| **Repository location** | `spec/open-questions.md` |
| **Last updated** | <DATE> (<one-line note: which question opened, sharpened or closed>) |

A live register of **values we are not certain about but are building against anyway** — something a
client has yet to supply, a rule inferred from a sample, a system we have no access to yet.

Without this file those unknowns live as scattered *"(to confirm)"* markers with no index, no owner and
no way to find every affected place later. The cost of answering them then rises silently until
something expensive has been built on top.

> **This is not the parking lot.** `spec/TODO.md` holds *work* we know is coming but cannot ticket yet,
> because **a decision of ours** does not exist; each entry becomes a ticket. This file holds
> **dependencies on information** — often on someone else — which are not work items and **do not block
> anything**. A project can legitimately run with an empty `TODO.md` and a full register, or the reverse.

---

## The rules (why this file works)

1. **Ids are permanent.** `Q-1`, `S-1` are never reused or renumbered, so a code comment, a ticket or a
   spec section can cite one for the life of the project. (Both families are listed in
   `spec/id-registry.md`.)
2. **An open question never blocks work.** Build to the documented assumption and record it here. This is
   the load-bearing rule: treated as a blocker list, this file would stall delivery within a week. It is a
   *dependency* register.
3. **An answer is a specification change, not a cleanup ticket.** When one lands, amend the owning `spec/`
   document **first** (and the `decisions.md` beside it), then change code to match. Never patch the code and leave
   the spec stale.
4. **Make answers cheap to apply.** Every assumed value should be a **named constant** with a test
   asserting it, so answering a question means editing one constant, one expectation and one fixture —
   not hunting through modules.
5. **Tag the work.** Any ticket or module that bakes in an assumed value **cites its id**, so a search for
   `Q-4` finds every affected place the day the answer arrives. `sfk-verify` checks this.

**It is read on a schedule, so a row cannot quietly age.** `sfk-verify` **sharpens** rows at batch
boundaries; `sfk-signoff` **sweeps** at every milestone, asking of each related row both *has the answer
arrived?* and *has the ask actually been sent?*; and `sfk-version` reads the whole register at version
planning, ordered by lead time. The middle one matters most: a question sharpened into something precisely
answerable that nobody ever sent is the most expensive failure this file has.

### Which to chase first: lead time, not severity

The instinct is to chase the scariest unknown. Prefer the one with the **longest lead time** — an answer
that is cheap to apply can arrive late at no cost, while one that must go through someone else's approval
cycle cannot. Sort by *how long it will take to get*, then by *how expensive it becomes if it arrives
late*.

### Sharpen a question every time you learn more

A vague ask waits for a meeting; a precise one is actioned in an afternoon. When a later milestone teaches
you what you actually need, **rewrite the question in place** — from *"confirm the brand colours"* to
*"your guide shows four different greens; which is correct for headings?"*. This file is where that
sharpening accumulates instead of being lost in conversation.

---

## 1. Questions for the client (`Q-n`)

> **Write this table so it can be sent to the client as it stands** — no edits, no translation. Assume the
> reader has never seen the code and does not know the project's jargon. One plain-language sentence per
> question, and always say what we are assuming meanwhile, so silence is visibly a choice. Fill the
> **Answer** column in and send it back; nothing else is needed from them.

| Id | Question | Why we need it | What we assume until told otherwise | Answer | Needed by |
|----|----------|----------------|--------------------------------------|--------|-----------|
| `Q-1` | <One plain sentence. No ids, no file names, no jargon.> | <One line a non-technical reader understands.> | <the value we are building to> | | <date or milestone> |
| `Q-2` | <…> | <…> | <…> | | <…> |

<!-- Good: "Your brand guide shows four different greens. Which one should headings use?"
     Bad:  "Confirm token value for --color-heading per design-system §2.1."
     The second is unanswerable by the person who actually knows. -->

---

## 2. Questions we owe ourselves (`S-n`)

> Internal unknowns — nobody outside the team needs to answer these. Kept numerically separate from `Q-n`
> so that a search for *"what are we waiting on from the client"* stays clean. Same five rules apply.

| Id | Question | Why it matters | What we assume for now | Resolution |
|----|----------|----------------|------------------------|------------|
| `S-1` | <…> | <…> | <…> | |

---

## 3. When an answer arrives

Work in this order — it is rule 3 made concrete:

1. **Record it** in the row's *Answer* column, with the date and who confirmed it.
2. **Amend the owning `spec/` document** so the confirmed value is the specification, and add a line to
   the `decisions.md` beside that document, saying what changed and why.
3. **Search for the id** (`Q-4`) across `spec/` and the code to find every place built on the assumption.
4. **File a ticket** for the code change if it is more than trivial, citing the id and the amended spec
   section.
5. **Close the row** — keep it in the table with its answer, struck through or marked `closed`. Do **not**
   delete it: the answer and its date are the audit trail of why the code says what it says. (This is the
   opposite of `spec/TODO.md`, which keeps only a one-line tombstone, because there the ticket becomes the
   record.)

If an answer **changes** a value already built on, say so explicitly in the `decisions.md` beside the owning
document — a silently-corrected value is indistinguishable from a bug.

---

## 4. Notes log

> Append-only. The most valuable entries record a question's **cost changing** — "answering `Q-1` was
> free in week 1; now that the fixtures are committed it invalidates most of them". That is what keeps a
> deliberate deferral an informed decision rather than an invisible one.

- **<DATE>** — <what opened, sharpened, closed, or got more expensive, and why>.
