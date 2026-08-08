# Interstate-8 — the design system decisions

| | |
|---|---|
| **Document** | Decision record and superseded wording for `design-system.md` |
| **Repository location** | `spec/design/decisions.md` |
| **Status** | **Archive — not binding.** The binding document is `design-system.md` |

> **This is an archive, and it is deliberately not in the reading path.** It exists so the binding
> document beside it can hold **builder instructions only** (`spec/README.md`, *How versions evolve*).
> Nobody reads this file routinely, and that is correct — its whole value is at the rare, expensive
> moment someone asks *"why is this rule like this, and can I just change it?"*
>
> **Do not summarise it upward into the binding document, and do not maintain it as though it were
> current.** Append; never rewrite.

## What belongs here

- **Decisions** — visual-design decisions — palette choices, what was deliberately kept minimal, deferred visual work. Record the options considered and the reason, not just the outcome.
- **Superseded wording** — when a rule in the binding document is rewritten, its previous text moves
  here **verbatim**. It does not stay beside the live rule, where it gets read as current.

## What does not

- **Rules.** If a sentence can be written as a rule, it belongs in the binding document.
- **Operational hazards** — a finding a builder would otherwise rediscover expensively, whose absence
  lets someone build the wrong thing. Those stay in the binding document; they are neither
  justification nor history.

## The reference runs one way

Entries are **keyed by the id or section they affect**, so "why is this like this" is a search
(`rg '<id>' spec/`). **A rule never cites its entry here.** Cite one and someone soon adds a sentence
explaining the citation, and the narration is back in the binding text. Wanting to point at this file
*from* a rule is the signal that the justification should have stayed out of the rule.

---

## Entries

> Newest last. One line each where possible; the reasoning lives here, so it may run longer than a rule
> would — but a decision is not an essay.
>
> **Relocated verbatim from `design-system.md` §5 at the v1.4.7 kit update (2026-08-08).** Order is as
> it stood there; nothing was reworded.

- **2026-07-11** — **Formalized from the Claude Design hi-fi** (`Interstate-8 1B.dc.html`); tokens
  distilled into `tokens.css` (executable). Source-of-truth = that hi-fi + `tokens.css`.
- **2026-07-11** — **Accent changed from the wireframe's oxblood to teal `#3f7ca0`**; the palette now
  leans on the extracted muted-highway colours (Corduroy / Polo Blue / Pumice). The "surprise third"
  resolved into this refined muted+teal direction rather than a separate scheme.
- **2026-07-11** — **Serif is Lora** (was Georgia in the wires); display stays Oswald.
- **2026-07-11** — **"Coming soon" rail** on the song page kept (FR-14 spirit — no real data shown).
- **2026-07-21** — **Design export refreshed** (`Interstate-8 1B.dc.html`, requested back from Claude
  Design to close gaps found while building INT8-015). Adds: explicit HEADER NAV hover/focus panels
  (nav hover ≠ current — see Header/nav row), mobile header closed/open states, a universal FOCUS RING
  panel, a LAYOUT WIDTHS panel (confirms full-sheet-vs-content-column split as built), FILTER BAR
  hover/focus/open states, SONG LEDGER ROW states, SONGS LANDING EMPTY and SONG PAGE MISSING FIELDS
  precision panels, a "COMING SOON" STUB precision spec, an explicit nav-vs-inline-link disambiguation,
  and full SONGS LANDING MOBILE / SONG PAGE MOBILE compositions (previously missing from slice 1's
  mobile reference). **Correction:** the site slogan is shown on both header variants at desktop/tablet
  widths (previously read as solid-header-hidden); only the mobile ☰ bar drops it. See `INT8-027` for
  the resulting fix to INT8-015's already-shipped header.
