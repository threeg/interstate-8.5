---
id: INT8-044
title: Reconcile two stale cells in `architecture.md` §3.1's data-model table
type: task
status: done
milestone: 9
batch: cleanup
layer: docs
depends_on: [INT8-010, INT8-013]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Two rows in the architecture document still describe decisions as unmade and work as pending, when both
were settled and shipped months ago. Anyone reading that table today would think there is outstanding
work where there is none. Correct the two cells so the document says what the project actually did.

## Background

Raised by `sfk-verify` on the INT8-038–042 cleanup batch (2026-08-01), with both gates green. Two cells
in `spec/architecture/architecture.md` §3.1 (*Entities (slice 1)*) describe a state the project left
behind:

| Cell | What it says now | What is actually true |
|---|---|---|
| **Music video** (line 145) | *"From `Song_Video` (FR-17); modelling **TBD** in `content-model.md`."* | `content-model.md` §4 (*Media: Remote video (oEmbed)*) settled the modelling on **2026-07-07** and revised it at **INT8-013**: videos are Core Media *Remote video* entities referenced by `field_video`, and — because v2 `Song_Video` stored raw embed markup rather than a bare URL — the import was **descoped to manual, pre-launch entry** (`content-model.md` §4, §8, and its §9 decisions-log entry of 2026-07-19). Its §8 source-mapping table already reads *"`Song_Video` (embed markup) — **not imported**"*. |
| **Exclude from list** (line 148) | *"v2 `Song_Live`; hides the song from the landing (FR-6). **Rename pending.**"* | The rename **shipped at INT8-010**. `field_exclude_from_list` exists in exported config (`field.storage.node.field_exclude_from_list.yml`, `field.field.node.song.field_exclude_from_list.yml`), in the migration (`migrate_plus.migration.song.yml:75`, `field_exclude_from_list: Song_Live`) and in `views.view.songs.yml`'s filter. `content-model.md` line 40 already describes it as *"The v5 rename of the `Song_Live` misnomer"* — past tense. |

**Why this is worth a ticket rather than a passing edit.** It is the same class of drift as
[INT8-032](INT8-032-song-type-name-drift.md) (one song-type name spelled two ways) and
[INT8-040](INT8-040-redirect-path-map-deferral-drift.md) (the v2→v5 redirect path map described as
delivered in two documents and deferred in two others) — one fact spelled two ways across the spec, with
the stale copy sitting in a **binding** document. `architecture.md` §3.1 opens by pointing at
`content-model.md` as *"the authoritative field-by-field mapping"*, so this table is the overview a
reader consults first and the one most likely to be trusted without cross-checking. A `TBD` in it reads
as live work.

**Already flagged once, deliberately.** `spec/open-questions.md`'s notes log (2026-08-01) recorded the
first of these while the register was being created, correctly classified it — *"a **stale
cross-reference** rather than an open question … It is spec drift for `sfk-verify`, not a row here"* —
and handed it on. This ticket is that hand-off being picked up. The second cell was found alongside it
while reading the same table.

## Technical requirements

1. **Correct the Music video cell** so it states the settled position and points at where it was settled:
   Core Media *Remote video* via `field_video`, with the `Song_Video` import descoped to manual
   pre-launch entry, cross-referencing `content-model.md` §4 rather than restating its reasoning. Keep it
   to the width the table's other Notes cells use.
2. **Correct the Exclude from list cell** — drop "Rename pending" and name the field that shipped, so the
   cell records the rename as done rather than owed.
3. **Sweep §3.1's remaining cells before editing**, and the surrounding §3 prose, for any further
   deferral or pending-work language that the build has since overtaken. Two were found by reading; a
   third would be found the same way. Record what the sweep covered in `## Notes` — including "nothing
   further", if that is the answer.
4. **Add a dated entry to `architecture.md`'s own decisions log** recording what was corrected and why the
   corrected reading is the right one, so a future reader finds the resolution instead of re-deriving it.
   The evidence belongs in the entry: `content-model.md` §4/§8/§9 for the video, and the exported config +
   migration + View for the field rename.
