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
- **It is harvested at version planning.** `sfk-version` scans this file at the start of each version
  and asks which entries the new version will commit to resolving — that is the scheduled read that
  keeps the list alive, and the moment an owed decision gets pulled into scope.
- **Entries leave with zero residue.** An entry is **deleted in the same commit that files its real
  ticket** (its *reuse* and *where it surfaced* notes carry into the ticket's Background). Nothing is
  left behind once the work is ticketed.
- **Capture is cheap but disciplined.** `/sfk-todo <one line>` appends an entry without ceremony, but
  always records the decision owed — so the fast path can't erode the rule above.

## Lifecycle of an entry

```
captured here (decision owed, unspecifiable)
   → selected at sfk-version (its owed decision is pulled into the version's scope)
   → the spec milestones make that decision (brief / requirements / architecture / design / …)
   → ticket generation files a real ticket AND deletes this entry, in one commit
```

An entry never becomes a ticket directly — its blocking decision must be made first, and that happens
in the spec milestones that run **before** ticket generation. That is why the parking lot is read at
`sfk-version` (to pull the decision into scope), not first noticed at ticket generation (too late).

---

## Entries

> One block per item. Keep each self-contained (a stable `id` keeps concurrent appends merge-friendly).
> Delete a block in the commit that files its ticket. Newest first.

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
