---
id: INT8-046
title: Scope the definition-of-done gate to what a ticket's diff actually touches
type: task
status: todo
milestone: 9
batch: cleanup
layer: docs
depends_on: [INT8-042]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Every ticket currently has to run the full test suite before it can be reviewed, even one that only
adds a single line to a module's dependency list. Most of that ticket's time was the test suite, not the
change. This says which check a ticket actually needs, based on what its diff touches rather than what
kind of ticket it claims to be — so a docs-only change skips the suite entirely, a styling change gets
the fast version, and anything that could actually break something still gets the full one.

## Background

Requested by the site owner immediately after INT8-043 (declaring `i8_services`' missing `drupal:media`
dependency), which spent roughly 17 of its wall-clock minutes on a single `lando test` run — mostly
PHPUnit (~10 min) plus a slow PHPStan pass — to verify a one-line `.info.yml` change.

INT8-042 already addressed the *iteration* cost by adding `lando lint` (PHPCS + PHPStan + the boundary
check, no PHPUnit) as a fast dev-loop tool, but explicitly kept it out of the definition of done: "a
ticket still needs a clean `lando test` before it reaches `in-review`," full stop, no exceptions. That
blanket rule is what this ticket narrows.

**Why not just let every `tests_required: false` ticket use `lando lint`.** That was the first version of
this idea and it's wrong: `tests_required: false`'s three exemptions (docs-only, pure-styling,
build-plumbing — CONVENTIONS.md §4's row) are not equally safe to skip PHPUnit for. INT8-043 itself is
build-plumbing, and a wrong or missing module dependency is exactly the defect class PHPUnit's Kernel
tests exist to catch — a module that fails to install/boot correctly because a real dependency isn't
declared. PHPCS/PHPStan cannot see that; only actually booting the module (which `lando lint` doesn't do)
can. Scoping by category would have let INT8-043 skip the exact check that class of change needs.

**The right axis is what the diff touches, not what the ticket is labelled.** A ticket that changes
nothing under `web/` or `tooling/` — pure `spec/**` or ticket-file prose — cannot be affected by
PHPCS/PHPStan/PHPUnit no matter what they're told to check, because none of them look at those paths. A
ticket that changes only formatting/comments/docblocks cannot change PHPUnit's outcome, so PHPCS/PHPStan
(i.e. `lando lint`) is the whole relevant check. Everything else — behaviour, and specifically any
`.info.yml`/`.services.yml`/routing change — keeps the full gate, because that is where the real risk
lives.

## Technical requirements

1. Amend root `CLAUDE.md`'s *Definition of done (implementation tickets)* section: replace the blanket
   "the default gate passes with zero warnings" with the three-way scope by diff (docs-only → no gate;
   pure-styling → `lando lint`; everything else including build-plumbing → full `lando test`), stated as
   following the diff, not the ticket's stated category.
2. Amend the `lando lint` bullet in root `CLAUDE.md`'s *Commands* section to reflect that it now
   satisfies the definition of done for pure-styling tickets, while stating plainly that it still does
   not substitute for `lando test` on anything build-plumbing or behavioural.
3. Amend `spec/test-strategy/test-strategy.md` §9 (*Definition of done*, which states it is "kept in
   sync with root `CLAUDE.md`") to match, and add a dated entry to §11 (*Decisions log*) recording this
   as a narrowing of INT8-042's original "never substitutes" rule, with the reasoning above.
4. No code changes. This ticket's own diff is docs-only under the rule it introduces — see *Tests /
   verification*.

Out of scope: changing `tooling/run-lint.sh` or `tooling/run-tests.sh` themselves (INT8-042's scripts are
correct as they are); any change to `tests_required`'s three exemption categories (CONVENTIONS.md §4),
which govern whether a *new* test must be written test-first and are orthogonal to which gate a ticket's
existing behaviour is checked against.

## Definition of done (acceptance criteria)
- [ ] Root `CLAUDE.md`'s *Definition of done* section states the three-way scope (docs-only / pure-styling
      / everything else) and that it follows the diff, not the ticket's category.
- [ ] Root `CLAUDE.md`'s `lando lint` bullet reflects the narrowed rule.
- [ ] `spec/test-strategy/test-strategy.md` §9 matches, and §11 has a dated decisions-log entry.
- [ ] Ticket status + notes and `BOARD.md` row updated in the same commit.

## Tests / verification

`tests_required: false` — **docs-only** exemption: this ticket's diff is confined to `spec/**` and root
`CLAUDE.md`, nothing under `web/` or `tooling/`. Under the very rule this ticket introduces, that means
**no gate needs to run at all** — stated here rather than silently skipped, since "which gate did this
ticket run" is exactly what a reviewer would otherwise have to reconstruct.

Sanity check: re-read the amended root `CLAUDE.md` *Definition of done* section and confirm it would have
told the previous session to run the full `lando test` on INT8-043 (a build-plumbing/`.info.yml` change)
and would tell a future purely-cosmetic docblock-wording ticket it needs only `lando lint`.

## Notes
- 2026-08-02 — created and implemented in the same sitting, at the site owner's request immediately
  after INT8-043 (17 minutes of wall-clock time, almost all of it one `lando test` run, to verify a
  single-line `.info.yml` addition). Filed as its own ticket rather than an ad hoc edit, to keep the
  one-ticket-at-a-time paper trail intact — the same reasoning INT8-042 itself was filed under.
  Considered and rejected the simpler "any `tests_required: false` ticket may use `lando lint`" rule:
  INT8-043 is `tests_required: false` (build-plumbing) and is exactly the class of change PHPUnit's
  Kernel tests protect against, so that version would have removed real coverage, not just redundant
  ceremony. The diff-scoped version keeps INT8-043 on the full gate while freeing genuinely inert
  changes (docs, pure styling). Not a specification change in the "reopening a decision" sense (root
  `CLAUDE.md` *Non-negotiables*) — narrows INT8-042's stated rule at the same user's request, with the
  reasoning recorded here and in the test-strategy decisions log rather than silently.
