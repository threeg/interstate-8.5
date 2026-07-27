---
id: INT8-030
title: Make the song ledger's letter rail a real jump-to-letter navigation
type: task
status: done
milestone: 9
batch: theme
layer: theme
depends_on: [INT8-029]
implements: []
tests_required: true
estimate: 2
---

## In plain English
The A–Z strip down the side of the songs list currently just sits there — it tells you which letters
have songs, but clicking one does nothing. This makes it work the way everyone expects: click (or
tab to and press Enter on) a letter and the page jumps straight to that letter's section of the list.

## Background
INT8-018 built the Songs landing's ledger with a letter rail; INT8-029 fixed which bucket each song
falls into, added the trailing `#` catch-all, and made the rail actually stick while scrolling. Both
left the rail **decorative**: `song-ledger.twig` renders it as

```twig
<div class="song-ledger__rail" aria-hidden="true">
  {% for letter in rail_letters %}
    <span class="song-ledger__rail-letter{{ letter.present ? ' is-present' : '' }}">{{ letter.letter }}</span>
  {% endfor %}
</div>
```

— no links, no ids to target, and the whole column hidden from assistive technology. INT8-029's own
text says so explicitly: *"Not in scope: making the rail letters clickable so they jump/anchor to their
group. That was triaged as a separate new feature and gets its own ticket; the rail stays `aria-hidden`
decorative here."* **This is that ticket** — raised during the INT8-018 review ("clicking on a letter
should scroll / anchor to that letter") and correctly triaged then as a new feature rather than part of
the INT8-029 bucketing bug fix, but never actually written until now.

**`implements: []` — this is not a requirement.** FR-6/FR-7/FR-8 govern *which* songs are listed, that
they are all on one page, and what order they are in; FR-16 governs navigation *between* the landing
and song pages. None of them asks for in-page jump navigation, and neither
`design-system.md` §3 (which documents the ledger only as "3-col, sticky rail", with no click or anchor
behaviour) nor its INT8-018/INT8-029 decisions-log entries mention it. This is a usability improvement
to an already-built screen, not a documented-but-unbuilt requirement. It nevertheless lands in the
**main execution sequence rather than the cleanup backlog**, on the same reasoning the board already
records for INT8-028: CONVENTIONS §6.6 keeps genuine new capability out of the cleanup category, which
is for internal-quality improvements to unchanged behaviour.

**NFR-1 still applies in full**, as it does to everything on this screen: making the rail interactive
turns a decorative column into keyboard-operable controls that must be reachable, activatable, and
visibly focused. That is an obligation this ticket inherits, not a requirement it implements.

**The accessibility shift is the substantial part of this work, not an afterthought.** The rail stops
being `aria-hidden` decoration and becomes a real, labelled, keyboard-operable in-page navigation
region. Everything below follows from that.

**Desktop-only by construction.** `song-ledger.css` hides `.song-ledger__rail` entirely below 760px
(`--bp-nav`) because the hi-fi's mobile composition has no rail at all. There is nothing to click on
mobile, so this ticket adds no mobile behaviour and no mobile tests beyond confirming the rail is still
absent there.

## Technical requirements

Files in scope: `web/themes/custom/interstate_85/components/song-ledger/song-ledger.twig`,
`song-ledger.css`, and `interstate_85_preprocess_views_view__songs()` in
`web/themes/custom/interstate_85/interstate_85.theme`. Nothing else.

### 1. Mechanism — plain same-page anchors, no JavaScript (the default; deviate only with a stated reason)

- Give every non-empty `.song-ledger__group-header` a stable `id`.
- Render every **present** rail entry as a real `<a href="#…">` pointing at its bucket's header.

This needs **zero JavaScript**, and gets the browser's native behaviour for free: back-button restores
the previous scroll position, the fragment is bookmarkable and shareable, find-in-page and
open-in-new-tab behave normally, and it works before (or without) JS. It matches this project's
established server-rendered posture — the same reasoning that built INT8-018's Alternate-titles
Show/Hide toggle as two real links rather than JS-driven buttons (`segmented-toggle`'s link mode,
design-system.md decisions log 2026-07-25). **Default to this.** If the implementer finds a concrete
reason it cannot work, record the reason in `## Notes` before reaching for JS.

