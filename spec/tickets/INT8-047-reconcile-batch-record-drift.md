---
id: INT8-047
title: Reconcile six record drifts left by the INT8-043–046 batch
type: task
status: todo
milestone: 9
batch: cleanup
layer: docs
depends_on: [INT8-044, INT8-045, INT8-046]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Four tickets landed last week and all four did the right thing. But six small statements *about* that
work are now wrong — a ticket that says it ran a test suite it did not run, a note describing a line its
own commit had already rewritten, an index still calling a file empty a day after something was written
into it. Nothing is broken and nobody is misled about what the site does. This corrects the paper trail
so that the next person reading it does not have to work out which half to believe.

## Background

Raised by `sfk-verify` on the INT8-043–046 batch (2026-08-02), with the default gate green: `lando test`
89 tests / 234 assertions, PHPCS 14/14, PHPStan no errors, boundary check 0 violations.
`lando playwright` was not run and was not required — nothing in the batch touches the theme or the song
screens, which is the trigger `spec/verify/verify.md` §1 sets for it.

**No critical findings.** The audit re-derived `i8_services`' dependency list from scratch rather than
trusting [INT8-043](INT8-043-i8-services-media-dependency.md)'s account of it and found the same nine
entries; confirmed `S-1` resolves in both directions; swept the contractual values in `verify.md` §3 and
found no drift; and confirmed [INT8-035](INT8-035-move-entity-queries-out-of-the-theme.md) has not
regressed (no entity queries under `web/themes/custom`). The batch's actual work is correct. All six
findings below are the record lagging one day behind what shipped — the same shape as
[INT8-032](INT8-032-song-type-name-drift.md), [INT8-040](INT8-040-redirect-path-map-deferral-drift.md)
and [INT8-044](INT8-044-architecture-data-model-stale-cells.md) itself.

They are one ticket rather than six because they share one cause. Three of the four tickets were filed on
2026-08-01 and worked on 2026-08-02, and
[INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md) — which changed the definition of done — landed
in between. Each work commit correctly updated its ticket's **`## Definition of done`** line to the new
rule, and each left the *filing-time* prose elsewhere in the same file describing the old one.

| # | Where | What it says | What is true |
|---|---|---|---|
| 1 | [INT8-045](INT8-045-open-questions-register-first-rows.md) `## Tests / verification` | *"**docs-only** exemption … PHPCS coverage of the docblock comes free with the default gate"* | **Pure-styling**, as its own DoD and `## Notes` both say. The diff includes `web/modules/custom/i8_services/src/SongTypeOptions.php`, so it is not docs-only; and the default gate did not run — `lando lint` did. |
| 2 | [INT8-044](INT8-044-architecture-data-model-stale-cells.md) `## Notes` | *"(INT8-046 postdates this ticket's own DoD text above, which still names `lando test`…)"* | Commit `e58d4a2` rewrote that DoD line to *"Gate: docs-only (INT8-046) — no gate required"* in the same change. The note describes a file state its own commit removed. |
| 3 | `BOARD.md` row C19 | *(no prose note)* | Every other cleanup-backlog entry in slice 1 carries a note giving its provenance and why it sits there. C19 is the one entry that fits CONVENTIONS §6.6 least — it amends process and spec documents rather than improving internal quality of shipped code, and it came from a site-owner request, not an `sfk-verify` finding. That reasoning exists only in commit `e2ad5a2`'s message. |
| 4 | [INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md) `## Notes` | *(silent on sequencing)* | Its work commit `157629c` landed while [INT8-043](INT8-043-i8-services-media-dependency.md) was still `in-review`; 043 was finalized afterwards in `8f88344`. Root `CLAUDE.md` requires finalizing before advancing. |
| 5 | `spec/contents.md` line 41 | *"Empty as of slice 1."* (of `open-questions.md`) | [INT8-045](INT8-045-open-questions-register-first-rows.md) put the register's first real row (`S-1`) in it the same day. |
| 6 | `spec/open-questions.md` line 116 (notes log, 2026-08-01) | *"`architecture.md` §3.2, 'modelling TBD in `content-model.md`'"* | It was **§3.1** (*Entities (slice 1)*); §3.2 is *Storage*. [INT8-044](INT8-044-architecture-data-model-stale-cells.md) corrected the cell without correcting this pointer to it. |

**Why finding 1 is the one that matters.**
[INT8-045](INT8-045-open-questions-register-first-rows.md) is the first ticket to use
[INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md)'s rule to actually *shorten* a gate, so it is
the worked example later tickets will copy. It also asserts that the default gate supplied coverage it did
not supply — precisely the class of claim `spec/verify/verify.md` §1 tells the verifier to check rather
than assume, since with no pre-commit hook and no CI nothing gates a commit automatically. The gate choice
itself was right: a docblock cannot change PHPUnit's outcome, and the audit's own `lando test` run on the
current tree (89 tests / 234 assertions, green) confirms it empirically.

**Finding 4 is a process record, not a defect.** Nothing on disk is wrong and commit hygiene held — one
ticket per commit, separate finalizes, no bundling of 043's closure into 046's work. It is recorded so the
deviation is visible rather than re-derived from commit order later.

