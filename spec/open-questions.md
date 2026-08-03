# Interstate-8.5 — Open questions

| | |
|---|---|
| **Document** | Open questions register |
| **Repository location** | `spec/open-questions.md` |
| **Last updated** | 2026-08-02 (`S-2` opened and closed — the Composer failure is an advisory-policy block on unpatched core, not a dependency conflict) |

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
   document **first** (and its decisions log), then change code to match. Never patch the code and leave
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

<!-- Good: "Your brand guide shows four different greens. Which one should headings use?"
     Bad:  "Confirm token value for --color-heading per design-system §2.1."
     The second is unanswerable by the person who actually knows. -->

---

## 2. Questions we owe ourselves (`S-n`)

> Internal unknowns — nobody outside the team needs to answer these. Kept numerically separate from `Q-n`
> so that a search for *"what are we waiting on from the client"* stays clean. Same five rules apply.

| Id | Question | Why it matters | What we assume for now | Resolution |
|----|----------|----------------|------------------------|------------|
| `S-1` | When two `song_type` terms share a weight, what decides which the Type filter offers first? | `SongTypeOptions::getTerms()` sorts on weight alone, so a tie is resolved by the database's returned order — undefined, and different from the stable-`uasort()` order the same method used before INT8-041. | Ties are not reachable — today's four types have distinct weights — and the current behaviour stands unpinned until a fifth type shares one. | left open |
| `S-2` | What actually causes the Composer version-lock errors when applying module and security updates? | The `5.0.x-dev2` brief §2 F scopes goal F (Composer standardisation) around a **diagnosis nobody has verified**. The failing command and its error text have not been seen — the three divergences named in the brief were read off `composer.json` / `composer.lock` during the M10 review and are *consistent with* the symptom, not proven to be its cause. If the real cause is something else (a stale lock, an `allow-plugins` refusal, a contrib constraint), goal F's scope is wrong in a way that only surfaces at M17. | ~~That `drupal/core-recommended` is the primary cause: it pins 45 transitive dependencies, including `drupal/core` at exactly `11.4.2`, which is the textbook source of an unresolvable contrib update. Secondary contributors assumed to be the absent `config.platform.php` and `minimum-stability: dev`.~~ **Superseded — see Resolution.** | **`closed` 2026-08-02**, answered by Gregg pasting the real error from `lando composer update drupal/ctools --with-dependencies`. **Not a dependency conflict at all: Composer's security-advisory policy is refusing to load a vulnerable `drupal/core`.** Every problem reads `found drupal/core[…] but these were not loaded, because they are affected by security advisories`. The site runs **core 11.4.2, affected by `SA-CORE-2026-010` (information disclosure), `-011` and `-012` (XSS); 11.4.4 fixes all three**. `drupal/core-recommended` 11.4.2 requires core at *exactly* 11.4.2, so an update that doesn't name it leaves core pinned to a blocked version and the whole resolve fails. **The assumption was wrong in kind, not just in detail** — `core-recommended` is the mechanism that traps the site on the blocked version, but the *cause* is an unapplied security release, and `config.platform.php` is unrelated. `5.0.x-dev2-brief.md` §2 F rewritten to match. |

---

## 3. When an answer arrives

Work in this order — it is rule 3 made concrete:

1. **Record it** in the row's *Answer* column, with the date and who confirmed it.
2. **Amend the owning `spec/` document** so the confirmed value is the specification, and add a line to
   that document's decisions log saying what changed and why.
3. **Search for the id** (`Q-4`) across `spec/` and the code to find every place built on the assumption.
4. **File a ticket** for the code change if it is more than trivial, citing the id and the amended spec
   section.
5. **Close the row** — keep it in the table with its answer, struck through or marked `closed`. Do **not**
   delete it: the answer and its date are the audit trail of why the code says what it says. (This is the
   opposite of `spec/TODO.md`, which keeps only a one-line tombstone, because there the ticket becomes the
   record.)

If an answer **changes** a value already built on, say so explicitly in the decisions log of the owning
document — a silently-corrected value is indistinguishable from a bug.

---

## 4. Notes log

> Append-only. The most valuable entries record a question's **cost changing** — "answering `Q-1` was
> free in week 1; now that the fixtures are committed it invalidates most of them". That is what keeps a
> deliberate deferral an informed decision rather than an invisible one.

- **2026-08-01** — Register created during the v1.4.0→v1.4.3 kit update. Laid down **empty**: a sweep of
  `spec/` for `(to confirm)` / `TBD` markers found exactly one (`architecture.md` §3.2, "modelling TBD in
  `content-model.md`"), and that is a **stale cross-reference rather than an open question** —
  `content-model.md` §4 settled the Remote-video modelling on 2026-07-07 and revised it at INT8-013. It is
  spec drift for `sfk-verify`, not a row here. Slice 1 has been built against a v2 database the project
  owns outright, so there is no third party to owe us a `Q-n`.
- **2026-08-02** — **First real row, and the template placeholders cleared (INT8-045).** `Q-1`/`Q-2`/`S-1`
  had sat as the kit template's own `<…>` stubs since creation — indistinguishable from real unanswered
  rows to a reader or a `grep`, which is exactly what rule 1's "ids are permanent" is meant to prevent.
  Removed all three (they never named a real question, so no permanent id is actually retired) and used
  the vacated `S-1` for the register's first genuine entry: the `song_type` equal-weight tie-break that
  surfaced during [INT8-041](tickets/INT8-041-type-filter-published-terms.md)'s review, where it was
  correctly identified as unpinned but recorded in the ticket's own notes instead of here. Root
  `CLAUDE.md`'s rule is that recording an unknown needs no permission — INT8-041 did the hard half (noticing
  it, not guessing) right; only its destination was wrong, and this entry is that correction.
- **2026-08-02** — **`S-2` opened during Milestone 10, and it is a caveat that had nowhere to live.** Goal F
  (Composer standardisation) was added to the `5.0.x-dev2` brief on an inferred cause: the failing update was
  never run in front of anyone, so the brief's three named divergences are evidence, not a diagnosis. That
  caveat *was* stated — in the brief's prose and in the chat that produced it — which is exactly the failure
  mode this register exists to stop, because prose has no id and nothing sweeps it. **Cost note:** answering
  it is free right now (reproduce one command) and stays free until M17 writes tickets against the assumed
  cause; from then on a wrong diagnosis invalidates the tickets, not just the sentence.
- **2026-08-02** — **`S-2` answered the same day it was opened, and the assumption was wrong in kind.** The
  register cost nothing and returned a security finding: the site is on Drupal core 11.4.2 with three
  unpatched advisories, one of them a Layout Builder XSS (`SA-CORE-2026-012` / `CVE-2026-55805`) in the
  subsystem this very slice adopts. **This is the case for rule 2** (*an open question never blocks work*)
  **paying for itself in the other direction:** the row did not hold anything up, and it still surfaced the
  finding six milestones before M17 would have. Had the caveat stayed as brief prose — which is what it was
  until the updated `sfk-next-milestone` skill forced a row — nothing would have prompted the question, and
  the diagnosis would have been discovered at M17 with tickets already written against it.
  **The cost note in the entry above proved exact**: answering was one pasted command. Worth remembering
  the shape of it — the assumption was not merely imprecise, it named the wrong *kind* of problem
  (dependency conflict rather than unapplied security release), which no amount of sharpening the wrong
  question would have caught.
