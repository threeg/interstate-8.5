---
id: INT8-021
title: E2E capstone (Playwright + Axe)
type: task
status: in-review
milestone: 9
batch: theme
layer: tooling
depends_on: [INT8-018, INT8-019, INT8-020]
implements: [NFR-1, NFR-2, NFR-7, NFR-8]
tests_required: true
estimate: 3
---

## In plain English
One final pass that drives the finished Songs section like a real visitor across browsers and phone
sizes — proving it works end to end and is accessible — before we call the slice done.

## Background
Reconciles the assembled screens (test strategy §7/§9). The per-screen tickets carry their own tests;
this consolidates the journeys, the a11y sweep, and the browser/responsive matrix.

## Technical requirements
- Playwright **journeys**: front page → `/songs` → filter → open a song → open its alternate version.
- **Axe** on the landing and song page: no serious/critical WCAG 2.1 AA violations (NFR-1).
- **Responsive** run at **320px** and desktop (NFR-2); **browser matrix** per the Playwright project
  config (NFR-8).
- Wire into `lando playwright` / `lando test-all` (milestone-completion gate).

## Definition of done (acceptance criteria)
- [x] The journey suite passes; Axe clean on both screens (NFR-1).
- [x] 320px + desktop pass (NFR-2); the configured browser matrix runs (NFR-7/NFR-8) — all projects green
      except the pre-existing, documented firefox-in-`pw`-container gap (see Notes).
- [x] `lando test-all` green (default gate + Playwright, same caveat).
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true`. This ticket **is** the e2e/a11y verification. Confirms the assembled slice
against NFR-1/2/7/8. Test strategy §7, §9.

## Notes

**2026-07-27 — implemented, in review.**

Added `tests/playwright/tests/e2e-journey.spec.ts`, written independently (per the project's
independent-test-authorship convention) from the ticket + spec only, with every fixture re-verified
against the live migrated dataset. It drives one continuous browser session — front page → click the
primary nav's "Songs" link (opening the ☰ panel first at 320px) → operate the Type filter control
(widen to All, narrow to Modest Mouse) → click a real song in the filtered ledger → click through to
one of its real alternates → confirm the link back to the parent — at both desktop and 320px, plus a
confirmatory Axe pass on the two states no per-screen suite has scanned (a landing just filtered
through the form; a song page reached by clicking). Every hop after the first is a real click/form
interaction, not `page.goto()`; each step asserts it landed on the right path *and* the right `<h1>`.
NFR-7's four-item minimum (list-as-links, Type filter narrows, landing→song navigation, song page core
content) is covered by this journey plus the existing per-screen suites — no gap found.

Running the full configured browser matrix (`lando playwright`, not just `--project=chromium`) for the
first time on this project surfaced a real, pre-existing gap unrelated to this ticket's own code: a test
in `front-page-nav.spec.ts` ("the filtered Songs URL draws the same current-section underline...")
asserted a desktop-only underline treatment without pinning a desktop viewport, so it failed on
`mobile-chrome`/`mobile-safari` (Pixel 5 / iPhone 12 default below the nav breakpoint, where
current-section uses a left-border accent instead — `page-shell.spec.ts` already pins desktop
explicitly for the same reason). Fixed by pinning the same `{ width: 1280, height: 800 }` viewport that
file's own desktop-treatment checks use. This is a one-line fix to a pre-existing test's viewport
assumption, not new application behaviour.

`firefox` fails across the whole suite in the `pw` container with
`browserType.launch: ENOENT: no such file or directory, stat '/ms-playwright/firefox-1532/firefox/lock'`
— the same pre-existing, documented environmental gap present since scaffolding (missing firefox binary
in that container), not a regression from this ticket. All other 4 projects (chromium, webkit,
mobile-chrome, mobile-safari) are fully green: 436/436.

`lando test` (default gate: PHPUnit 58/58, PHPCS 0, PHPStan 0, boundary check 0 violations) passes.

**Summary:** one new Playwright spec proves the finished Songs section works as a continuous visitor
journey — real clicks and form interactions across screens, not just per-screen checks — and is
accessible at that composed state, across every browser project except the pre-existing
firefox-in-container gap.

**Sanity test:** `lando ssh -s pw -c "cd /app/tests/playwright && npx playwright test e2e-journey.spec.ts --project=chromium --reporter=list"` — 3/3 pass.

## QA steps

1. Visit the front page at desktop width; click "Songs" in the primary nav → lands on `/songs`.
2. Set the Type filter to "All", confirm the ledger widens; set it to "Modest Mouse", confirm it narrows
   and the Covers-only song ("Careless Whisper [Wham!]") disappears.
3. Click "Perpetual Motion Machine" in the ledger → lands on its song page with its lyrics visible.
4. Click through to its alternate "Here Comes Trouble" → lands on the alternate's page with its own
   lyrics, and a link back to "Perpetual Motion Machine" is present.
5. Repeat at a 320px viewport: the ☰ panel opens the nav; no page in the journey scrolls horizontally.
