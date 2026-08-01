# Interstate-8 — Design System / Visual Contract (v5, `5.0.x-dev` slice 1)

| | |
|---|---|
| **Document** | Design system (visual contract) |
| **Repository location** | `spec/design/design-system.md` |
| **Status** | Binding specification (for UI) — Milestone 5 signed off (2026-07-11) |
| **Depends on** | `spec/wireframes/` (direction 6d) |

> **Purpose.** The visual contract the frontend binds to — the analog of `api-contract.md` for the
> backend. It fixes the design **decisions** implementation must honour (tokens, components, states),
> not the artwork. The executable layer is **`tokens.css`** (CSS custom properties the theme imports).

---

## 1. Source files & where to build from  *(read this first, Claude Code)*

When generating tickets (Milestone 7) and building the theme (Milestone 8/9), work from these — in
this order:

| What | Path | Use |
|------|------|-----|
| **Design tokens (import this)** | `spec/design/tokens.css` | The binding token set. Components read `var(--…)`; **never hardcode hex/px.** |
| **Canonical hi-fi design** | `spec/design/interstate-8-design-refinement/project/Interstate-8 1B.dc.html` | The full visual: all three screens (x-wide/desktop/tablet/mobile), the component library, and the token panel. Open in a browser to view. **Match this.** |
| **This document** | `spec/design/design-system.md` | Token/component/state decisions in prose (§2–§4). |
| **Shield mark** | `…/project/assets/interstate-shield.svg` (+ `.png`) | The "8" route-shield logo/motif. |
| **Photos in use** | `…/project/uploads/` — hero `pexels-jack-redgate-333633-3014002.jpg`; songs hero `pexels-hobiphotography-36346406.jpg`; song hero `pexels-tomverdoot-3444649.jpg`; news `live_2013.jpg`, `isaac_brock_bridge_school_2010.jpg`, `band.jpg`; covers `tmaa_cover.jpg`, `wysf_cover.jpg` | Real assets referenced by the hi-fi. |
| **Screen structure & states** | `spec/wireframes/overview.md` + `01`–`03` | What each screen contains and its states (binding). |
| **Behaviour / rules** | `spec/requirements/requirements.md` (`FR`/`NFR`) | The contract the UI must satisfy. |
| **Content model** | `spec/architecture/content-model.md` | The fields each component renders. |

**Build rule:** the theme (owned starterkit + **SDC** + **Tailwind v4**) consumes `tokens.css` as the
single source of visual truth; each SDC component maps to an entry in §3; every screen matches
`Interstate-8 1B.dc.html`. Contrast holds to WCAG 2.1 AA (NFR-1); responsive from 320px (NFR-2).

### 1.1 Artefact authority (which artefact binds which kind of fact)

The table above says where to *look*; this one says which artefact **wins** when two of them could answer
the same question. They are **not interchangeable**, and a ticket that takes a value from the wrong one
ships a plausible-looking error. A ticket's `## Design authority` section cites this table.

| Kind of fact | Authoritative artefact | Notes |
|---|---|---|
| **Exact values** — colour, type, spacing, radius | `spec/design/tokens.css` | The machine-readable set the theme imports. Components read `var(--…)`; **never** a hardcoded hex/px, even one copied out of the hi-fi. §2 below summarises these for readers and is not a second source. |
| **Placement, structure, hierarchy, component shape** | `…/project/Interstate-8 1B.dc.html` (the canonical hi-fi) | The full visual at x-wide/desktop/tablet/mobile, plus the component library. Rendered at the real output dimensions in a browser, so its proportions are trustworthy. **Match this.** |
| **Which surfaces exist, their states and flow** | `spec/wireframes/overview.md` + `01`–`03` | Binding for structure and state coverage; deliberately low-fidelity, so it is **not** a value source. |
| **Component states and rules in prose** | this document, §3–§4 | Where a state or rule is not expressible in the hi-fi (hover/focus behaviour, motion, the empty state's wording). |
| **Illustrative only — never a value source** | `…/project/assets/interstate-shield.svg` and `.png`; everything under `…/project/uploads/`; `spec/wireframes/Interstate-8 Wireframes.dc.html`; `…/project/Interstate-8 Hi-Fi.dc.html`; `spec/wireframes/references/` | See below. |

**Why those are illustrative.** The **raw SVG/PNG assets** are inputs the hi-fi composes — the shield mark
carries its own internal padding and proportions, which are not the proportions it is drawn at in a page;
deriving a component's shape from the asset instead of from the hi-fi reproduces the artwork's framing
rather than the design's. The **wireframes canvas** is the structural go/no-go artefact (direction 6d,
pre-Milestone-5): its colours and spacing predate the token set and were never meant to bind. The second
export in the bundle, **`Interstate-8 Hi-Fi.dc.html`**, does not bind because the bundle's own README names
`1B` as the primary design — where the two differ, `1B` wins, and `Hi-Fi` is history. The **`uploads/`
photos** are real assets in use, but their *cropping and placement* come from the hi-fi.

