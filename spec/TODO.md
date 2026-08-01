# Interstate-8.5 — Parking lot

A **waiting room** for work you *know* is coming but genuinely **cannot ticket yet** — because the
design or product **decision it depends on does not exist**. This is the one place that work is allowed
to live, so the reasoning behind "we deliberately stopped here" lands on disk instead of dying in a
closed ticket's notes. It is committed and shared, so anyone on the team (or a BA planning the next
version) can see it.

> **This is not a second backlog.** Anything that *can* be specified goes to `spec/tickets/BOARD.md`,
> not here. An entry belongs here **only** while it has an open question that blocks it from being a
> ticket. The moment that question is answered, the entry is overdue — it becomes a real ticket and
> leaves this file (see *Lifecycle* below).

## The discipline (why this file doesn't rot)

- **Every entry names the decision still owed.** This is the whole rule. An entry with no open question
  is not a parking-lot item — it is a ticket waiting to be written. No "decision owed" ⇒ it does not
  belong here.
- **It is read twice, on two different rhythms.** `sfk-version` **harvests** it at the start of each
  version and asks which entries that version commits to resolving — the moment an owed decision gets
  pulled into scope. `sfk-signoff` also **sweeps** it at every milestone boundary, surfacing entries
  related to the milestone just finished and asking whether their owed decision has now been made. The
  sweep exists because version planning alone is too coarse: an entry parked early in a version would
  otherwise wait for the *next* version's planning even when its blocker cleared mid-version. The sweep
  only reports and asks — an entry still leaves at ticket generation, never at sign-off.
- **An entry leaves the active list, but its id stays.** The entry **body** is removed in the same commit
  that files its real ticket (its *reuse* and *where it surfaced* notes carry into the ticket's
  Background), and a **one-line tombstone** is added to *Resolved* below. The active list stays short; the
  record survives.
  **Why the id must survive — citation integrity.** A `TODO-n` is **cited while it is open** — in a
  ticket's `## Background`, in a board note (`BOARD.md` cites `TODO-002` today), in a commit message — and
  those citations are written to last. The tombstone is what stops a live citation resolving to nothing.
  That is the same job `spec/id-registry.md` does for every other id family, which is why the rule
  generalises rather than being a quirk of this file.
  **The consequence that makes a violation detectable:** ids are assigned as "next after the highest", so
  if resolved entries vanished the next id would be computed from an undercount and **reuse a number** — a
  collision nothing could catch, because the evidence would be exactly what was deleted. Note that the
  arithmetic alone would be satisfied by remembering one number; it is the citations that require a
  **row**. This also matches how the rest of the spec treats its registers: `BOARD.md` collapses shipped
  versions rather than deleting them, and `spec/open-questions.md` keeps closed rows. Demote, don't erase.
- **Capture is cheap but disciplined.** `/sfk-todo <one line>` appends an entry without ceremony, but
  always records the decision owed — so the fast path can't erode the rule above.

## Lifecycle of an entry

```
captured here (decision owed, unspecifiable)
   → selected at sfk-version (its owed decision is pulled into the version's scope)
   → the spec milestones make that decision (brief / requirements / architecture / design / …)
   → ticket generation files a real ticket AND tombstones this entry, in one commit
```

An entry never becomes a ticket directly — its blocking decision must be made first, and that happens
in the spec milestones that run **before** ticket generation. That is why the parking lot is read at
`sfk-version` (to pull the decision into scope), not first noticed at ticket generation (too late).

---

## Entries

> One block per item. Keep each self-contained (a stable `id` keeps concurrent appends merge-friendly).
> When a block's ticket is filed, remove the block and add its tombstone to *Resolved*. Newest first.

<!-- Template for an entry — copy, fill, place at the top of the list:

### TODO-NNN — <one-line title>

- **Raised:** <ISO date> by <author>
- **Decision owed:** <the open question that must be answered before this can be a ticket — REQUIRED>
- **Reuse:** <what already exists that should survive the decision — components, tests, endpoints>
- **Where it surfaced:** <the ticket / screen / milestone this came out of, if any>
- **Context:** <one or two sentences: what the work is and why it can't be ticketed yet>

-->

### TODO-002 — Site-defining content is not reproducible from the repository

- **Raised:** 2026-07-28 by `sfk-verify` (Claude Opus 5), auditing the cleanup batch (INT8-023–026,
  032–037).
- **Decision owed:** which mechanism captures install-required content — the `default_content` module,
  a small owned `hook_install()` in `i8_services`, a content export/import step, or documented manual
  rebuild steps — **and** whether it is slice-1 scope at all, given there is no deploy target yet and
  the site has only ever been stood up once. Both halves are open: picking a mechanism now for a
  rebuild that may not happen this version is exactly the speculative complexity the project's
  lazy-adoption principle warns against, but so is discovering the gap during a first deploy.
