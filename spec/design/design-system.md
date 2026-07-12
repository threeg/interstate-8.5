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
| `--color-tint` | `#e4edf2` | section fills (Contribute, ledger group headers, alt-version header) |
| `--color-line` / `--color-disabled` | `#d3d6d5` (Pumice) | dividers, borders, disabled fills |
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
| **Header / nav** | transparent (over hero, homepage pre-scroll) · solid (scrolled + all secondary pages) | default · current-section (accent underline) · focus · mobile (☰) | wordmark + "8" shield + primary nav; hero nav underline uses Polo Blue, solid uses teal |
| **Footer** | one, identical everywhere | — | secondary menu (About/Contact/Support/Legal/Privacy) + © + disclaimer |
| **Hero** | band hero (home, full, "TAKE AN EXIT") · page-title hero (secondary, short) | — | photo + darkening scrim for legibility |
| **News card** | — | — | 4:3 photo · Oswald headline · date · Lora excerpt |
| **Latest News** | 3-up grid of News Cards | — | homepage; "SHOW MORE →" |
| **Home module** | upcoming tour · recently-passed · this-week-in-history · song-spotlight · from-discography | — | label (teal) + Lora list + "MORE →" |
| **Contribute block** | — | — | tint panel + Polo-Blue CTA |
| **Filter bar** | — | default · disabled (Released/Played-live "coming soon") | Type select, Alt-titles Show/Hide segmented toggle, APPLY (teal) |
| **Song ledger** | letter-rail + group header + row | row default · **alt** (teal chip) · hover · focus | 3-col, sticky rail; "412 results" |
| **Lyric pair** | side-by-side (desktop) · stacked (mobile) | — | "THIS VERSION" \| "NORMAL VERSION →"; "[same as normal version]" (FR-20) |
| **"Coming soon" stub** | — | disabled | reserves rail for deferred releases/last-played/tour-stats (FR-14 spirit) |
| **Quote block** | — | — | left-rule, italic Lora |
| **Button / CTA** | primary teal · CTA polo-blue | default · hover (−12%) · disabled (Pumice, 70%) | see token panel |
| **Link** | nav/action (teal, underline on hover) · inline text (slate, pumice underline) | default · hover | — |

---

## 4. Visual states & patterns

- **Empty (landing no-results, FR-19):** explicit message + reset; never a blank area.
- **Loading:** server-rendered; unobtrusive (no heavy skeletons in slice 1).
- **Error:** the site's standard error page; inline messages sparing, accent-toned.
- **Focus / keyboard (NFR-1):** a visible focus ring on every interactive element; logical tab order;
  filter controls labelled.
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
