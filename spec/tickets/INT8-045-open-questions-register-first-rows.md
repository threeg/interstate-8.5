---
id: INT8-045
title: Clear the open-questions template rows and record the song-type weight tie-break as `S-1`
type: task
status: done
milestone: 9
batch: cleanup
layer: docs
depends_on: [INT8-041]
implements: []
tests_required: false
estimate: 1
---

## In plain English
We keep a register of things we are building against but have not confirmed. It was created a few days
ago and still contains only its own example rows — fill-in-the-blank placeholders that look like real
entries. Meanwhile a genuine unknown surfaced during the last ticket and was written into that ticket's
notes as a question for the site owner instead of into the register. Empty the placeholders and put the
real one in, so the register starts holding what it is for.

## Background

Raised by `sfk-verify` on the INT8-038–042 cleanup batch (2026-08-01). Two halves of one problem, which
is why they are one ticket.

**Half 1 — the register still holds its template rows.** `spec/open-questions.md` was laid down empty at
the v1.4.3 kit update, but "empty" means its §1 and §2 tables still carry the template's own example
rows: `Q-1` and `Q-2` in §1, `S-1` in §2, each a literal `<One plain sentence. No ids, no file names, no
jargon.>` stub. The file's own **rule 1** is that ids are permanent and never reused — so the first real
question either overwrites an id the rules call permanent, or starts at `S-2` and leaves `S-1`
permanently meaning a placeholder. `sfk-verify`'s leftovers check treats placeholder text left in a
live document as a finding for exactly this reason: a stub in a register is indistinguishable, to `grep`
and to a reader, from a row nobody has answered yet.

**Half 2 — a real question was raised and deliberately not recorded.** INT8-041's `## Notes` says:

> *"One open question flagged by the test-writer and left genuinely unresolved rather than guessed:
> equal-weight tie-break order is unpinned by the ticket, FR-9, or `content-model.md` §9 … Not opened as
> an `S-n`/`Q-n` row: it isn't blocking anything this ticket does, and filing it against a hypothetical
> future term felt premature — flagging it here for the user to decide whether it's worth a row now or
> when it actually matters."*

Root `CLAUDE.md` settles that: *"When you and the user are both guessing, record it — don't ask first …
**add a row** to `spec/open-questions.md` as you go … do not wait to be asked."* Recording an unknown
needs no permission; it is `spec/TODO.md` — parking *work* — where the offer-and-wait rule applies. The
reasoning given (not blocking, hypothetical) is the case the register's **rule 2** already answers: an
open question never blocks work, which is why recording one is cheap.

**And it is not purely hypothetical — the tie-break moved.** Before INT8-041, `getTerms()` loaded terms
and ordered them with `uasort()`, which is **stable** as of PHP 8.0, so equal weights kept the load order
(effectively term id). After INT8-041 the ordering is `->sort('weight')` inside an entity query, so equal
weights are resolved by whatever order the database returns. Today's four `song_type` terms have distinct
weights, so nothing renders differently — but the rule that decides a tie changed hands from PHP to
MariaDB without being written down anywhere, which is precisely the "assumption baked in with no row"
case the register exists to catch.

## Technical requirements

1. **Remove the three template rows** (`Q-1`, `Q-2` from §1; `S-1` from §2) from
   `spec/open-questions.md`. Leave each table with its header row and no body rows, so an empty register
   reads as empty. The template's example content is preserved in `.sfk/templates/` and in the file's own
   surrounding guidance, so nothing is lost — do **not** copy it into an HTML comment "for reference".
2. **Add the real `S-1`** to §2, taking the id the placeholder vacates (it never named a real question, so
   rule 1's permanence is not engaged — say so in the decisions/notes trail rather than leaving the reader
   to wonder). Content:
   - **Question:** when two `song_type` terms share a weight, what decides which the Type filter offers
     first?
   - **Why it matters:** `SongTypeOptions::getTerms()` sorts on weight alone, so a tie is resolved by the
     database's returned order — undefined, and different from the stable-`uasort()` order the same method
     used before INT8-041.
   - **What we assume for now:** ties are not reachable — today's four types have distinct weights — and
     the current behaviour stands unpinned until a fifth type shares one.
   - **Resolution:** left open.
