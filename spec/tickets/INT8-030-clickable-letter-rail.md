---
id: INT8-030
title: Make the song ledger's letter rail a real jump-to-letter navigation
type: task
status: todo
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
- [ ] Every non-empty group header carries a stable, unique `id`, derived in one place in the
      preprocess and consumed by both the rail and the header markup.
- [ ] Clicking a present rail letter (or `#`) brings that bucket's group header into view, and the
      header is **fully visible** — not obscured by the sticky site header or the sticky rail — both
      logged out and with the admin toolbar displayed.
- [ ] Absent letters render as non-interactive, non-focusable text and are skipped by `Tab`.
- [ ] The rail is no longer `aria-hidden`; it is exposed as a labelled navigation region, and every
      present entry is `Tab`-reachable and `Enter`-activatable with a visible focus ring built from the
      existing `--focus-ring-*` tokens.
- [ ] Axe on `/songs` reports no new serious/critical violations — in particular no colour-contrast
      regression from newly-exposed rail text (requirement 2).
- [ ] `scroll-behavior: smooth` applies only under `prefers-reduced-motion: no-preference` (or its
      omission is justified in `## Notes`).
- [ ] Below 760px nothing changes: the rail is still absent and no jump navigation is rendered.
- [ ] Tokens-only styling; no hardcoded hex/px; no new tokens introduced.
- [ ] Tests added per test strategy §7 and passing in the default gate; `lando playwright` green.
- [ ] QA steps recorded under `## QA steps` and repeated in the chat completion report (user-visible
      change).
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

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

## Notes
2026-07-25 — created.
