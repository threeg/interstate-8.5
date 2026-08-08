# <PROJECT> — Requirements

| | |
|---|---|
| **Document** | Functional and non-functional requirements |
| **Repository location** | `spec/requirements/requirements.md` |
| **Status** | Binding specification |

> **Purpose.** This document turns the brief's goals into **numbered, testable rules**. It is the
> contract the implementation is held to and the source the test strategy traces against. Every
> functional requirement gets an `FR-n`; every non-functional one an `NFR-n`. Numeric thresholds
> stated here are **contractual** (§1.4) — code and tests must use the exact values, and changing one
> is a documented spec change, not a silent reinterpretation.
>
> Write requirements so a fresh agent session could implement and test them from this document
> alone. Prefer "the system MUST return at most N results, ordered by X" over "results should be
> reasonable".

---

## 1. Conventions

1. **Identifiers.** Functional requirements are `FR-n`; non-functional are `NFR-n`. Numbers are
   permanent once allocated — never reused or renumbered. New requirements take the next free
   number; a superseded one is **rewritten in place** and marked — exactly `*(amended vX.Y.Z)*`, at the
   end of the rule, nothing else.
   **The superseded wording does not stay in the rule.** It moves to [`decisions.md`](decisions.md)
   verbatim, keyed by the id. Dead text left beside live text is read as current: in one project a
   superseded tail was left spliced onto the *next* rule and asserted a behaviour that had been removed,
   and an implementer working from that rule alone would have built it. The marker is a flag, **not a
   cross-reference** — it never points at the archive, because a rule that cites its entry soon acquires a
   sentence explaining the citation, and the narration is back.
2. **Modal verbs.** MUST / MUST NOT are binding; SHOULD is a strong default that may be overridden
   with a recorded reason; MAY is optional.
3. **Traceability.** Every `FR`/`NFR` is realised by at least one ticket (its `implements` field)
   and covered by at least one test (test strategy §14).
4. **Numeric thresholds are contractual.** Any number in this document (limits, tolerances,
   timeouts, counts) is binding. Implementation references it as a named constant; tests assert it.
   Changing one means editing this document first.
5. **This document holds builder instructions.** Three things belong in it, and a fourth does not:
   - **Rules** — what MUST, MUST NOT, SHOULD hold. The test for any sentence: *can this be rewritten as a
     rule?* If yes, make it the rule and delete the prose. *"The band is a fixed height so the budget is
     computable without rendering"* → **the budget MUST be computable without rendering.**
   - **Contractual values** — thresholds, limits, names (§1.4).
   - **Operational hazards** — findings a builder would otherwise rediscover expensively, and whose
     absence lets someone build the wrong thing: *"the standard vulnerability audit reports this package
     clean, so a clean audit is not sufficient evidence here"*; a published parameter set that throws
     against the runtime's default memory limit; a comment-syntax edge case that silently breaks a parser.
     These are **not** narration and are never removed for length.
   - **Not: justification.** Why a rule is what it is belongs in [`decisions.md`](decisions.md). A builder
     needs the rule; a reader asking *"why can't I just change this?"* searches the archive for the id.

---

## 2. <Core domain definitions / taxonomy>

> If the project depends on a precise vocabulary or classification (categories, states, families,
> tiers), define it here as tables with exact boundaries. This is the most common source of subtle
> bugs, so make the boundaries unambiguous (closed vs open intervals, tie-breaks, the catch-all
> case). Rename/extend this section to fit the domain; delete if not needed.

### 2.1 <Sub-table>

| <Name> | <Definition / exact boundary> |
|--------|-------------------------------|
| <…>    | <…>                           |

---

## 3. <Domain rules>

> The substantive rules of the domain — the logic the core layer implements. State each as a
> testable proposition. Group related rules under sub-headings. These are where test-first pays off
> most, so be exact: inputs, outputs, ordering, tie-breaking, and the boundary conditions.

---

## 4. Functional requirements by capability

> Group requirements under the capability they serve (mirroring the brief's goals). Each entry is a
> single MUST/SHOULD statement with an id. Example shape:

### 4.1 <Capability A>

- **FR-1** The system MUST <observable behaviour, with exact limits/ordering>.
- **FR-2** The system MUST <…>.
- **FR-3** When <condition>, the system SHOULD <…>; otherwise it MUST <…>.

### 4.2 <Capability B>

- **FR-4** <…>
- **FR-5** <…>

<!-- Continue grouping by capability. Keep statements atomic — one assertion per FR so a single
     test can target it and traceability stays clean. -->

---

## 5. <Behaviour / flow rules>

> Cross-cutting behavioural rules that span capabilities (e.g. how results are ranked, what the
> fallback ladder is when no result qualifies, how errors surface). State the precedence/order
> explicitly where one rule can override another.

- **FR-n** <…>

---

## 6. Non-functional requirements

> Performance, reliability, security, portability, accessibility, and any hard constraints from the
> brief (e.g. offline operation). Make them measurable: "responds in ≤ N ms at M records", not
> "fast". The architecture's dependency rule is often encoded as an NFR here so it can be cited by
> the ticket that enforces it.

- **NFR-1** <e.g. The application MUST make no network calls at runtime.>
- **NFR-2** <e.g. The application MUST start with a single command.>
- **NFR-3** <e.g. A request over <N> records MUST return within <T>.>
- **NFR-n** <e.g. The innermost layer MUST import only the standard library; enforced by tooling.>

---

## 7. Decisions and superseded wording

> Not here — see **[`decisions.md`](decisions.md)** beside this file. This document holds **builder
> instructions only**: rules, contractual values, and operational hazards. Why a rule is what it is, and
> what it used to say, live in the archive so they are out of the reading path (`spec/README.md`, *How
> versions evolve*). The reference runs **one way** — entries there name rules here; a rule never cites
> an entry.
