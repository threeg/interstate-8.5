---
id: INT8-033
title: Drop the inert border-style clauses Tailwind's preflight makes vacuous in the Playwright suite
type: task
status: todo
milestone: 9
batch: cleanup
layer: tooling
depends_on: [INT8-015, INT8-027]
implements: []
tests_required: false
estimate: 1
---

## In plain English
A couple of our automated tests check that a border is "solid" as well as visible. Because of how
Tailwind sets up its default styles, *every* element on the page reports "solid" whether it has a
border or not — so that half of the check can never fail and gives false reassurance. This removes the
part that does nothing and leaves the part that actually works, with a note so nobody adds it back.

## Background
Found by the independent test author while writing INT8-031's tests: they went to assert
`border-left-style === 'solid'` on the mobile nav's current-item accent, discovered the assertion was
vacuous, and wrote the test differently — but the existing suite still carries the same inert pattern.

**The cause, verified in the built stylesheet.** `interstate_85/css/app.css` does
`@import "tailwindcss"`, and Tailwind v4's preflight emits `border: 0 solid` against the universal
selector — confirmed present in the compiled output
(`web/themes/custom/interstate_85/css/build/app.css`). So *every* element on every page computes
`border-*-style: solid` with `border-*-width: 0`. Any assertion of the shape
`getComputedStyle(el).borderLeftStyle !== 'none'` is therefore **always true**, and contributes
nothing.

**Where it appears.** `tests/playwright/tests/page-shell.spec.ts`, in the mobile-panel check
(~line 443), which builds its two findings as:

```ts
divider: styles.find((s) => parseFloat(s.borderBottomWidth) > 0 && s.borderBottomStyle !== 'none') ?? null,
accent:  styles.find((s) => parseFloat(s.borderLeftWidth)   > 0 && s.borderLeftStyle   !== 'none') ?? null,
```

In each case the width check is the real discriminator and is correct; the style check is dead weight.

**These tests are not wrong, and this is not urgent.** They pass, and they pass *for the right reason*
— a 0-width border is correctly rejected by the width clause, and the downstream assertions also check
the border's colour is not transparent. Nothing is being missed today. The problem is that the code
*reads* as though it is verifying "solid, not dashed/none", which it is not, so a future reader
(or a future test author, as already happened once) will either trust a check that isn't there or lose
time rediscovering why. It is an honesty-of-the-test-suite issue, which is why it is a cleanup ticket
and not a defect.

## Technical requirements

Test-suite only. **No source, style or behaviour change** — in particular, do **not** try to remove or
override Tailwind's preflight, which is doing its job and is relied on for the reset elsewhere.

1. In `tests/playwright/tests/page-shell.spec.ts`, drop the `borderBottomStyle !== 'none'` and
   `borderLeftStyle !== 'none'` clauses, leaving the width checks (and the existing
   `isVisibleColour(...)` colour assertions) as the real signal.
2. Leave the `borderBottomStyle` / `borderLeftStyle` fields in the `describe()` collector if they still
   aid a failure message; if nothing reads them after step 1, remove them too rather than collecting
   dead data.
3. **Add a short comment where the borders are asserted**, naming Tailwind's preflight
   (`border: 0 solid` on the universal selector) as the reason a `border-*-style` assertion cannot
   discriminate in this codebase, and pointing at width + colour as the checks that can. This is the
   actual deliverable — the trap has now cost two sessions, and a one-line correction without the note
   would leave the next author to rediscover it.
4. Sweep the rest of `tests/playwright/tests/` for the same pattern
   (`grep -n "Style !== 'none'\|Style === 'solid'"`) and apply the same treatment to any other
   occurrence.

Out of scope: any change to `app.css`, to Tailwind's configuration, or to the preflight; the
`page-shell.spec.ts` assertions' *intent* (full-width rows, a real divider between rows, the current
row's accent) — all of which stay exactly as they are.

## Definition of done (acceptance criteria)
- [ ] No assertion in `tests/playwright/tests/` relies on a computed `border-*-style` value to
      distinguish a real border from an absent one.
- [ ] The border checks that remain are width- and colour-based, and still fail if the accent or
      divider is removed — verify by temporarily deleting the `border-left` rule from
      `site-header.css` and confirming the mobile-panel test goes red, then restoring it.
- [ ] A comment at the assertion site explains the preflight trap so it is not reintroduced.
- [ ] `lando playwright` green.
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — this **is** a change to tests, so there is no separate test to write; the
verification is that the suite stays green *and* that the remaining assertions demonstrably still fail
when the thing they check is removed (the DoD's second box, which is the one that matters — a
simplification that quietly weakens a test would otherwise look identical to this one).

Command: `lando playwright`, or scoped:
`lando ssh -s pw -c "cd /app/tests/playwright && npx playwright test page-shell.spec.ts --project=chromium"`
(the `firefox` project cannot launch in the `pw` container — pre-existing gap, recorded in
INT8-018/027/030.)

## Notes
- 2026-07-26 — created. Found by the independent test author while writing INT8-031's tests; they
  avoided the trap in the new tests but the existing suite still carries it. Preflight confirmed
  present in the compiled CSS (`border:0 solid`) before filing, rather than inferred from Tailwind's
  documentation. Filed at the site owner's request.
- Cleanup backlog, straightforwardly: it improves the internal quality of tests that already pass for
  the right reason and changes nothing a user can see (CONVENTIONS §6.6).