> **A mockup built with substitute assets is a proportion reference, not a value source.** Where an
> artefact stands in for anything not yet final — unavailable fonts, placeholder imagery, sample copy — it
> carries deliberate compensation for those substitutes, and a value copied out of it ships the
> compensation as though it were the design. The same applies to any artefact drawn at other than the real
> output dimensions: a coordinate lifted from it is proportionally wrong by a margin small enough to
> survive review.

---

## 2. Design tokens

Full values live in **`tokens.css`**; this summarises them. (Read from the hi-fi's DESIGN TOKENS
panel.)

### Colour

| Semantic token | Value | Used for |
|----------------|-------|----------|
| `--color-fg` | `#2b302f` | wordmark, news headlines, song titles |
| `--color-fg-slate` | `#3d4442` | section headings, ledger rows, dark body |
| `--color-fg-muted` | `#5e6b68` (Corduroy) | labels, secondary text |
| `--color-fg-body` | `#556361` | muted serif body copy |
| `--color-meta` | `#6d766f` | dates, fine print |
| `--color-accent` | `#3f7ca0` (teal) | primary actions, active nav, section labels, links |
| `--color-accent-hover` | `#336585` | accent hover (−12%) |
| `--color-accent-alt` | `#98b9d0` (Polo Blue) | primary CTA (SUBMIT IT), shield outline, hero nav underline |
| `--color-nav-hover-on-transparent` | `#cfe3ee` (Ice) | hero/transparent header nav-hover text only — distinguishes hover from the unchanged-white "current" state; solid header hover uses `--color-accent` instead |
| `--color-tint` | `#e4edf2` | section fills (Contribute, ledger group headers, alt-version header) |
| `--color-line` / `--color-disabled` | `#d3d6d5` (Pumice) | dividers, borders, disabled fills |
| `--color-line-accent` | `#b9d3e3` (Spindle) | the two-pane dashed divider only — song page main/rail split, lyric-pair split (INT8-020) |
| `--color-surface` | `#ffffff` | content sheet |
| `--color-canvas` | `#eef0ef` | page background outside the sheet |

