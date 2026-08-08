# Interstate-8 — the requirements decisions

| | |
|---|---|
| **Document** | Decision record and superseded wording for `requirements.md` |
| **Repository location** | `spec/requirements/decisions.md` |
| **Status** | **Archive — not binding.** The binding document is `requirements.md` |

> **This is an archive, and it is deliberately not in the reading path.** It exists so the binding
> document beside it can hold **builder instructions only** (`spec/README.md`, *How versions evolve*).
> Nobody reads this file routinely, and that is correct — its whole value is at the rare, expensive
> moment someone asks *"why is this rule like this, and can I just change it?"*
>
> **Do not summarise it upward into the binding document, and do not maintain it as though it were
> current.** Append; never rewrite.

## What belongs here

- **Decisions** — requirement decisions — where a default was chosen among alternatives, or a threshold was set to a specific value. This is where future-you learns *why* `FR-12` says 25 and not 50. Record the options considered and the reason, not just the outcome.
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
> **Relocated verbatim from `requirements.md` §7 at the v1.4.7 kit update (2026-08-08).** Order is as it
> stood there (newest first); nothing was reworded.

- **2026-08-02** — **Slice 2 requirement deltas (Milestone 11).** Added `FR-22`–`FR-25` (§4.5) and
  `NFR-9`–`NFR-11`, and amended `FR-20` in place. Taken in turn:
  - **`FR-20` lost the word "alongside".** It was a layout constraint sitting in a behavioural document,
    and it would have pre-empted the very design decision `TODO-001` is parked waiting for. The rule now
    binds *both lyric sets present and attributed*; **placement is the design's call** (M13/M14, `D-a`).
    No test behaviour changes — only `song-versions.spec.ts`'s geometry assertions follow the new design.
  - **`FR-22` makes the front page content, not code.** The `INT8-017` stub was always declared temporary
    in its own docblock; this is the rule that retires it. Deliberately stated as *"editable content
    managed in the CMS"* rather than naming Layout Builder: **which** mechanism delivers it is `D-h`, owed
    by M12, and a requirement that names the tool would settle an architecture decision by the back door.
  - **`FR-23`/`FR-24` are the genuinely new homepage behaviour** — the set editorial message, and the
    transparent-over-hero navigation. **`FR-24`'s 24px is now contractual**, lifted from the shipped
    `site-header.js`; it had no specification before, so this pins what already works rather than choosing
    something new. Change it here first if the design wants a different threshold.
  - **`FR-25` records what `INT8-028` already built**, per the brief's `D-c` reclassification: random
    background image, re-picked per page load, not frozen by the anonymous page cache. This is the clearest
    case in the project so far of **behaviour that worked, was reasoned about carefully, and bound nothing**
    — it lived in a docblock. A rule in a docblock is a rule the next change is free to break.
  - **`NFR-9`/`NFR-10` split reproducibility into two testable properties** rather than one: the content
    *arrives* on a fresh install, and it *survives editing afterwards*. They are separated because they fail
    independently and a mechanism can easily satisfy the first while violating the second — which is exactly
    the failure the brief warns about (an artefact re-imported over the operator's edits). `NFR-10` is
    therefore a selection criterion for M12's mechanism choice (`D-d`), not a post-hoc check.
  - **`NFR-11` binds updatability, not the patch level** — revised during M11 review, on the site owner's
    objection to the first draft. That draft required the site to carry **no unpatched core advisory**,
    which is too strong in a way worth naming: it would put the project in breach from the moment any
    advisory published until it chose to act, converting an operational judgement — *is this one worth a
    release right now?* — into a spec violation. **The durable requirement is that the choice exists at
    all.** So: MUST on the dependency set remaining resolvable and updatable without workarounds, SHOULD on
    tracking security-supported branches (overridable with a recorded reason, per §1.2). The rule is
    **currently breached on the MUST** — Composer cannot resolve at all — which is exactly what M17's first
    ticket fixes. A requirement the project is knowingly failing is a useful document; an absent one is not.
- **2026-07-19** — **FR-1/FR-5 reading clarified (migration imports all rows, `Song_Active → status`).**
  The Songs migration does not filter the source on `Song_Active`; it imports every `I8_Songs` row and
  maps `Song_Active` to the node's published state. FR-1 ("import every active song") is therefore
  satisfied — every active song is imported and published — while inactive rows (none in the dump; all
  492 are active) are imported **unpublished** rather than dropped, which is lossless and recoverable.
  FR-5's count parity holds; its verification check is tightened to compare *published* imported count
  against the active-source count in **INT8-025**. Rationale and the authoritative mapping live in
  `content-model.md` §8/§12 *(the decisions log, renumbered from §9 at M12)*. (Surfaced by `sfk-verify` on
  the migration batch; no FR text changed.)
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
- **2026-07-25** — **FR-8 extended with a punctuation/symbol catch-all** (INT8-029): the article-only
  rule left real titles like `(8)copy` and `(No Song)` with nowhere sensible to sort — each became its
  own one-song, nonsense-headed group on the rendered ledger. Extended the rule (implementation
  unchanged conceptually, wording clarified here to match): skip past any leading punctuation to find
  the first letter-or-digit; a letter sorts under itself, anything else (a digit, or a title that is
  only punctuation) goes into one trailing catch-all group. No hi-fi precedent exists for the catch-all
  — see `design-system.md`'s matching 2026-07-25 entry.
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