**Id derivation is a one-place concern.** Compute the id in
`interstate_85_preprocess_views_view__songs()` and expose it on **both** the `groups` entry and the
`rail_letters` entry, so `song-ledger.twig` only prints values it is handed and the rail↔header mapping
cannot drift. Do not build ids by string-mangling in Twig. Suggested shape: `songs-a` … `songs-z`, and
for the `#` bucket an **explicitly non-`#` slug** (e.g. `songs-other`) — a literal `#` in a fragment
identifier must be percent-encoded and is a needless trap.

### 2. Absent letters stay non-interactive

Letters with no songs have nothing to jump to, so they must not be links. Keep them as the plain
`<span>` they already are (no `href`, not focusable, not in the tab order); only `is-present` entries
become `<a>`. The existing `is-present` distinction in the markup already carries this — present
letters are teal (`--color-accent`), absent ones muted (`--color-line`).

Do **not** reach for `aria-disabled`: that is for something that presents as a control but is
temporarily unavailable. An absent letter is not a disabled control, it is alphabet filler, and a
`<span>` already communicates "not interactive" correctly to every user agent without adding a
focusable-but-dead stop in the tab order.

**One consequence to handle, not assume away:** `--color-line` is `#d3d6d5` on a white sheet — roughly
1.5:1, far under WCAG 1.4.3's 4.5:1. Today that is invisible to Axe because the whole rail is
`aria-hidden`. Once the container is exposed, decide deliberately between:

- **(a) keep the muted treatment and mark the absent `<span>`s `aria-hidden="true"` individually** —
  they carry no information the present links don't, so nothing is lost, and the hi-fi's visual
  contrast between "has songs" and "doesn't" is preserved. *Expected default.*
- **(b) darken absent letters to a compliant token** (e.g. `--color-fg-muted`) — honest contrast, but it
  weakens the present/absent visual distinction the hi-fi deliberately draws.

Whichever is chosen, state the reasoning in `## Notes` and confirm the outcome with Axe rather than by
inspection. `--color-accent` (`#3f7ca0`) on white passes AA for the present letters.

### 3. Accessible semantics for the rail

- Remove `aria-hidden="true"` from `.song-ledger__rail`.
- Expose it as a labelled navigation region — e.g. `<nav class="song-ledger__rail" aria-label="Jump to
  letter">`. The label is what makes single-character link text acceptable under WCAG 2.4.4 (Link
  Purpose *in context*); if the implementer would rather give each link its own explicit accessible
  name, that is an equally valid call — decide one, don't do both incoherently.
- Every present entry must be reachable by `Tab`, activatable by `Enter` (a real `<a href>` gives both
  natively), and show a **visible focus ring built from the existing `--focus-ring-*` tokens** —
  `--focus-ring-width`, `--focus-ring-color`, `--focus-ring-offset`, exactly as the header nav
  (INT8-027) and the ledger rows already use them. **No new tokens.**
- **Out of scope:** promoting `.song-ledger__group-header` from a `<div>` to a heading element. It is
  tempting alongside anchor ids, but it changes the page's heading structure and is a separate
  decision; leave the element as-is.

### 4. The sticky-header overlap problem — must be tested, not assumed

This is the classic failure mode of anchor navigation on a page with sticky chrome, and this page has
two layers of it: the site header is `position: sticky; top: 0` (docking at
`var(--drupal-displace-offset-top)` for admin-toolbar users), and INT8-029 made the rail itself sticky
directly beneath it at
`calc(var(--i8-header-height, 89px) + var(--drupal-displace-offset-top, 0px) + var(--space-2))`.
A naive `#anchor` jump scrolls the target to the very top of the viewport — **underneath** the sticky
header, hiding the very group header the user asked to see.

- The CSS-only fix is `scroll-margin-top` on `.song-ledger__group-header`, which must resolve to the
  same offset the rail already docks at. `--i8-header-height` is published on `:root` by
  `site-header.js` (added in INT8-029) and updated on resize, so it is available to both.
