---
id: INT8-040
title: Qualify the v2→v5 redirect path-map claim in api-contract.md and architecture.md §6
type: task
status: done
milestone: 9
batch: cleanup
layer: docs
depends_on: [INT8-011]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Our own documents disagree about whether old interstate-8.com links still work. Two of them say the
old-to-new link map was built during the import; two others say that job was deliberately put off
until a later round of work. The second pair is what actually happened. Fix the first pair so nobody
plans against a promise the site does not keep.

## Background

Raised by `sfk-verify` on the cleanup batch (2026-07-28). Four places in the binding spec describe the
same thing two different ways:

**Says it is delivered (unqualified):**

| Document | Text |
|---|---|
| `spec/architecture/api-contract.md` §1 (Conventions) | *"Clean URLs via **Pathauto**, with **Redirect** preserving the v2→v5 path map at migration (link equity)."* |
| `spec/architecture/architecture.md` §6 (stack table, `URLs` row) | *"Preserve the v2→v5 path map at migration (link equity)."* |

**Says it is deferred:**

| Document | Text |
|---|---|
| `spec/architecture/architecture.md` §3.3 item 2 | *"…Building these redirects is **deferred to a future SEO slice**; slice 1 captures only the enabling `field_legacy_id`."* |
| `spec/architecture/content-model.md` (legacy-id rationale) | *"…the redirect **build is deferred to a future SEO slice**; slice 1 captures the field only."* |

**The deferred pair is correct.** Verified live: the `redirect` table holds **10** rows against 492
songs, and those are the Redirect module's own automatic entries created when a node's URL alias
changed — not a v2 path map. No ticket implements one, no `FR`/`NFR` covers one, and the BOARD's
traceability table has no row for it.

**Why this matters more than a typo.** `api-contract.md` opens by stating that *"where code and this
contract disagree on these shapes, the contract wins"* — so it is precisely the document that must not
assert unbuilt behaviour. A later session reading §1 would reasonably conclude legacy URLs already
resolve and skip building them. This is the same class of drift INT8-032 was filed for (one fact
spelled two ways across the spec), with a higher cost because of which document carries it.

## Technical requirements

1. **`api-contract.md` §1** — qualify the Redirect clause so it states the slice-1 position: Pathauto
   provides the clean URLs today; the v2→v5 redirect *build* is deferred to a future SEO slice, with
   `field_legacy_id` captured now as the enabler. Cross-reference `architecture.md` §3.3 rather than
   restating its reasoning.
2. **`architecture.md` §6** — same qualification on the `URLs` row's rationale cell. Keep it to the
   width the table's other rows use; the full reasoning already lives in §3.3 directly above it.
3. **Add a dated entry to `content-model.md` §9's decisions log** recording that the four sites were
   reconciled on the deferred reading, and *why* that is the correct one (no ticket, no requirement, 10
   incidental rows in the `redirect` table) — so a future reader finds the resolution rather than
   re-deriving it from the same four documents.
4. **Do not** change the deferral itself, add a redirect ticket, or touch `field_legacy_id`. The
   decision to defer stands; only the record is wrong.

Out of scope: building the redirects (a future SEO slice — no ticket, and none is being filed here);
the 10 existing alias-change redirects (correct, automatic, leave them); the Redirect module's
installation (INT8-003, correct).

## Definition of done (acceptance criteria)
- [x] All four sites read consistently on the deferred position, verified by re-reading each one, not
      by grep alone.
- [x] `api-contract.md` §1 no longer asserts a path map that does not exist.
- [x] `content-model.md` §9 carries a dated entry recording the reconciliation and its evidence.
- [x] `lando test` green with zero warnings (no code change expected).
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: false` — **docs-only** exemption: this changes binding prose to match shipped
behaviour, with no code, config or numbered-requirement behaviour touched.

Evidence to re-confirm before editing (so the ticket is acted on against facts, not against this
ticket's account of them):

```
lando drush php:eval 'echo \Drupal::database()->query("SELECT COUNT(*) FROM {redirect}")->fetchField() . PHP_EOL;'
```
→ expected: a small number (10 at filing), i.e. incidental alias-change entries, not ~492.

## Notes
- 2026-07-28 — created by `sfk-verify` on the cleanup batch (INT8-023–026, 032–037). Found during the
  contract-conformance pass by checking the api-contract's §1 conventions against the live site rather
  than only its §2 routes. Cleanup backlog rather than main sequence: it is an internal-consistency
  fix to a decision that is already made and already correctly implemented — nothing a user can see
  changes (CONVENTIONS §6.6). It is deliberately **not** treated as a specification change (§5.5): no
  decision is being reopened or made here, the deferral already exists in two documents and this only
  propagates it to the other two.
- 2026-08-01 — implemented. Re-confirmed the evidence before editing (`redirect` table: 10 rows,
  unchanged since filing). Qualified `api-contract.md` §1 and `architecture.md` §6 to state the slice-1
  position (Pathauto delivers clean URLs now; the v2→v5 path map build is deferred to a future SEO
  slice, cross-referencing `architecture.md` §3.3 rather than restating it) and added the dated
  reconciliation entry to `content-model.md` §9. `architecture.md` §3.3 and `content-model.md`'s
  legacy-id rationale were already correct and are unchanged, per the ticket. **Found and fixed a fifth
  occurrence of the same drift** not named in the ticket's four-site table: `api-contract.md` §4's
  traceability row (*"URL aliases / redirects | (migration path-map; NFR support)"*) made the identical
  unqualified claim — left uncorrected, it would have reproduced the exact defect this ticket exists to
  fix a few lines below its own §1 fix. Reworded to name only what's delivered (Pathauto URL aliases).
  `lando test` green, zero warnings, no code touched. No spec amendment owed beyond this ticket's own
  edits — this *is* the amendment, not a change requiring a further one.
- 2026-08-01 — done (reviewed).
