# Interstate-8 — the architecture, content-model and interface-contract decisions

| | |
|---|---|
| **Document** | Decision record and superseded wording for every binding document in `spec/architecture/` |
| **Repository location** | `spec/architecture/decisions.md` |
| **Status** | **Archive — not binding.** The binding documents are `architecture.md`, `content-model.md` and `api-contract.md` |

> **This is an archive, and it is deliberately not in the reading path.** It exists so the binding
> document beside it can hold **builder instructions only** (`spec/README.md`, *How versions evolve*).
> Nobody reads this file routinely, and that is correct — its whole value is at the rare, expensive
> moment someone asks *"why is this rule like this, and can I just change it?"*
>
> **Do not summarise it upward into the binding document, and do not maintain it as though it were
> current.** Append; never rewrite.

## What belongs here

- **Decisions** — architecture, content-model and contract decisions — the layering chosen and the alternatives rejected, why this stack suits these requirements, why a boundary sits where it does, and why a contract shape was fixed. Record the options considered and the reason, not just the outcome.
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

> Newest last within each group. The folder has three binding documents, so entries are grouped by the
> document they belong to; within a group the reasoning may run longer than a rule would — but a
> decision is not an essay.
>
> **Relocated verbatim at the v1.4.7 kit update (2026-08-08)** from `architecture.md` §7 and
> `content-model.md` §12. Order within each group is as it stood there; nothing was reworded.
> `api-contract.md` has never carried a log and has no entries yet.

### `architecture.md`

> Dated record of changes to that document — what changed and why. Append per amendment.
>
> **Started 2026-08-01, not backfilled.** `content-model.md`, `design-system.md` and
> `wireframes/overview.md` have carried a log since their milestones; `architecture.md` did not, so the
> Milestone 3 decisions are recorded in its §6 *Rationale / exclusions* column and in the milestone's
> sign-off rather than here. The log runs forward from this entry.

- **2026-08-02** — **Slice 2 architecture deltas (Milestone 12).** The content-model detail and the full
  reasoning for `D-h`/`D-b`/`D-d` live in `content-model.md` §9–§11 and its own log; recorded here are the
  four changes to *this* document:
  - **§1 and §6 — the Layout Builder line moved from a page to a content type.** It read *"Layout Builder
    only for the home page"*; it now reads **"the `page` content type only, and nothing else"**. This is a
    **widening in letter and a tightening in principle**: slice 1 could say "one page" because `page` did
    not exist, but the real bar was always *composed vs structured* content, and stating it that way is
    what makes it enforceable when About and Terms arrive. The **binding half is the exclusion** — Layout
    Builder never on `song` or any later archive type, because per-instance layout variance on structured
    content is what would dirty the future JSON surface (§1).
  - **§6's *Excluded* row sharpened** from "Layout Builder for entity pages" — `page` is an entity page
    too, so the old wording now excluded the very thing §6 permits.
  - **§2.1 — new `default-content/` layer**, a sibling of `migration`: both populate `content-model` from
    outside and depend on nothing else. Kept separate from `migration` because its source is the
    repository rather than the v2 dump and it runs at install rather than on demand. **The boundary check
    does not know this layer yet** — teaching `tooling/check-boundary.sh` about it is **M17 tooling
    work**, flagged in §2.1 so it cannot be quietly absorbed into a feature ticket.
  - **§4.4/§4.5 — two new flows**, the homepage render and fresh-install seeding, so every slice-2 `FR`
    and `NFR` has a traced path through the layers as §4's other flows do.
- **2026-08-01** — **Dropped "provisional" from §2.1.** The layering was described as *"Provisional
  Drupal-oriented layering, finalised here"*, which contradicted itself, and the root `CLAUDE.md` and
  `spec/tickets/CONVENTIONS.md` §3 both said the layer set would be *"finalised in the Architecture
  milestone"* — future tense, for a milestone signed off on 2026-07-11. The layering itself is
  **unchanged**: `content-model → services → theme`, `migration → content-model`, nothing imports
  `theme`. Only the label changed, in all three places at once, so the three stay identical as §2.1
  requires. Prompted by the v1.4.3 kit update's rule that anything temporary must name the condition
  that retires it — this one's condition had been met for three weeks. (Operator approval, 2026-08-01.)