- **2026-07-25** — **Built the Songs landing (INT8-018).** Two tokens added: `--color-line-subtle`
  (`#e3e6e5`, ledger row dividers — lighter than `--color-line`) and `--radius-pill` (`8px`, the alt
  badge chip). New `song-ledger` SDC (letter-rail + grouped rows + alt badge). The **Filter bar is not
  its own SDC component** — its atoms (select-field, segmented-toggle, button) are assembled directly in
  the Songs landing's page template instead, because nesting one component's `{% embed %}` inside
  another component's own template trips a Drupal core bug (the outer component's prop validation
  receives the inner embed's context instead of its own — see INT8-018's Notes for the reproduction).
  `segmented-toggle` gained an optional link mode (`href_a`/`href_b`) so the Alternate-titles Show/Hide
  control can be two real links instead of JS-driven buttons, matching this project's "server-rendered,
  a filter change reloads the page" pattern.
- **2026-07-25** — **Song ledger `#` catch-all added (INT8-029).** INT8-018 grouped songs by the
  literal first character of the (article-stripped) title, so a title leading with punctuation or a
  digit got a one-song, nonsense-headed group (e.g. a group literally headed `(`). The hi-fi shows only
  an `A`–`Z` rail with no non-letter bucket — this is a slice-1 addition, not a hi-fi-documented
  behaviour, added because real migrated titles (`(8)copy`, `(No Song)`, an ellipsis-led title) need
  somewhere sensible to file. Rule: strip a leading run of non-letter/non-digit characters first (so
  `(No Song)` files under **N**, looking past the punctuation), then bucket by whatever character is
  found there — a letter gets that letter (accented Latin letters fold to their base ASCII form), a
  digit or anything else goes to a single **`#`** bucket sorted after `Z`. The canonical implementation
  is `i8_services`' `ArticleInsensitiveTitle::comparisonKey()`/`bucket()` — the theme's rendered grouping
  and ordering both call it, nothing re-implements the rule.
- **2026-07-26** — **"Coming soon" stub's colour/opacity corrected (INT8-019, NFR-1).** The hi-fi's
  literal spec for this component — `--color-fg-disabled` text inside a container at whole-block
  `opacity:.65` — measures 1.77:1 against white (and only 2.56:1 even with the opacity removed),
  failing the 4.5:1 AA floor outright once the component was actually built and Axe ran against it: the
  same failure hit the "MORE ABOUT THIS SONG" muted section label, which used the identical colour. Both
  now use `--color-fg-muted` (5.56:1) with no container opacity; the bold weight (already specified for
  the muted section-label variant, and matched here) is what still reads as more emphasised/dimmed than
  ordinary text at the same size, rather than a second shade of grey. `--color-fg-disabled` keeps its
  narrower, correct use: a genuinely disabled native form control (the filter bar's Released/Played-live
  selects), where the browser's own disabled-state rendering applies and Axe's contrast check does not
  evaluate it the same way. Recorded as a spec correction (root CLAUDE.md's non-negotiable: fix the spec
  first, never silently diverge) rather than an implementation-only tweak, since the wrong values were
  written here, not just used here.
- **2026-07-26** — **The song page/lyric-pair dashed divider is a real token, `--color-line-accent`
  (`#b9d3e3`, "Spindle"), not the neutral `--color-line`.** During INT8-019's second review round, the
  divider between the song page's main content and its "coming soon" rail was built using
  `--color-line` (Pumice, neutral grey), reasoned at the time as "the hi-fi's colour is an unnamed
  one-off, and inventing a token for a single divider would violate 'never hardcode hex' from the other
  direction." That reasoning was wrong: `#b9d3e3` appears **three times** in the hi-fi — the SONG PAGE
  DESKTOP composition, the SONG PAGE — MISSING FIELDS panel (the same divider, in a variant
  composition), and the alternate-version lyric-pair split (INT8-020, not yet built) — which is
  precisely the bar for "this is a deliberate, reusable value," not a one-off. Missed in the original
  token extraction (Milestone 5); added now as `--i8-spindle` / `--color-line-accent`. Non-text contrast
  checked and found consistent with an already-shipped precedent rather than a new risk: at 1.56:1
  against white it sits *below* WCAG 1.4.11's 3:1 floor for UI-component boundaries, but so does
  `--color-line` itself (1.46:1, already used for the filter bar's border and already Axe-clean in
  production) — both are purely decorative panel dividers, not functional UI boundaries, which is
  exactly the category 1.4.11 does not mandate a floor for.
