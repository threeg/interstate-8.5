---
id: INT8-033
title: Drop the inert border-style clauses Tailwind's preflight makes vacuous in the Playwright suite
type: task
status: done
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
- [x] No assertion in `tests/playwright/tests/` relies on a computed `border-*-style` value to
      distinguish a real border from an absent one.
- [x] The border checks that remain are width- and colour-based, and still fail if the accent or
      divider is removed — verify by temporarily deleting the `border-left` rule from
      `site-header.css` and confirming the mobile-panel test goes red, then restoring it.
- [x] A comment at the assertion site explains the preflight trap so it is not reintroduced.
- [x] `lando playwright` green.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

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
- 2026-07-28 — **implemented.** Dropped the vacuous `border-*-style !== 'none'` clauses at two sites
  in `page-shell.spec.ts`: `underlineColour()`'s bottom-border check (~line 83, found by step 1's own
  sweep since it matches the same background pattern even though the ticket's Background section only
  named the mobile-panel case) and the mobile-panel `divider`/`accent` `find()` predicates (~lines
  442-443). Removed the now-dead `borderBottomStyle`/`borderLeftStyle` fields from the mobile-panel's
  local `describe()` collector (nothing read them after the clause was dropped); left the top-level
  `BoxStyle`/`boxStyleOf` `borderBottomStyle` field alone since it is read via `JSON.stringify` in a
  failure message. Left `BoxStyle`'s already-unused `borderLeftWidth`/`borderLeftStyle`/`borderLeftColor`
  fields alone — pre-existing dead collection unrelated to this ticket's border-*-style trap, out of
  scope. Added a comment naming the preflight cause at both edited sites. Step 4's sweep
  (`grep -n "Style !== 'none'\|Style === 'solid'" tests/playwright/tests/`) also matches `outlineStyle`
  checks in `page-shell.spec.ts` and `songs-landing.spec.ts` — left untouched: preflight's
  `border: 0 solid` reset does not touch `outline-style` (confirmed in the compiled CSS; the only
  `outline-style` rule is the `.outline` utility class's own, scoped to elements that use it), so those
  checks are genuine discriminators, not the same trap.
  **DoD's regression check, performed live:** temporarily deleted `border-left: 3px solid
  var(--color-accent);` from `site-header.css`, rebuilt (`lando npm run build`), cleared the Drupal
  cache (`lando drush cr` — the aggregated CSS was cached and the first re-run without it still passed,
  which would have been a false confidence otherwise), and re-ran the mobile-panel test: it correctly
  went red (`current row "Songs" has no left-border accent`). Restored the rule, rebuilt, cleared cache
  again; `git status` / `git diff --stat` confirmed `site-header.css` and the compiled `app.css` came
  back byte-identical, so no stray build artifact.
  Verification: full `lando playwright` — **545/545 passed**.
  **Sanity test:** `lando ssh -s pw -c "cd /app/tests/playwright && npx playwright test
  page-shell.spec.ts --project=chromium -g 'open mobile nav panel'"` → 1 passed.