- **2026-08-02** — **Corrected two stale cells in §3.1's data-model table (INT8-044).** Both described
  a state the project had already left behind:
  - **Music video** read *"modelling TBD in `content-model.md`"*. `content-model.md` §4 settled this on
    2026-07-07 and revised it at INT8-013: Core Media *Remote video* entities referenced by `field_video`
    (oEmbed). Because v2 `Song_Video` stored raw embed markup rather than a bare URL, `content-model.md`
    §9's 2026-07-19 entry descoped the import to **manual, pre-launch entry**; §8's source-mapping table
    already read *"not imported — `field_video` populated manually, pre-launch"*.
  - **Exclude from list** read *"Rename pending"*. The rename shipped at INT8-010: `field_exclude_from_list`
    exists in exported config (`field.storage.node.field_exclude_from_list.yml`), the migration
    (`migrate_plus.migration.song.yml:75`) and `views.view.songs.yml`'s filter.
  Neither decision is reopened — both were correct and complete in `content-model.md`; only this
  document's overview table had not caught up. (`sfk-verify` finding, 2026-08-01; corrected 2026-08-02.)

### `content-model.md`

- **2026-08-02** — **Slice 2 content-model deltas (Milestone 12): `D-h`, `D-b`, `D-d` settled.** Added
  §9 (`page` type + Layout Builder scoping), §10 (`homepage_hero` block), §11 (default content). The
  decisions log moved from §9 to §12; `requirements.md`'s 2026-07-19 entry updated to cite §8/§12.
  - **`D-h` — a general `page` type, not a `homepage` type, with per-node override on.** *This reversed
    the milestone's own recommendation, on the operator's argument:* the site will have exactly one
    homepage but several bespoke pages (About, Terms, Privacy) of the same kind, so a single-use content
    type would be a type per node. The homepage is just the `page` node `front` points at.
    The recommendation had been a dedicated `homepage` type with override **off**, on the grounds that it
    puts the layout in config where it is exported, verified and diff-reviewable. **That benefit is
    genuinely lost** and is recorded in §9.1 rather than glossed: layout changes will not show up in a
    config review. It is outweighed by not minting a content type per page, and bounded by the harder
    half of the rule — **Layout Builder is enabled on `page` and nothing else, never on archive types.**
    *Consequence:* `FR-22` stands **unamended**. Its "body and layout an editor can change without a code
    deployment" clause required override-on; had the recommendation been taken, `FR-22` would have needed
    amending first, which is why it was put to the operator as a spec question rather than decided here.
  - **`D-b` — `homepage_hero` block type; one new field, everything else reused.** `field_message` is the
    only new modelling. The `field_background_images` **storage is shared** with `page_hero` (storages are
    per entity type in Drupal, so this is the ordinary pattern) and `HeroBackgroundFormatter` is a field
    formatter that, by its own docblock, *"knows nothing about being inside a block"* — so **`FR-25` is
    satisfied with no new code**. Placement is a **reusable** block referenced from the layout, **not** an
    inline block: inline blocks have no independent existence and travel inside the serialised layout,
    which is the awkward case for §11's export. The existing `page_hero` region block's `<front>`
    exclusion was **confirmed still valid** — `request_path`'s `<front>` token tracks whatever the front
    page is, so it follows the switch from stub route to node without being re-pointed.
  - **`D-d` — `default_content` 2.x.** Chosen against `default_content_deploy` (built for *repeated*
    environment-to-environment deploys — the enforce direction `NFR-10` warns against),
    `single_content_sync` (manual snippets, wrong shape for install-time seeding), `structure_sync` (no
    node or layout coverage, so a second mechanism would be needed alongside) and an owned
    `hook_install()` (rejected as a *starting point* per lazy adoption — contrib exists, and hand-writing
    a serialised `layout_builder__layout` is the likelier failure than over-engineering; retained as the
    fallback). **The deciding constraint was UUID preservation**, since exported config hard-references
    the `page_hero` block's UUID — that is a gate, not a preference. **Accepted risk:** 2.x is beta with
    no stable release, tolerable because it is an install-time dependency only; confirm its release state
    at M17 before adding it.
- **2026-08-01** — **Reconciled the v2→v5 redirect path-map claim across the spec** (INT8-040):
  `api-contract.md` §1/§4 and `architecture.md` §6 stated, unqualified, that the path map is
  "preserved at migration" — asserting delivered behaviour that does not exist. `architecture.md` §3.3
  and this document's own legacy-id rationale (above) already correctly stated the deferral; those two
  are the correct reading and stand unchanged. Verified against the live site before editing: the
  `redirect` table holds 10 rows against 492 songs — the Redirect module's own automatic entries for
  changed URL aliases, not a v2 path map — and no ticket, `FR`, or `NFR` implements one. No decision is
  reopened here; the deferral already existed in two of the four documents, and this only propagates it
  to the other two (plus a fifth occurrence in `api-contract.md` §4's traceability table, found while
  fixing §1).