5. **Do not** reopen either decision, change `content-model.md`'s already-correct text, file a video-import
   ticket, or touch `field_exclude_from_list`. Both decisions stand; only the record is wrong.

Out of scope: the manual pre-launch video-entry task itself (`content-model.md` §4's own deferral, no
ticket and none being filed here); `content-model.md` §4 and §8, both already correct; anything about FR-17's
rendering, shipped at INT8-019.

## Definition of done (acceptance criteria)
- [x] `architecture.md` §3.1's Music video cell states the settled modelling and the manual-entry
      descope, cross-referencing `content-model.md` §4.
- [x] `architecture.md` §3.1's Exclude from list cell no longer says "Rename pending" and names
      `field_exclude_from_list`.
- [x] §3's remaining cells and prose have been swept for the same kind of overtaken language, with the
      outcome recorded in `## Notes`.
- [x] `architecture.md`'s decisions log carries a dated entry with its evidence.
- [x] Gate: docs-only (INT8-046) — no gate required; see `## Notes`.
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: false` — **docs-only** exemption: this changes binding prose to match behaviour that
already shipped, with no code, config or numbered-requirement behaviour touched.

Evidence to re-confirm before editing, so the ticket is acted on against the repository rather than
against this ticket's account of it:

```
grep -n "field_exclude_from_list" config/sync/field.storage.node.field_exclude_from_list.yml \
  web/modules/custom/i8_migrate/config/install/migrate_plus.migration.song.yml
sed -n '/## 4. Media/,/^## 5/p' spec/architecture/content-model.md
```

## Notes
- 2026-08-01 — created by `sfk-verify` on the INT8-038–042 cleanup batch. The first cell was already
  identified in `spec/open-questions.md`'s notes log and explicitly deferred to the verifier; the second
  was found beside it. Cleanup backlog rather than main sequence: it is an internal-consistency fix to
  decisions already made and already correctly implemented, and nothing a user can see changes
  (CONVENTIONS §6.6). Deliberately **not** a specification change (§5.5), on
  [INT8-040](INT8-040-redirect-path-map-deferral-drift.md)'s reasoning: no decision is reopened or made
  here — both were settled elsewhere in the spec, and this only propagates them to the document that
  missed them.
- 2026-08-02 — implemented. Re-confirmed both facts against the repo before editing (per the ticket's
  own evidence commands): `field_exclude_from_list` is live in `config/sync/`, in
  `migrate_plus.migration.song.yml:75`, and in `views.view.songs.yml`'s filter; `content-model.md` §4/§8/§9
  confirm the Remote-video modelling and its 2026-07-19 descope to manual pre-launch entry. Corrected
  both cells in §3.1 and added a dated §7 decisions-log entry citing that evidence.

  **Sweep of §3's remaining cells and prose (requirement 3): nothing further found.** Read every row in
  §3.1 (Title, Lyrics, Notes, Quotes, Song type, Parent song, Lyrics same as parent, Legacy id, and the
  Song type entity row) plus §3.2 and §3.3 for the same "describes a state the build has since
  overtaken" pattern. Two deferral statements remain, both still true rather than stale:
  - §3.1's "Deferred seams" paragraph (a song's releases/live/tabs/studio-sessions relationships are
    inbound from entities not yet built) — those entities are still unbuilt; nothing to correct.
  - §3.3 point 2 ("Building these redirects is deferred to a future SEO slice") — still an open future
    deferral, not something the build has since delivered; distinct from
    [INT8-040](INT8-040-redirect-path-map-deferral-drift.md)'s finding, which was in §6, not here.

  **Gate: docs-only under [INT8-046](INT8-046-scope-default-gate-to-ticket-diff.md).** This ticket's
  diff is confined to `spec/architecture/architecture.md` and this ticket file — nothing under `web/` or
  `tooling/` — so per INT8-046's rule no gate needs to run. (INT8-046 postdates this ticket's own DoD
  text above, which still names `lando test`; applying INT8-046's rule here rather than the now-stale
  wording, consistent with why INT8-046 exists.)