- The expression now appears in two places and **must not be allowed to drift** — strongly consider
  hoisting it into a single custom property (e.g. `--i8-sticky-top`) that both the rail's `top` and the
  header's `scroll-margin-top` read.
- A `:target::before` spacer is the alternative if `scroll-margin-top` proves insufficient; prefer
  `scroll-margin-top` (no extra boxes, no `:target` state to manage).
- **Verify in a real browser against the real sticky header, logged out and logged in** (the admin
  toolbar changes the offset). INT8-029's Notes record that the same header/sticky interaction had to be
  diagnosed in a browser rather than read off the CSS.

### 5. Smooth scrolling — adopt it, gated on reduced motion

Add `scroll-behavior: smooth` so the jump animates rather than teleporting. This is CSS-only, needs no
JS, and pairs naturally with the anchor mechanism.

It **must** be wrapped in `@media (prefers-reduced-motion: no-preference)` so users who have asked
their OS for reduced motion get the instant jump. Scrolling animation is a recognised vestibular
trigger, and honouring the preference is part of WCAG 2.1's motion guidance — this project has no
reduced-motion convention yet, so this ticket establishes it. Scope the declaration as tightly as the
implementation allows.

If smooth scrolling turns out to fight the sticky-offset behaviour in requirement 4, drop it and say so
in `## Notes` — the jump landing in the right place is the non-negotiable half; the animation is the
enhancement.

### Explicitly out of scope
- The bucket rule itself, the `#` catch-all, group membership and sort order — INT8-029 shipped all of
  that; nothing here changes which songs land in which bucket or in what order.