- **2026-07-28** — **The Songs landing (`/songs`) stays uncacheable for the Dynamic Page Cache through
  slice 1** (INT8-037; corrects a caching claim in INT8-018's notes — see that ticket). `cache: none` on
  `views.view.songs` (needed since INT8-018 to stop Views' result cache from serving one result set
  across every `type=`/`alt=` combination) forces `max-age 0`, which disables the dynamic page cache for
  the route entirely. **Anonymous visitors are unaffected**: the internal page cache still serves `/songs`
  correctly, with correct tag-based invalidation. **Authenticated users get the full ~490-row landing
  rebuilt on every request** — kept as-is rather than fixed now, under **NFR-4**'s explicit deferral of
  performance thresholds to a pre-launch pass and the project's lazy-adoption principle: the fix (a small
  owned Views cache plugin keying the result cache on `type`/`alt`, the same "no D11-ready contrib, build
  a small owned plugin" pattern already used for `ArticleInsensitiveTitle` and the two filter plugins) is
  real, non-trivial work for a benefit that reaches only the small authenticated population, against a
  performance bar that has not been set yet. **Candidate for the pre-launch performance pass** (NFR-4),
  where it can be judged against real measured thresholds instead of a guess now.
- **2026-07-19** — **Migration imports every `I8_Songs` row and maps `Song_Active → status`** (§8),
  reconciling the earlier "row where `Song_Active = 1` → node" phrasing (which implied a source filter)
  with the `Song_Active → status` mapping row directly below it. The `song` migration deliberately runs
  **unfiltered** and lets `Song_Active` set published/unpublished — lossless (a future inactive row
  becomes an unpublished node, recoverable, not a dropped song). All 492 dump rows are active, so this
  equals importing the active set today (FR-1 satisfied; FR-5 count parity holds). Surfaced by
  `sfk-verify` on the migration batch; the FR-5 count check is hardened to assert *published* count ==
  active-source count in **INT8-025** so it verifies FR-5 literally rather than total==total.
- **2026-07-19** — **`Song_Video` import descoped to manual entry** (§4, §8; supersedes the original
  "migration MUST extract the video URL" plan and `requirements.md` FR-2's inclusion of music video).
  Checked the real dump at INT8-013: only 15 of 492 songs have a video, all clean `<iframe>` embeds
  (14 YouTube, 1 Vimeo) — too small and low-risk a set to justify an automated markup parser. Populate
  `field_video` by hand pre-launch instead. (Operator decision.)
- **2026-07-12** — **CKEditor 5 attached to the Restricted HTML format** (§5 "Authoring UI"): toolbar
  limited to bold / italic / link, matching the `filter_html` allow-list exactly so the editor and the
  filter cannot drift. Discovered during INT8-010 (the format from INT8-009 had no editor, leaving a
  bare-HTML textarea); the editor is part of the format's spec, not optional.
- **2026-07-12** — **`field_legacy_id` extended to the Song type taxonomy term** (§3), closing a gap
  where the cross-cutting convention (architecture.md §3.3, "every migrated content entity") wasn't
  reflected here — only Song had the field listed. Also corrected the working term set's spelling to
  **"Side Projects"** (capital P), confirmed against the `I8_SongType` dump per INT8-008's own
  instruction to reconfirm at build time.
- **2026-07-07** — Song = **node** content type; Song type = **taxonomy**; video = **Core Media remote
  video** (oEmbed); rich text = **Restricted HTML**. (Operator decisions, Milestone 3.)
- **2026-07-07** — `Song_Live` becomes **`field_exclude_from_list`** — the rename away from the "live"
  misnomer; it is purely a "hide from the song list" control.
- **2026-07-07** — **Video migration extracts the URL from v2 embed markup** to build Media entities;
  unparseable rows are reported.
- **2026-07-07** — **FR-8 sort — query-time, no duplicated field** (operator decision). Preferred:
  **Views Sort Expression** (stable/security-covered, but declares `^9 || ^10` — verify D11), else a
  small **owned Views sort handler** (D11-safe). **Views Natural Sort** de-prioritised (alpha-only on
  D11 and duplicates into its own index). Final mechanism deferred to the build milestone, tested on
  the real stack.
- **2026-07-07** — **`field_legacy_id` adopted as a cross-cutting convention** (all migrated content
  entities), not optional: needed at runtime for **cross-entity join repair** in later slices and for
  **legacy-URL / inline-link redirects** (Redirect module), keyed on entity type + legacy id. Not
  required (natively-created content leaves it empty); indexed. Reversed the earlier "optional" call.
