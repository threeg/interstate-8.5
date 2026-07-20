# Interstate-8 — Requirements (v5, `5.0.x-dev` slice 1)

| | |
|---|---|
| **Document** | Functional and non-functional requirements |
| **Repository location** | `spec/requirements/requirements.md` |
| **Status** | Binding specification — Milestone 2 signed off (2026-07-07) |
| **Scope** | Slice 1 of `5.0.x-dev` (dev stack, Songs import, Songs section, homepage design go/no-go) |
| **Grounding** | v2 `I8_Songs` schema per `interstate-8-v2-as-built-reference.md` (validated against the final production dump) |

> **Purpose.** This document turns the brief's slice-1 goals into **numbered, testable rules**. It is
> the contract the implementation is held to and the source the test strategy traces against. Every
> functional requirement gets an `FR-n`; every non-functional one an `NFR-n`. Numeric thresholds
> stated here are **contractual** (§1.4) — code and tests must use the exact values, and changing one
> is a documented spec change.
>
> **Slice scope.** These requirements cover **slice 1 only**. Later slices add new `FR`/`NFR` numbers
> (release, setlist/live, news, search, fan contributions); numbers are never reused. Requirements
> that are deliberately non-functional-in-slice-1 (the *Released* and *Played live* filters) are
> stated so the wireframes/design carry them while the implementation does not yet wire them.

---

## 1. Conventions

1. **Identifiers.** Functional requirements are `FR-n`; non-functional are `NFR-n`. Numbers are
   permanent once allocated — never reused or renumbered. New requirements take the next free number;
   superseded ones are amended in place and annotated.
2. **Modal verbs.** MUST / MUST NOT are binding; SHOULD is a strong default that may be overridden
   with a recorded reason; MAY is optional.
3. **Traceability.** Every `FR`/`NFR` is realised by at least one ticket (its `implements` field) and
   covered by at least one test (test strategy).
4. **Numeric thresholds are contractual.** Any number here (limits, viewport widths, counts) is
   binding. Implementation references it as a named constant; tests assert it. Changing one means
   editing this document first.

---

## 2. Song domain definitions

Recovered from v2 `I8_Songs` / `I8_SongType` and confirmed with Gregg. Exact stored values are
verified against the production dump at migration time (Milestone 3/9).

### 2.1 Song type (band / group) — the `SongType` taxonomy

Each song belongs to exactly one **type**, identifying the group/context it belongs to. Maps to v2
`I8_Songs.FK_SongType_ID` → `I8_SongType`.

| Type | Meaning |
|------|---------|
| Modest Mouse | Core-band songs. |
| Ugly Casanova | Isaac Brock's side project. |
| Side projects | Other projects involving core members. |
| Covers | Songs by other artists performed/recorded. |

> *"All"* is the unfiltered landing view, not a stored type. The definitive type list is confirmed
> against the dump in Milestone 3; the set above is the working list.

### 2.2 Song versions (self-reference)

A song MAY reference a **parent song** (self-reference, v2 `I8_Songs.FK_Song_ID`). A song *with* a
parent is an **alternate version** of it — an alternate title, a demo, or an alternate-lyrics
rendition (live or alternate-studio, sometimes under a different name). This is a **Song-to-Song**
relationship and is in scope for slice 1 (cross-entity release/setlist relationships are not). Two
behaviours follow, confirmed against v2 `songlist.php`:

- **Detail display (§4.3, FR-20).** An alternate version's page shows *its* lyrics **beside** the
  parent's normal lyrics, with an "alternate title/lyrics for → parent" link. When the alternate's
  lyrics are identical to the parent's (`Song_LyricsSameAsNormal`), the alt column reads "[same as
  normal version]" instead of repeating them. A parent's page lists its alternate versions as links.