- The mobile rail (there isn't one below 760px — INT8-029 removed it per the hi-fi).
- New design tokens of any kind.
- The filter bar, the alt badge, the empty state, and the group header's element type.

## Definition of done (acceptance criteria)
- [x] Every non-empty group header carries a stable, unique `id`, derived in one place in the
      preprocess and consumed by both the rail and the header markup.
- [x] Clicking a present rail letter (or `#`) brings that bucket's group header into view, and the
      header is **fully visible** — not obscured by the sticky site header or the sticky rail — both
      logged out and with the admin toolbar displayed.
- [x] Absent letters render as non-interactive, non-focusable text and are skipped by `Tab`.
- [x] The rail is no longer `aria-hidden`; it is exposed as a labelled navigation region, and every
      present entry is `Tab`-reachable and `Enter`-activatable with a visible focus ring built from the
      existing `--focus-ring-*` tokens.
- [x] Axe on `/songs` reports no new serious/critical violations — in particular no colour-contrast
      regression from newly-exposed rail text (requirement 2).
- [x] `scroll-behavior: smooth` applies only under `prefers-reduced-motion: no-preference` (or its
      omission is justified in `## Notes`).
- [x] Below 760px nothing changes: the rail is still absent and no jump navigation is rendered.
- [x] Tokens-only styling; no hardcoded hex/px; no new tokens introduced.
- [x] Tests added per test strategy §7 and passing in the default gate; `lando playwright` green.
- [x] QA steps recorded under `## QA steps` and repeated in the chat completion report (user-visible
      change).
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: true` — this is real new user-facing, keyboard-operable behaviour. Red-green is
binding: the assertions below are written and confirmed failing against the current decorative rail
**before** any markup changes.

**Playwright** (extending `tests/playwright/tests/songs-landing.spec.ts`, test strategy §7), at desktop
viewport with `?type=All`:

- Clicking a present rail letter scrolls its group header into view — assert the header's bounding box
  is within the viewport afterwards.
- The landed-on header is **not obscured**: its top edge sits below the sticky site header's bottom edge
  (read the header's real measured height / bounding box, don't hardcode a number). This is the
  assertion that actually pins requirement 4 — write it deliberately, it is the one most likely to be
  written too weakly to catch the bug it exists for.
- The `#` entry jumps to the catch-all group (its fragment is not a literal `#`).
- An **absent** letter (e.g. `X` in the current dataset — confirm against real data first, as INT8-029's
  test author had to) is not a link, has no `href`, and is skipped when tabbing through the rail.
- Keyboard path: `Tab` reaches a present rail entry, it shows a visible focus ring (assert computed
  `outline`, following the INT8-027 precedent for focus-ring assertions), and `Enter` performs the jump.
- At 320px the rail is still absent — no rail links exist.

**Axe** re-run on `/songs` at desktop and 320px: the rail's newly-exposed text and the new nav landmark
must not introduce serious/critical violations (NFR-1).

**Fixtures:** as with INT8-018/029, the tests run against the real migrated dataset — this project has
no separate curated Playwright fixture. Confirm any letter named in a test (present *or* absent)
against the live data before relying on it.

If a bucket→slug helper ends up in `i8_services` beside `ArticleInsensitiveTitle::bucket()`, add its
cases to the existing `ArticleInsensitiveTitleTest` data provider; if the slug is derived purely in the
theme's preprocess, Playwright is the red-green vehicle and no new PHPUnit test is required.

## QA steps
- [x] At desktop width, open `/songs?type=All` and **click a rail letter** (try `B`, `M`, `S`) → the page
      animates to that letter's group header, and the header is **fully visible just below the sticky
      site header**, not tucked underneath it.
- [x] Click **`#`** → jumps to the catch-all bucket at the end; the address bar reads `#songs-other`,
      never a bare `#`.
- [x] Repeat both **while logged in** (admin toolbar showing) → still lands clear; the extra 52px of
      toolbar is absorbed automatically.
- [x] **Keyboard:** `Tab` into the rail → each present letter takes focus with a visible teal ring, and
      `Enter` performs the same jump. `X` (no songs) is **skipped entirely** — it never takes focus.
- [x] Use the **browser Back button** after a jump → returns you to where you were, because these are
      real anchors and not scripted scrolling. A URL with a fragment is shareable and bookmarkable.
- [x] Turn on **Reduce motion** in your OS → the jump becomes instant instead of animating.
- [x] Resize below **760px** → the rail is gone entirely, as before; nothing to click, nothing broken.

## Notes
2026-07-25 — created.

2026-07-26 — implemented. No JavaScript was needed: the whole feature is real `<a href="#id">` anchors
plus two CSS declarations, exactly the default the ticket asked for.

**Independent test authorship.** The nine new Playwright tests (extending `songs-landing.spec.ts`) were
written by a separate model from this ticket's text and the existing code alone, before any markup
changed, and confirmed red for the right reason first — *"rail entry \"B\" has no href"*, *"the rail is
still hidden from assistive technology by aria-hidden"*, *"no element in the scroll chain declares
scroll-behavior: smooth"*, and so on. Eight were red; the ninth (the 320px "nothing changes" check) is
an anti-regression lock that is green by design, which the test author flagged explicitly rather than
dressing up as a failing test.

**The test author's most valuable finding, and the reason requirement 4 is genuinely pinned.** The
ticket warned that the sticky-overlap assertion was "the one most likely to be written too weakly to
catch the bug it exists for". That warning was justified: the author hand-injected both a naive
implementation and a fixed one into the live page and measured them, and found that with **no**
`scroll-margin-top`, group headers B/M/S land at viewport `top ≈ -0.2` — *but their bottom edge is still
inside the viewport*, so the obvious "is the element within the viewport?" assertion passes while the
bug is fully present. The delivered assertion instead checks five things off live-measured boxes with no
hardcoded pixels: a premise that the sticky header really is docked over the viewport top (so the check
cannot pass vacuously), `target.top >= header.bottom`, the target's bottom inside the fold, no
intersection with the *second* sticky layer (the rail), and `elementFromPoint` at three points inside the
target returning the target itself — which catches z-index/overlay cases geometry alone cannot see. The
author also noted that `Z` and `#` cannot discriminate at all, because they sit at the document's scroll
limit and land correctly even with the bug, so the jump tests deliberately use early and middle letters
too.

**Ids are derived in exactly one place**, per the ticket: a single `$bucket_id` closure in
`interstate_85_preprocess_views_view__songs()` maps a bucket to `songs-a` … `songs-z`, and the `#`
catch-all to `songs-other` (an explicitly non-`#` slug — a literal `#` in a fragment has to be
percent-encoded). It is stamped onto **both** the group entry and the rail entry, so `song-ledger.twig`
only ever prints an id it was handed and the link↔target mapping cannot drift. The ticket offered the
alternative of putting a slug helper in `i8_services` beside `ArticleInsensitiveTitle::bucket()`; the
preprocess was chosen because a DOM id is a presentation concern, and the ticket explicitly states that
route needs no new PHPUnit test (Playwright is the red-green vehicle). Both `props` descriptions in
`song-ledger.component.yml` were updated to document the new `id` key.

**Absent letters: option (a), as the ticket expected.** They stay muted `<span>`s and are individually
`aria-hidden="true"`. `--color-line` on the white sheet is roughly 1.5:1, far under WCAG 1.4.3 —
exposing 27 letters of alphabet filler at that contrast would have meant either failing Axe or
abandoning the hi-fi's deliberate teal/muted "has songs vs doesn't" distinction. They carry no
information the present links don't, so hiding them costs assistive-technology users nothing. Confirmed
with Axe rather than by inspection, as the ticket required: no serious/critical violations at desktop or
320px. `--color-accent` on white passes AA for the present letters.

**The sticky offset is now defined once.** The ticket flagged that the same `calc()` would otherwise live
in two places and drift. Hoisted to `--i8-sticky-top` on `.song-ledger`; the rail's `top` and the group
header's `scroll-margin-top` both read it. **Verified in a real browser logged out and logged in**, as
the ticket demanded — with the admin toolbar showing, `--drupal-displace-offset-top` is `52px`,
`--i8-sticky-top` resolves to `calc(89px + 52px + 8px)` = 149px, and the landed group header's top and
the rail's top are *both* exactly 149 while the site header's bottom is 141. That the two agree
automatically is precisely what the hoisted property buys.

**Smooth scrolling: adopted, gated, and scoped with `:has()`.** `scroll-behavior` only takes effect on
the element that actually scrolls — for a fragment jump that is the document root, not the ledger — so
it cannot be scoped by nesting it under `.song-ledger`. `html:has(.song-ledger)` scopes it by *page
content* instead, so this component's stylesheet cannot alter scrolling anywhere the ledger isn't
rendered. Wrapped in `@media (prefers-reduced-motion: no-preference)`; this project had no
reduced-motion convention before, so this ticket establishes it.

**One pre-existing test needed a timing fix, and it is worth being explicit about why that is not
weakening it.** INT8-029's "the letter rail stays in view while the ledger scrolls" broke — not because
the rail stopped sticking, but because its helper called `window.scrollTo(0, 1200)` and read `scrollY`
two animation frames later. That was only ever correct while scrolling was instant; once the document
scrolls smoothly, two frames land mid-flight and it read `10` instead of `1200`. The fix waits for the
scroll to come to rest (reusing `waitForScrollSettled()`, which the INT8-030 test author had already
added to the same file) before measuring. **Every assertion in that test is untouched** — only the
moment the measurement is taken changed.

**Out of scope, left alone as instructed:** the group header stays a `<div>` (promoting it to a heading
would change the page's heading structure and is a separate decision), and nothing about the bucket
rule, group membership, sort order or the mobile composition changed.

**Verification.** Default gate green (58 PHPUnit, PHPCS, PHPStan, boundary check — the change is
theme-only, so the PHP suite is unchanged). Full Playwright suite **59/59 on chromium**, including all 26
songs-landing tests. Firefox remains unrunnable in the `pw` container (`ENOENT …
/ms-playwright/firefox-1532/firefox/lock`) for every spec in the repo — a pre-existing environment gap,
unchanged by this work.

**2026-07-27 — correction (INT8-036).** That "pre-existing environment gap" was wrong: the real cause
was a dangling profile-lock symlink left by a process killed on 2026-07-20, not a missing binary or a
scaffolding-era gap (INT8-006 itself records Firefox passing). Fixed in INT8-036; the full matrix is now
545/545 with Firefox included.