> The muted-highway palette (Corduroy / Polo Blue / Pumice) is the base; **teal `#3f7ca0` is the
> accent** (it replaced the wireframe's oxblood). Contrast is contractual (NFR-1): body ≥ 4.5:1.

### Typography

| Token | Family | Scale / use |
|-------|--------|-------------|
| `--font-display` | **Oswald** (600/700) | hero 48 · titles 38/32 · headings 24/21 · nav 14 · labels 12/11 (letter-spacing .04–.11em) |
| `--font-body` | **Lora** (400/500, italic) | body/lyrics 18/16/14/13, line-height 1.6–2.1; quotes italic |
| `--font-meta` | system-ui | dates, counts, chrome 10–13px |

### Spacing, radius, elevation

- **Spacing scale:** `4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40` px.
- **Radius:** `2` (chips) · `3` (cards/controls/buttons) · `4` (filter bar/stubs); the "8" mark uses
  `7px 7px 17px 17px` (route-shield shape).
- **Elevation:** card `0 3px 18px rgba(0,0,0,.10)`; solid header `0 2px 8px rgba(0,0,0,.05)`; wide
  sheet `0 8px 28px rgba(20,30,32,.16)`.

---

## 3. Component inventory

From the hi-fi's COMPONENTS section. Each maps to an SDC component; reference tokens (§2), never raw
values.

| Component | Variants | States | Notes |
|-----------|----------|--------|-------|
| **Header / nav** | transparent (over hero, homepage pre-scroll) · solid (scrolled + all secondary pages) | default · **hover** (distinct from current — see below) · current-section (accent underline) · focus · mobile (☰, closed/open) | wordmark + "8" shield + slogan + primary nav. Nav-item **hover** and **current** are *not* the same treatment: solid header — current = teal text + teal underline, hover = teal text + **Polo Blue** underline; transparent header — current = unchanged white text + Polo Blue underline, hover = **Ice `#cfe3ee`** text + Polo Blue underline. Hover previews the current look but with a different underline colour so the two remain visually distinguishable. Governs nav item labels only — see the separate Link row for inline/prose links. |
| **Site slogan** | "A Modest Mouse Fan Collaborative" | shown / hidden | Shown under the wordmark on **both** transparent and solid headers, at every desktop/tablet width. Hidden **only** on the mobile (☰) header bar — there's no room for it there. (Corrects the original slice-1 read, which showed it solid-header-hidden at every width.) |
| **Header · mobile menu** | closed (☰) · open (✕, nav panel below the bar) | current-section (left-border accent) | Open panel: full-width rows, `padding:14px 24px`, `border-bottom:1px solid` divider between rows (not a gap-separated column). Current item gets a `3px solid` **left border** accent instead of the desktop underline. |
| **Footer** | one, identical everywhere | — | secondary menu (About/Contact/Support/Legal/Privacy) + © + disclaimer. Confirmed: follows the 980px content column, not the full sheet width, even though the two read as equal at most viewports. |
| **Hero** | band hero (home, full, "TAKE AN EXIT") · page-title hero (secondary, short) | — | photo + darkening scrim for legibility |
| **News card** | — | — | 4:3 photo · Oswald headline · date · Lora excerpt |
| **Latest News** | 3-up grid of News Cards | — | homepage; "SHOW MORE →" |
| **Home module** | upcoming tour · recently-passed · this-week-in-history · song-spotlight · from-discography | — | label (teal) + Lora list + "MORE →" |
| **Contribute block** | — | — | tint panel + Polo-Blue CTA |
| **Filter bar** | — | default · **hover** (select/toggle/APPLY darken, `#336585`) · **focus** (2px teal outline, 2px offset) · **open** (native select expanded) · disabled (Released/Played-live "coming soon") | Type select, Alt-titles Show/Hide segmented toggle, APPLY (teal) |
| **Song ledger** | letter-rail + group header + row | row default · **zebra** (alternating row fill `#fafbfb`, cosmetic) · **alt-title** (teal chip, FR-10 marking) · **hover** (Tint `#e4edf2` fill, full row width) · **focus** (2px inset ring, no fill change) | 3-col, sticky rail; "412 results". Note: "zebra" (cosmetic alternating-row shading) and "alt-title" (the FR-10 alternate-version marker chip) are two independent states — don't conflate them. **Rail/grouping (INT8-029):** the rail runs `A`–`Z` then a trailing **`#`** catch-all for any title that doesn't bucket to a letter (a leading digit, symbol, or a script with no ASCII-letter equivalent) — a slice-1 addition with no hi-fi precedent (see decisions log). |
| **Lyric pair** | side-by-side (desktop) · stacked (mobile) | — | "THIS VERSION" \| "NORMAL VERSION →"; "[same as normal version]" (FR-20). The two columns split on a `2px dashed var(--color-line-accent)` rule — the same divider treatment as the song page's main/rail split, not a component-specific colour. |
| **"Coming soon" stub** | — | disabled | reserves rail for deferred releases/last-played/tour-stats (FR-14 spirit). Precise spec: `1.5px dashed var(--color-line)` border, `var(--radius-md)` radius; label Oswald 700 10px `.07em`; value Lora 13px. Label and value are `--color-fg-muted`, with **no container opacity** — *corrected 2026-07-26 (INT8-019)*, see decisions log: the hi-fi's own literal choices (`--color-fg-disabled` at whole-block `opacity:.65`) measure 1.77:1 on white, and the colour alone (no opacity) is still only 2.56:1 — both fail NFR-1's 4.5:1 on real text. `--color-fg-disabled` remains correct for a genuinely disabled native form control (e.g. the filter bar's Released/Played-live selects), where the browser's own disabled rendering applies; it is no longer used for text that merely *looks* disabled. |
| **Quote block** | — | — | left-rule, italic Lora |
| **Button / CTA** | primary teal · CTA polo-blue | default · hover (−12%) · disabled (Pumice, 70%) | see token panel. Governs solid CTA buttons only (e.g. "SUBMIT IT", "APPLY") |
| **Link** | action (teal, underline on hover — "MORE →", "CLEAR FILTERS", cross-refs like "alternate title/lyrics for → parent") · inline prose text (slate `#3d4442`, Corduroy-coloured underline `#5e6b68` — always underlined, e.g. "setlist" refs) | default · hover | Governs discrete action/prose links only — does **not** govern header nav, which has its own hover/current states (see Header/nav row above). *Correction: the token panel's own "Inline text link" swatch uses Corduroy `#5e6b68` for the underline, not Pumice as originally logged here on 2026-07-11.* |

---

## 4. Visual states & patterns

- **Empty (landing no-results, FR-19):** explicit message + reset; never a blank area.
- **Loading:** server-rendered; unobtrusive (no heavy skeletons in slice 1).
- **Error:** the site's standard error page; inline messages sparing, accent-toned.
- **Focus / keyboard (NFR-1):** a visible focus ring on **every** interactive element — nav links,
  buttons, form controls (select/input), the logo link. `2px solid` outline, offset 2–3px, colour
  `--focus-ring-color` (teal) on light surfaces / `--focus-ring-color-on-dark` (white) on dark/hero
  surfaces. Never `outline: none` without a replacement. Logical tab order; filter controls labelled.
- **Motion:** minimal — header solidifies on scroll; link/button hover transitions. No large motion.

---

## 5. Decisions log

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