3. **Cite the id where the assumption lives** (register rule 5): a short reference to `S-1` in
   `SongTypeOptions::getTerms()`'s docblock beside the `->sort('weight')` call, so a search for `S-1`
   finds the code the day the answer arrives. This is the ticket's only code touch and it is a comment.
4. **Add a dated entry to §4's notes log** recording that the register's first real row arrived from
   INT8-041's review, and that the three template rows were cleared at the same time.
5. **Do not** change `SongTypeOptions`' behaviour, add a tie-break rule, edit `requirements.md` (FR-9 is
   silent on ordering and is not being amended), or open a `Q-n` — there is no third party to ask; this
   is ours.

Out of scope: deciding the tie-break itself (that is what the row records as open); the Type filter's
matching behaviour (INT8-032, unchanged); term weights in the exported vocabulary config; `spec/TODO.md`,
which is a different file with different rules.

## Definition of done (acceptance criteria)
- [x] `spec/open-questions.md` §1 and §2 contain no template placeholder rows.
- [x] §2 carries a real `S-1` for the equal-weight tie-break, with all four columns filled in the
      register's own plain-language register.
- [x] `SongTypeOptions::getTerms()` cites `S-1` in a comment beside the weight sort.
- [x] §4's notes log carries a dated entry covering both halves.
- [x] Gate: pure-styling (INT8-046) — `lando lint` green, zero warnings; see `## Notes`.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: false` — **docs-only** exemption. The one code edit is a docblock comment citing an id;
it changes no behaviour and there is nothing to assert. PHPCS coverage of the docblock comes free with
the default gate.

Sanity check that rule 5 now holds — the id resolves in both directions:

```
grep -rn "S-1" spec/open-questions.md web/modules/custom/
```
→ expected: the register row, and the `SongTypeOptions` comment. Nothing else.

## Notes
- 2026-08-01 — created by `sfk-verify` on the INT8-038–042 cleanup batch, with both gates green.
  Cleanup backlog rather than main sequence: nothing a user can see changes and no gate fails
  (CONVENTIONS §6.6). Filed as one ticket rather than two because the second half supplies the row the
  first half makes space for — clearing the placeholders without a real entry would leave the same
  ambiguity, and adding the row without clearing them would put a real `S-1` beside a stub `S-1`.
  Worth naming plainly for the record: INT8-041 did the hard half right — it noticed the unpinned value,
  resisted guessing it, and wrote down exactly what was unknown. Only the destination was wrong.
- 2026-08-02 — implemented. Removed `Q-1`/`Q-2`/`S-1`'s template stub rows from §1/§2 (each table now
  header-only); none named a real question, so no permanent id was actually retired. Added the real
  `S-1` (`song_type` equal-weight tie-break) to §2 with all four columns filled from this ticket's own
  content, and a dated §4 notes-log entry covering both halves. Cited `S-1` in
  `SongTypeOptions::getTerms()`'s docblock beside the `->sort('weight')` call. Also updated the
  register's own header "Last updated" line, which still read "no rows yet."

  **Gate: pure-styling under [INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md).** The only code
  touch is a docblock comment (no logic change, PHPUnit's outcome provably unaffected), so `lando lint`
  — not the full `lando test` — is the required gate here: PHPCS 14/14, PHPStan no errors, boundary
  check 0 violations, all in ~4 seconds instead of the ~10+ minutes a full run would add. Second use of
  INT8-046's rule, and the first time it actually shortened a ticket rather than confirming the full gate
  was still required (as it did for INT8-044).

  Sanity check run: `grep -rn "S-1" spec/open-questions.md web/modules/custom/` → resolves in both
  directions (the register row, the code comment), nothing else.