## Technical requirements

1. **[INT8-045](INT8-045-open-questions-register-first-rows.md) `## Tests / verification`** — change the
   exemption category from *docs-only* to *pure-styling*, and drop the claim that PHPCS coverage came from
   the default gate; name `lando lint` as what actually ran. Do **not** touch its DoD or `## Notes`, which
   are already correct, and do **not** re-run any gate: the audit's `lando test` run has already confirmed
   the code.
2. **[INT8-044](INT8-044-architecture-data-model-stale-cells.md) `## Notes`** — correct the parenthetical
   so it describes what the commit did (rewrote the DoD line to the INT8-046 rule) rather than what the
   file looked like before it. Keep the substantive point — that INT8-046 postdates the ticket's filing —
   which is true and worth keeping.
3. **`BOARD.md`** — add a prose note beneath the cleanup-backlog table for
   [INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md), in the style of the existing notes: where it
   came from (site-owner request immediately after INT8-043, not an `sfk-verify` finding), and why it sits
   in the cleanup backlog despite amending process documents rather than improving shipped code. State the
   CONVENTIONS §6.6 tension plainly rather than glossing it — the kit has no "process ticket" category, and
   the backlog is the pragmatic home, which is the fact worth recording.
4. **[INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md) `## Notes`** — add a line recording that its
   work commit landed while [INT8-043](INT8-043-i8-services-media-dependency.md) was still `in-review`,
   against root `CLAUDE.md`'s *finalize before advancing* rule, and that commit hygiene otherwise held.
   A record, not a correction — nothing is being fixed, and the ticket is `done`.
5. **`spec/contents.md`** — replace *"Empty as of slice 1."* with a description that survives the register
   filling up, rather than one that has to be re-edited at every new row. The file's regeneration note says
   descriptions are preserved verbatim, so write one that stays true.
6. **`spec/open-questions.md`** — correct §3.2 to §3.1 in the 2026-08-01 notes-log entry. A pointer fix
   only; the entry's reasoning is correct and stands. The log is append-only in spirit, so correct the
   reference in place rather than appending a second entry about it.
7. **Sweep the other two tickets in the batch before finishing.**
   [INT8-043](INT8-043-i8-services-media-dependency.md) and
   [INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md) were read during the audit and no drift was
   found in either, but they were not read *for this pattern* specifically — a DoD line updated to the new
   gate rule with filing-time prose left behind. Check both and record the outcome in `## Notes`, including
   "nothing further found" if that is the answer.

Out of scope: re-running any gate (the audit's `lando test` is green on this tree); changing
[INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md)'s rule or any of the four tickets' actual work;
`spec/tickets/TICKET-TEMPLATE.md`'s DoD checklist, which says "the default gate" generically and is
conditioned on "or exemption stated below" — checked during the audit and consistent with INT8-046 as it
stands.

## Definition of done (acceptance criteria)
- [ ] [INT8-045](INT8-045-open-questions-register-first-rows.md)'s `## Tests / verification` names
      pure-styling and `lando lint`.
- [ ] [INT8-044](INT8-044-architecture-data-model-stale-cells.md)'s `## Notes` parenthetical describes the
      commit's own change.
- [ ] `BOARD.md` carries a provenance note for [INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md).
- [ ] [INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md)'s `## Notes` records the two-tickets-open
      sequencing deviation.
- [ ] `spec/contents.md`'s `open-questions.md` description no longer says the register is empty, and is
      written so it stays true as rows are added.
- [ ] `spec/open-questions.md`'s 2026-08-01 notes-log entry cites §3.1.
- [ ] [INT8-043](INT8-043-i8-services-media-dependency.md) and
      [INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md) swept for the same filing-time-prose
      pattern, outcome recorded in `## Notes`.
- [ ] Gate: docs-only (INT8-046) — no gate required; state so in `## Notes`.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: false` — **docs-only** exemption. Every change is to `spec/**` prose and ticket files;
nothing under `web/` or `tooling/` is touched, so under
[INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md)'s rule no gate needs to run. Stated here rather
than silently skipped.

Sanity check that findings 5 and 6 are closed — both stale strings should be gone:

```
grep -n "Empty as of slice 1" spec/contents.md
grep -n "§3.2" spec/open-questions.md
```

→ expected: no matches from either.

## Notes
- 2026-08-02 — created by `sfk-verify` on the INT8-043–046 batch, default gate green (89 tests / 234
  assertions, PHPCS 14/14, PHPStan no errors, boundary 0 violations); `lando playwright` not required, no
  theme or song-screen files in the batch. No critical findings. Cleanup backlog rather than main sequence:
  nothing a user can see changes and no gate fails (CONVENTIONS §6.6). Not a specification change (§5.5) —
  no decision is reopened or made; every correction propagates a decision already settled elsewhere.
  Filed as one ticket rather than the three originally drafted, at the site owner's direction: the six
  findings share one cause (filing-time prose left behind when INT8-046 changed the definition of done
  mid-batch), and three tickets would have been more ceremony than six one-line corrections earn.
