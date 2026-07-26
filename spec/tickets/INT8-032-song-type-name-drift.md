---
id: INT8-032
title: Reconcile the "Side Projects" song-type name across the spec, and pin the filter's case-sensitivity
type: task
status: todo
milestone: 9
batch: cleanup
layer: docs
depends_on: [INT8-008, INT8-018]
implements: [FR-9]
tests_required: false
estimate: 1
---

## In plain English
One of the song categories is written two different ways across our own documents — "Side Projects" in
one place and "Side projects" in another. The site itself works either way, so nothing is visibly
broken; the risk is that the documents disagree about what the category is actually called, and the
one that's wrong is the one describing what the filter accepts. This makes them agree, and writes down
whether the filter is meant to care about capitalisation at all.

## Background
Spotted while writing INT8-031's tests: the independent test author found that
`api-contract.md` §2.1 and `songs-landing.spec.ts` spell the type differently, and reported it as
"api-contract is wrong". **It is the other way round**, which is why this ticket exists rather than a
one-word edit — the drift was verified against the live content before filing:

The real taxonomy term, as created by INT8-008 and migrated by INT8-012, is **`Side Projects`** (capital
P), confirmed by loading the `song_type` vocabulary:
`Modest Mouse | Ugly Casanova | Side Projects | Covers`.

Against that, the spec is split:

| Source | Spells it | Correct? |
|--------|-----------|----------|
| The `song_type` taxonomy (live content) | `Side Projects` | — this is the fact |
| `spec/architecture/api-contract.md` §2.1 (line ~35) | `Side Projects` | ✅ |
| `spec/requirements/requirements.md` (line ~53, the type table) | `Side projects` | ❌ |
| `spec/wireframes/overview.md` (line ~67) | `Side projects` | ❌ |
| `tests/playwright/tests/songs-landing.spec.ts` (`TYPE.sideProjects`, line ~36) | `Side projects` | ❌ |

**Why nothing is failing today, and why that is itself the finding.** The Songs filter is
*case-insensitive*, so `?type=Side%20projects` and `?type=Side%20Projects` both return the same 175
results — verified with both URLs. That is what has kept the drift invisible: the Playwright suite
passes with the wrong-cased constant, so no test catches it.

But `api-contract.md` §2.1 also states that *"an unrecognized value yields zero results (FR-19), not a
silent fallback to the default"* — and case-insensitivity means `Side projects` **is** recognised. So
the contract is currently silent on a behaviour the implementation has: whether type matching is
case-sensitive is not written down anywhere, it is simply what
`interstate_85_preprocess_views_view__songs()` and the View's filter happen to do. A future change to
either could silently break URLs that are in the wild.

> **Note on requirements.md's own hedge.** The type table there closes with *"The definitive type list
> is confirmed against the dump in Milestone 3; the set above is the working list."* Milestone 3 has
> since happened (INT8-012 migrated the terms), so the working list should now simply be replaced by
> the confirmed one — this ticket is the moment that hedge gets discharged.

## Technical requirements

Documentation and test-constant only. **No behaviour change**, and specifically no change to the View,
its filters, the preprocess, or the taxonomy itself — the live term name is the fact everything else is
being reconciled *to*.

1. **Correct the two drifting spec documents** to `Side Projects`:
   - `spec/requirements/requirements.md` — the song-type table (~line 53), and discharge the
     "working list / confirmed in Milestone 3" hedge beneath it now that the migration has run.
   - `spec/wireframes/overview.md` — the song-types line (~line 67).
   Leave `api-contract.md` §2.1 alone; it is already right.
2. **Correct `TYPE.sideProjects` in `tests/playwright/tests/songs-landing.spec.ts`** to `Side Projects`.
   The constant is currently relying on case-insensitive matching without saying so.
3. **Pin the case-sensitivity in `api-contract.md` §2.1**, next to the existing "unrecognized value
   yields zero results" sentence — state explicitly whether `type` matching is case-insensitive, and
   note that the canonical values are the `song_type` term names. Confirm the actual behaviour first
   (both the View's filter *and* the preprocess's `mb_strtolower()` comparison for the selected-option
   state, which are two separate matches and could disagree) rather than asserting it from this
   ticket's text.
4. **If — and only if — step 3 finds the two matches disagree** (e.g. the View filters
   case-insensitively but the dropdown fails to mark the current option, or vice versa), that is a real
   defect rather than a documentation gap: stop, record the finding in `## Notes`, and raise it as its
   own ticket rather than widening this one.

Out of scope: making the filter case-*sensitive* (that would break in-the-wild URLs for no user
benefit); any other term name; the `alt` parameter; adding a test for case-insensitivity — see below.

## Definition of done (acceptance criteria)
- [ ] `requirements.md`, `wireframes/overview.md` and `songs-landing.spec.ts` all say `Side Projects`,
      matching the live term and `api-contract.md`.
- [ ] `requirements.md`'s "working list, confirmed in Milestone 3" hedge is discharged.
- [ ] `api-contract.md` §2.1 states the `type` parameter's case-sensitivity explicitly, verified
      against both the View filter and the preprocess comparison rather than assumed.
- [ ] `grep -rin "side projects" spec/ tests/` returns no lower-case-p occurrence outside this
      ticket's own history.
- [ ] `lando playwright` still green — the corrected constant must exercise the same 175 results.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — **docs-only**, plus one test *constant* corrected. No behaviour changes, so
there is nothing new to assert; the existing Songs filter tests already cover the parameter and must
stay green with the corrected value, which is the verification.

Deliberately **not** adding a test that pins case-insensitivity. Doing so would freeze an accident of
the current implementation into the contract from the test side, which is backwards: step 3 writes the
decision into `api-contract.md` first. If that decision turns out to be worth enforcing, the test
belongs in the ticket that makes it, not this one.

Verify with:
`for c in "Side%20Projects" "Side%20projects"; do curl -s "http://interstate-8-5.lndo.site/songs?type=$c" | grep -o 'song-ledger__count">[0-9]* result'; done`
→ both report the same count (175 at the time of filing).

## Notes
- 2026-07-26 — created. Found by the independent test author while writing INT8-031's tests, and
  **reported with the direction reversed** ("api-contract.md is wrong"); checking the live taxonomy
  before filing showed `api-contract.md` is the one that is right and two other spec documents plus a
  test constant are wrong. Filed at the site owner's request.
- Cleanup backlog rather than the main sequence: this improves the internal consistency of already-shipped,
  already-correct behaviour and changes nothing a user can see, which is exactly what CONVENTIONS §6.6
  reserves the backlog for — the opposite of the reasoning that put INT8-027/029/031 in the main
  sequence.