- **Landing visibility.** By default the landing lists alternate versions alongside canonical songs,
  marked as alternates; the **Alternate-titles filter** (FR-10) hides them. Independently, a song
  flagged **`Song_Live = 1`** is **always excluded** from the landing (v2's `AND Song_Live = 0`) — the
  flag is a "keep this lyric-variant out of the main list" switch, **not** a studio/live indicator.
  (`Song_Live` is a v2 misnomer and SHOULD be renamed in v5.)

### 2.3 Song fields carried in slice 1

| Field | v2 source | Notes |
|-------|-----------|-------|
| Name | `Song_Name` | Display + sort key. |
| Lyrics | `Song_Lyrics` | Rich text; legacy markup normalized on import (FR-21); may be empty. |
| Notes | `Song_Notes` | Rich text; legacy markup normalized on import (FR-21); may be empty. |
| Quotes | `Song_Quotes` | Rich text; legacy markup normalized on import (FR-21); may be empty. |
| Music video | `Song_Video` | **Not imported** (decided at the migration milestone, INT8-013): only ~15 of 492 songs have a video, all clean `<iframe>` embeds — not worth automated extraction risk for that volume. `field_video` is populated by **manual entry pre-launch**. Once set, renders per FR-17. |
| Hide-from-list flag | `Song_Live` | When set, excludes the song from the landing (§2.2). A v2 misnomer — not a studio/live indicator; rename in v5. |
| Lyrics same-as-parent | `Song_LyricsSameAsNormal` | When set on an alternate version, its page shows "[same as normal version]" instead of repeating the parent's lyrics (FR-20). |
| Type | `FK_SongType_ID` | §2.1. |
| Parent/version | `FK_Song_ID` | §2.2. A non-null parent makes this song an alternate version. |

**Deferred (schema seams left, not populated/displayed in slice 1):** appears-on-release
(`I8_ReleaseTracks`), played-live/setlist (`I8_TourTracks`), tablature (`I8_Tabs`), studio sessions
(`I8_StudioTracks`), and a nullable `setlistfm_id`.

---

## 3. Domain rules

- **DR-1.** A song has exactly one type (§2.1) and zero-or-one parent song (§2.2). Parent references
  MUST NOT form cycles.
- **DR-2.** "Alternate-title" (child) songs are full songs in their own right; the parent link groups
  versions, it does not merge them.
- **DR-3.** A song with a parent (`FK_Song_ID`) is an **alternate version**: its page shows its lyrics
  beside the parent's (FR-20) and it is listed under the parent. Whether it appears on the landing
  depends on the Alternate-titles filter (FR-10) and on `Song_Live`: a song flagged `Song_Live = 1` is
  always excluded from the landing (a lyric-variant not listed separately). `Song_Live` is a
  hide-from-list switch, not a studio/live indicator.

---

## 4. Functional requirements by capability

### 4.1 Content migration — Songs import

- **FR-1** The system MUST import every active song (`I8_Songs` where the v2 active flag is set) from
  the v2 MySQL dump into the Song content type.
- **FR-2** The import MUST preserve each song's slice-1 fields (§2.3): name, lyrics, notes, quotes,
  hide-from-list flag (`Song_Live`), and type. **Music video excluded** — see §2.3 (deferred to manual
  entry, decided at the migration milestone).
- **FR-3** The import MUST preserve the song-version self-reference (§2.2), linking each child song to
  its parent.
- **FR-4** The migration MUST be **idempotent and re-runnable**: re-running it MUST NOT create
  duplicates (rows keyed on the v2 primary key), and it MUST be **rollbackable** via the Migrate API
  tooling.
- **FR-5** The import MUST be verifiable: the count of imported songs MUST equal the count of active
  songs in the source, checkable via a documented command and spot-checks.
- **FR-21** The import MUST **normalize legacy rich-text fields** (lyrics, notes, quotes — and any
  rich-text field in later slices) to a consistent, clean representation: inconsistent legacy HTML
  carried over from the v1→v2 change MUST be removed while line and paragraph breaks are preserved, so
  imported songs render uniformly regardless of their original markup. The exact transform and the
  target Drupal text format are fixed in the Architecture/migration milestone (reference approach: the
  v3 `stripOldHtml` — strip tags, then convert newlines to breaks).

### 4.2 Songs landing page

- **FR-6** The Songs landing page MUST list imported songs as links to their song pages, **excluding**
  any song flagged `Song_Live = 1` (§2.2).
- **FR-7** The landing MUST present the complete list on a **single page with no pagination** — the
  full body of work at once.
- **FR-8** The landing MUST order songs **alphabetically by name, case-insensitively, ignoring a
  leading article** ("A", "An", "The") for sorting — e.g. "The World at Large" sorts under **W**. The
  displayed title is unchanged. (A deliberate v5 improvement over v2's raw `ORDER BY Song_Name`.)
- **FR-9** The landing MUST provide a **Type (band/group) filter** offering *All* plus each type in
  §2.1; selecting a type shows only songs of that type (v2: `FK_SongType_ID`). The **default view is
  Modest Mouse** (not All), matching v2.
- **FR-10** The landing MUST provide an **Alternate-titles filter**. **Default (Yes):** alternate
  versions are listed alongside canonical songs, visually marked as alternates. **No:** only canonical
  songs (no parent) are listed. Songs flagged `Song_Live = 1` remain excluded either way (FR-6). (v2:
  the filter toggles `AND FK_Song_ID <= 1`; alternates are flagged with a `*`.)
- **FR-11** The landing MUST NOT provide **functional** *Released* or *Played live* filtering in
  slice 1 (both depend on deferred relationships). These two filters MUST appear in the wireframes
  and design (Milestones 4–5) for continuity; whether slice-1 build renders them disabled or omits
  them is a design decision recorded there.

### 4.3 Song detail page

- **FR-12** A song page MUST display the song's name, quotes, lyrics, and notes, and MUST NOT display
  its type/group (as in v2 — a song does not show its band tag).
- **FR-13** A parent song's page MUST list its alternate versions as links; an alternate version's page
  MUST link to its parent ("alternate title/lyrics for → parent").
- **FR-20** An alternate version's page MUST display its lyrics **alongside** the parent song's normal
  lyrics; when `Song_LyricsSameAsNormal` is set, the alternate column MUST read "[same as normal
  version]" (linking to the parent) instead of repeating the lyrics.
- **FR-14** A song page MUST NOT display release, setlist/live-performance, tablature, or
  studio-session data in slice 1.
- **FR-15** When a field is absent (e.g. no lyrics, no video), the page MUST omit that section
  cleanly rather than render an empty heading or placeholder.
- **FR-17** When a song has a music-video (`Song_Video`), the page MUST render it as an **embedded
  video** (v2 stored the embed markup and showed it in a "Video" box), not merely a link.

### 4.4 Navigation

- **FR-16** The site's primary navigation MUST provide a path to the Songs landing page, and each song
  page MUST link back to the Songs landing.

---

## 5. Behaviour / flow rules

- **FR-18** Filters combine conjunctively: an active Type filter and the Alternate-titles toggle apply
  together (e.g. *Modest Mouse* + alternates-off shows only canonical Modest Mouse songs).
- **FR-19** When a filter combination yields no songs, the landing MUST show an explicit empty state,
  not a blank list.

---

## 6. Non-functional requirements

- **NFR-1** All slice-1 pages MUST conform to **WCAG 2.1 AA**. Enforced by automated checks plus
  manual verification (test strategy).
- **NFR-2** All slice-1 pages MUST be responsive and usable from a **320px** viewport width upward
  (mobile-first). 320px is the contractual minimum supported width.
- **NFR-3** The Songs migration MUST be idempotent, re-runnable, and rollbackable (see FR-4) using the
  Migrate API; no bespoke migration test is required where the Migrate module's own mechanisms cover
  it.
- **NFR-4** **No contractual performance threshold applies in slice 1.** Hard performance targets
  (Core Web Vitals / load budgets) are deliberately deferred to a pre-launch pass, where they will be
  set as new NFRs against real content, theming, and caching. Slice 1 SHOULD avoid gratuitous
  regressions (no render-blocking bloat; images sized). *This deferral is explicit, not an omission.*
- **NFR-5** The architecture dependency rule (`content-model → services → theme`, with `migration`
  populating `content-model`) MUST hold and MUST be enforced by tooling (wired in the scaffolding
  milestone).
- **NFR-6** Drupal configuration MUST be generated via the admin UI/API and captured as **exported
  config verified against the spec** — never hand-authored config YAML.
- **NFR-7** The Songs landing and song page MUST have **front-end tests** (tool chosen in the
  test-strategy milestone) asserting, at minimum: the full list renders as links (FR-6/FR-7), the
  Type filter narrows the list (FR-9), navigation from landing to a song page works (FR-16), and a
  song page renders its core content (FR-12/FR-13).
- **NFR-8** Supported browsers SHOULD be the current and previous major versions of evergreen browsers
  (Chrome, Firefox, Edge, Safari) plus their mobile equivalents.

---

## 7. Decisions log

- **2026-07-07** — **Accessibility: WCAG 2.1 AA** chosen over 2.2 AA (newer, stricter) and 2.1 A
  (lighter): 2.1 AA is the established practical/legal baseline; day-one per project principle.
- **2026-07-07** — **No pagination on the Songs landing** (~400 songs as text links, one page): the
  value is a complete at-a-glance picture of the body of work; pagination/filtering-by-scale can come
  in a later slice if needed. Not a contractual count.
- **2026-07-07** — **Performance thresholds deferred** to a pre-launch NFR pass (NFR-4): a Core Web
  Vitals number set against a near-empty dev site would be arbitrary or churny (lazy adoption).
- **2026-07-07** — **Music videos embedded inline** (FR-17) rather than linked: matches the "music
  videos on the song page" intent.
- **2026-07-07** — **Tablature deferred** from slice 1 (v2 `music.php` / `I8_Tabs`): the stated
  song-page scope did not include tabs.
- **2026-07-07** — **Download link dropped** (v2 `Song_Download`): it was an iTunes purchase-referral
  link — a defunct integration — so it is not carried into v5.
- **2026-07-07** — **Requirements re-grounded in the v2 code** (`songlist.php`, `functions.php`) after
  the as-built summary proved too coarse for field-level semantics. Corrections made: the side-by-side
  lyric display is triggered by a song **having a parent** (`FK_Song_ID`), not by `Song_Live`; the
  Alternate-titles filter **defaults to showing** alternates (marked `*`), with "No" hiding them; the
  landing sorts on raw `Song_Name`; music video comes from `Song_Video` (embed).
- **2026-07-07** — **`Song_Live` is a hide-from-landing flag, not a studio/live indicator** (v2:
  `AND Song_Live = 0` in the landing query). It keeps a lyric-variant out of the main list. The v5
  field SHOULD be renamed to reflect this.
- **2026-07-07** — **Legacy rich-text cleanup on import** (FR-21): the rich-text fields are
  inconsistent — some carry HTML from the v1→v2 change, some don't. The import normalizes them to a
  consistent representation (preserving line/paragraph breaks) rather than importing the inconsistency.
  Reference: the v3 `stripOldHtml` (strip tags → `nl2br`); exact transform and target text format
  fixed at the Architecture/migration milestone.
- **2026-07-07** — **Landing sort ignores leading articles** (FR-8): sort by the first significant
  word, dropping a leading "A"/"An"/"The" — a deliberate v5 improvement over v2's raw `ORDER BY
  Song_Name`.
- **2026-07-07** — **Type-filter default and page display resolved**: the landing **defaults to Modest
  Mouse** (matching v2, FR-9); the song's type/group is **not shown on the song page** (FR-12).
  Consequence: in the *All* view there is no per-song group distinguisher — a known v2 characteristic,
  noted as a possible future enhancement, **out of scope for slice 1**. Presentation details
  (two-column list, `*` marker) remain with the wireframes/design milestones.
- **2026-07-07** — **Alternate-title (song self-reference) is in slice-1 scope** as a Song-to-Song
  relationship (FR-3, FR-10, FR-13); it does not contradict the brief, which deferred only
  *release* and *setlist* relationships.
- **2026-07-07** — ***Released* and *Played live* filters are non-functional in slice 1** (FR-11) but
  carried in wireframes/design, because they depend on deferred release/setlist relationships.
- **2026-07-07** — **Grounded in the v2 as-built reference** (schema validated against the final
  production dump); exact `SongType` values and field-level behaviour reconfirmed at migration.