- **Reuse:** the exported config already carries the *shape* of all of it — `system.menu.footer`,
  `block.block.interstate_85_footermenu.yml`, `block.block.interstate_85_pageherobackground.yml`,
  `block_content.type.page_hero.yml` and its field/display config are all committed and correct. Only
  the content entities those point at are missing. The Playwright specs
  (`front-page-nav.spec.ts`, `page-shell.spec.ts`) already assert the rendered result, so whatever
  mechanism is chosen has a ready-made check — they simply cannot fail today, because they run against
  the database that holds the content.
- **Where it surfaced:** `sfk-verify` on the cleanup batch; the content itself came from INT8-017
  (main menu), INT8-026 (footer menu) and INT8-028 (hero block).
- **Context:** three pieces of the shipped site are `menu_link_content` / `block_content` entities that
  live only in the development database: the primary nav's **Home** and **Songs** links — the Songs one
  being the concrete realisation of **FR-16** — the five footer labels, and the `page_hero` background
  block, whose UUID `block.block.interstate_85_pageherobackground.yml` hard-references in both its
  `dependencies.content` and its `plugin` key. A fresh `site-install` + `config:import` would therefore
  produce a site with no primary navigation, an empty footer label row, and a broken hero block, while
  every gate stayed green — `lando test` and `lando playwright` both run against the existing database.
  NFR-6 binds *configuration* to be exported and verified; nothing in the spec covers *content* the
  site requires in order to match its own requirements and design. Not filed as a ticket because the
  mechanism decision genuinely does not exist: a ticket written now could only restate the gap, and
  would have to invent the answer it is supposed to implement.

### TODO-001 — Song page: redesign the alternate-version composition

- **Raised:** 2026-07-26 by Gregg (site owner), reviewing INT8-020.
- **Decision owed:** a design pass that places the alternate-version view **inside the real song page**
  — either an updated hi-fi export or an equivalent decision recorded in `design-system.md` §3 (Lyric
  pair) — resolving three things: where the pair sits relative to the quote, the lyrics, the notes and
  the right-hand rail; whether it keeps the panel framing (border + `--color-tint` header bar) or
  dissolves into the page; and how the parent cross-link and the "alternate versions" list relate to it.
- **Reuse:** the `lyric-pair` SDC (deliberately structural — two slots, no props); the song-versions
  data resolution, now in `i8_services` (INT8-035); and
  `tests/playwright/tests/song-versions.spec.ts`, whose 17 assertions are written against *behaviour*
  (FR-13/FR-20) rather than layout — the side-by-side/stacking checks are the only geometry-specific
  ones, and the only ones a redesign should need to revisit.
- **Where it surfaced:** INT8-020 (now `done`).
- **Context:** INT8-020 shipped FR-13/FR-20 as specified and its tests pass, but review found the result
  unsatisfying in a way that isn't a bug list: the alternate block is missing the light-blue
  (`--color-tint`) header bar the hi-fi draws above the two lyric columns, and — more substantially —
  the hi-fi only ever draws this composition **as an isolated panel**, never within the full song-page
  layout, so how it should sit within the page was never actually settled by the design. The site
  owner's assessment is that the current arrangement does not work. Not filed as a ticket because the
  design decision doesn't exist yet: patching the missing header bar onto a composition that is about to
  be replaced would be work thrown away, and a ticket written now could only restate the problem, not
  specify the outcome.

---

## Resolved

> One line per entry that has become a ticket — a **forwarding address**, not a parking-lot item.
> **Never delete a line from here:** it is what keeps a live `TODO-n` citation resolvable, and the trace
> from a parked idea to the work it became.
>
> **Never harvested, never swept.** `sfk-version` harvests this file and `sfk-signoff` sweeps it, and a
> resolved row reads exactly like a parked item whose decision has just been made. **Only the *Entries*
> list above is in scope for either read.**

| Id | What it asked | Answer | Became | Retired |
|----|---------------|--------|--------|---------|

_(Nothing resolved yet — `TODO-001` and `TODO-002` are both still open above. The table was added at the
v1.4.3 kit update; a check of `git log -p -- spec/TODO.md` confirmed no entry has ever been deleted, so
the high-water mark is `TODO-002` and needs no seed row.)_

> **Why *what it asked* rather than a title.** An entry's identity **is** its owed decision (see *The
> discipline*) — a title names the topic, and the topic is not what was undecided. A citation cites the
> entry for its question, so that is what the row has to answer.
>
> **`Answer` is the column that carries what would otherwise be lost.** A ticket states a decision as a
> premise; it does not record the question it settled, so an answer that did not survive into the ticket
> survives nowhere. Three cases are worth writing down explicitly, because none of them does: the work
> **widened beyond the entry's scope** at scoping; the answer **reversed a decision made earlier**; or
> **it was never an open decision at all** — the spec already required it — which is a finding about the
> parking lot rather than about the work.
>
> **The row records the answer, not the reasoning.** Reasoning belongs to the ticket that inherited it,
> and a second copy here is exactly the residue the *Lifecycle* rule exists to prevent. Keep it to one
> line: the wider columns invite a paragraph, and a paragraph belongs in the ticket named under *Became*.
> This table grows once per *resolved* entry — a handful per version — so it can afford a sentence where
> the active list above cannot afford a paragraph.
