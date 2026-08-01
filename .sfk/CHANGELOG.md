# SFK changelog

Changes to the Spec-First Kit, newest first. Each entry is the migration script `sfk-update-kit`
follows: it applies every entry newer than a project's `applied_version` (see `manifest.md`).

For each change, the **Apply** note tells the update skill how to bring it into an existing project:
*refresh* (overwrite the kit-owned file), *add* (insert a new section/heading into a living file),
*amend* (apply a wording/guidance change), or *interview* (ask the user, because content is needed).

A change may also carry a **Pre-copy** note. `Apply` happens *after* the user copies the new `.sfk/` +
`.claude/` over their project; **`Pre-copy` is an instruction to the human, *before* that copy** — used
when the copy would destroy something the project owns or filled in. Any entry with a `Pre-copy` note
must also have a section in the repo-root `UPGRADING.md`, because nobody reads a changelog until they
are told to.

---

## v1.4.3 — the board says what it means, and a tombstone keeps the answer

Four items from one project's second pass, all about **records that exist but cannot be read**: a status
column nobody can scan, an ordering constraint that lives only in row position, a tombstone that drops the
one thing worth keeping, and an update note with no answer for "we already built this". **No pre-copy
step.**

- **FIX (minor): an `add` delta now checks whether the project already built the feature under another
  name.** `sfk-update-kit`'s four Apply verbs (*refresh* / *add* / *amend* / *interview*) had no case for
  it, so an `add` followed literally leaves an **empty kit-named section beside a populated local one**,
  with the file's own prose pointing at the second. This happens **by construction, not by accident**: the
  kit adopts ideas that came from projects, so the project that *originated* a feature is the first to meet
  it again as an `add` — and it is the one most likely to have the richer version. Reported by the project
  that originated v1.4.1's tombstones and hit exactly this on its next update.

  Handled as a **standing check inside step 3's `add`** rather than a fifth `reconcile` verb: a check that
  always runs does not depend on every future changelog author predicting the case at write time. The rule
  is *never add the duplicate; keep whichever version is richer; the project's heading wins; record the
  mapping*. The mapping goes **once, in the project's own file** — skills name sections by heading, and one
  pointer line beats a hedge in every skill that mentions the section.

  **Apply:** **n/a — kit-owned**, the copy applies it. Note that it governs *this* update's own `add` notes.

- **FIX (minor): a `TODO.md` tombstone records what was asked and what was decided.** Two problems with
  v1.4.1's version, both from the project that invented the mechanism.

  **The stated justification did not require the rule.** v1.4.1 justified a row per resolved entry by id
  arithmetic — "next after the highest" undercounts if entries vanish. True, but that only requires the
  **high-water mark** to survive, which a single number would do. The reason that requires a **row** is
  **citation integrity**: a `TODO-n` is cited *while it is open* — in a ticket's `## Background`, a board
  note, a commit message — and those citations outlive the entry. A rule whose stated rationale doesn't
  require it is the kind that gets "simplified" later by someone who reads only the rationale. Citation
  integrity now leads wherever tombstones are justified, with the arithmetic kept as the **detectable
  symptom** — which also puts the template and `id-registry.md`'s equivalent bullet on one argument
  instead of two that argue past each other.

  **And the reason dictates a schema the terse row could not carry.** `Id | Title | Became | Resolved`
  rested on *"the detail lives in the ticket now"* — true only for detail that survived into the ticket. A
  ticket states a decision as a **premise**; it never records the question it settled. Now
  `Id | What it asked | Answer | Became | Retired`: *what it asked* because an entry's identity **is** its
  owed decision (a title names the topic, and the topic is not what was undecided), and *answer* because a
  scope change at scoping, a reversal of an earlier decision, or *"this was never an open decision at all"*
  otherwise survives nowhere. `Became` stays its own cell so the ticket id remains greppable. The one-line
  discipline stays, pointed at the right guard: **the row records the answer, not the reasoning.**

  Also fixes a **latent bug** the same report found: `sfk-version` harvests this file and `sfk-signoff`
  sweeps it, and neither was told the *Resolved* table is out of scope — a tombstone reads exactly like a
  parked item whose decision has just been made.

  **Apply:**
  - **amend** — `spec/TODO.md`. **Check first whether the project already has this table under another
    heading** (see the first item above) — the project that reported it does. Rewrite the *Resolved*
    preamble and discipline bullet, and migrate the table header: `Title` → `What it asked`, `Resolved` →
    `Retired` (renames), `Became` unchanged, and **insert the new `Answer` column**;
  - **interview** — the `Answer` cell of **existing** rows. It **cannot be recovered from the file**, and
    frequently not from the ticket either. Offer to fill each from the ticket named in `Became`; where that
    yields nothing, write `—` rather than inventing one, and **never** block the update on it. A `Title`
    carried into *What it asked* usually needs rewording from a topic into the question — offer, don't
    rewrite silently;
  - **amend** — the `spec/TODO.md` bullet in the root `CLAUDE.md`;
  - **refresh** — `spec/README.md` (the parking-lot paragraph);
  - **n/a — kit-owned** — `sfk-todo`, `sfk-version`, `sfk-signoff`, `sfk-next-milestone`.

- **NEW (minor): `BOARD.md` status cells carry an icon as well as the token.** `spec/milestone-plan.md` has
  always used ⬜ / 🔶 / ✅ and is scannable; the board used bare text for five statuses and is not. On a
  96-ticket board the routine question — *what is open right now?* — meant reading every row for a token
  that looks like every other token in the column. The reporting project had already invented a workaround
  (hand-bolding notable rows, applied inconsistently because nothing defined it), which is good evidence
  the template was missing an affordance rather than that the project was untidy.

  Three of the five icons are **reused from `milestone-plan.md`**, so the method has one icon vocabulary
  rather than two; `blocked` and `in-review` have no milestone equivalent and take ⛔ and 👀.

  Two constraints matter more than the icons. **The board writes `<icon> <token>`, never the icon alone** —
  status is `grep`-ed (by `spec/verify/verify.md`'s board-versus-ticket check, and by hand), and **a sweep
  that matches nothing looks exactly like a sweep that found nothing wrong**; emoji also render at
  inconsistent widths, so icon-plus-text degrades to something still readable. And **a ticket's own
  `status:` frontmatter keeps the bare token** — it is machine-read; only the board is scanned by eye.

  **Apply:**
  - **amend** — `spec/tickets/BOARD.md`: the status legend, and prefix each status cell in every table with
    its icon (mechanical and safe — the token is unchanged, the icon is added in front);
  - **amend** — `spec/tickets/CONVENTIONS.md` §2 (the status table gains a *Board icon* column) and §5.4
    (the cell format, the reason, and a new rule **forbidding ad-hoc row emphasis** — bolding invented row
    by row ends up carrying several meanings at once);
  - **amend** — the *Status lifecycle* bullet in `spec/tickets/CLAUDE.md`;
  - **n/a — kit-owned** — `sfk-next-ticket`, `sfk-close-ticket`, which now state the format where a status
    is actually written.

- **NEW (minor): a promoted ticket's ordering is data, not row position.** The board could not express that
  a ticket must be worked **out of id order**, so the only record was where its row sat — and row position
  is invisible.

  **The structural cause:** §4.3 forbids forward dependencies and §1.1 never renumbers, so when review finds
  that a **later**-numbered ticket must precede an **earlier**-numbered one, the constraint **cannot be a
  `depends_on` edge at all**. That is not an edge case — cleanup tickets are by construction numbered after
  everything they clean up, so it is the *normal* output of a verification pass. The reporting project hit
  it three times in one version and carried it as prose beneath a 96-row table.

  Two additions, which are really one change: **`before:`** frontmatter (§4.6) — the dual of `depends_on`,
  **explicitly permitted to name a lower id** — and a **`flag` column** on the board carrying
  `🔺 before <id>`, its visible mirror. The field without the flag is invisible; the flag without the field
  is decoration. `before` does **not** weaken §4.3, whose invariant is that *`depends_on`* never points
  forward so that ids read in execution order; its purpose is that a genuine constraint gets **recorded**,
  not that an inconvenient one goes unrecorded. Both edges impose the same start condition, so
  `sfk-next-ticket`'s pick rule now honours both, and `sfk-verify` audits that flag and field still agree —
  worth a deliberate check because this is the one constraint with **no other way to fail loudly**: a
  re-sort, a version-section move or a hand edit drops it while leaving the board looking perfectly ordinary.

  **Rejected from the same report, deliberately.** A **3-level priority scale**: it would duplicate what row
  order and `depends_on` already encode (two answers to *what's next?*, with no way to detect a
  disagreement), it would have no lifecycle owner unlike `status`, and levels with no definition converge on
  the maximum. Promotion survives precisely because it **is** a definition — *would this fail a gate?* A
  **⚠ "decision owed" flag**: that is `blocked`, which already exists and already has an owner; §2 now
  requires a blocked ticket to name **what** it is blocked on, which was the real gap.

  **Apply:**
  - **add** — the optional `before:` line to `spec/tickets/TICKET-TEMPLATE.md`'s frontmatter block;
  - **amend** — `spec/tickets/CONVENTIONS.md`: §3 gains the `before` row (and the note that it is the one
    **optional** field), §4.2 gains the inverse start condition, **§4.6 is new** (the old §4.6 *Epics carry
    no edges* becomes §4.7), and §6.5 now records promotion in three places;
  - **amend** — `spec/tickets/BOARD.md`: a **`flag` column** in the execution-order and cleanup tables
    (leave every existing cell blank), the flag legend, and the note that top-to-bottom order is
    authoritative while id order is not;
  - **amend** — the *Go in order* and cleanup bullets in `spec/tickets/CLAUDE.md`;
  - **`before:` is optional — existing tickets need no edit.** Absent means the same as `[]`, so **do not**
    sweep the ticket files to add it. If the project has promoted tickets recorded only in prose or by row
    position, **offer** to convert each to a `before:` + flag pair, interviewing for which ticket each must
    precede; skip if the user declines;
  - **n/a — kit-owned** — `sfk-next-ticket`, `sfk-verify`.

---

## v1.4.2 — the spec-first ordering rule is enforced where it is exercised

One fix, to the kit's most central discipline. Spec-driven development depends on the spec changing
**before** the code that relies on it — and the kit stated that in six places but never at the moment an
implementer acts on it. **No pre-copy step.**

- **FIX (major): a ticket amends the spec *before* the dependent code, not as a closing chore.** Observed in
  the field as an agent reporting *"I still need to complete the spec amendments (FR-35, api-contract.md,
  Q-14) before closing out the ticket"* — the exact reverse of the rule. The rule existed, but only as a
  **Rules bullet** at the bottom of `sfk-next-ticket`, below a 150-line Procedure the implementer is actually
  following; and the **Definition of done never mentioned spec amendments at all**, so nothing made one a
  precondition of `in-review` and it was free to drift to the end. The same failure pattern v1.4.1 recorded
  for authorship trailers: *a rule written where it is stated rather than where it is followed does not get
  followed.*

  **Why order is not bookkeeping:** asked *before* the code exists, "amend the spec" and "fix the code to
  match it" cost the same, and the user chooses freely. Asked *afterwards*, amending is cheap and changing
  the code looks expensive — so **sunk cost decides, and the user's veto is gone**. It also destroys the
  evidence: nobody can later tell whether the spec was a decision or a rationalisation, which is precisely
  what makes `sfk-verify` code mode meaningful rather than circular.

  The distinction to preserve: the spec being **silent** is an open question — record a `Q-n`/`S-n` row and
  carry on. The spec being **wrong** stops you.

  **Apply:**
  - **refresh** — `sfk-next-ticket`, whose implement step now carries a STOP: halt before the dependent
    code, put the choice to the user both ways, amend the owning document and its decisions log first, then
    implement;
  - **amend** — the *binding specification* non-negotiable in the root `CLAUDE.md` (it said "change the
    relevant file first"; it now names the stop point, the two-way question and the sunk-cost reason);
  - **amend** — the root `CLAUDE.md` *Definition of done*, which now requires that any spec amendment the
    ticket needed was made **before** the dependent code and is referenced, so a ticket cannot reach
    `in-review` with one owed; and its *completion report* paragraph, which now asks the ticket to say
    **when** an amendment happened, so a reverse-order one is visible at review rather than silently
    corrected;
  - **amend** — §5.5 of `spec/tickets/CONVENTIONS.md`, which gains the ordering, the reason and the
    `in-review` bar.

---

## v1.4.1 — fixes from a project pass: records that fail silently, and files that only grow

Eight fixes to existing features, all from one project's feedback. The theme running through them: a rule
recorded where it is *checked* rather than where it is *followed* does not get followed, and a record that
can fail independently of its prose counterpart fails silently. There is **no pre-copy step**.

- **FIX (major): a ticket's commit now carries an authorship trailer per model that built it.**
  `sfk-next-ticket` is the only place in the kit that knows both which model authored the failing test and
  which implemented against it — and it passed that knowledge to no artefact, so whether the
  `Co-authored-by` trailers appeared depended on the runtime's default, which supplies one only for the
  model currently driving and can never produce the pair. A project found **ten consecutive commits with no
  trailer at all**, and it survived a week because **prose and trailers fail independently**: the red-green
  evidence in every ticket's `## Notes` was exemplary, so a reviewer reading the notes found nothing
  missing. The rule had lived only in `spec/verify/verify.md` — the verifier's own instructions, read once
  per batch at audit time. Work commits now carry one trailer per model (two under independent test
  authorship with `tests_required: true`); the status-only finalizes in `sfk-next-ticket`,
  `sfk-close-ticket` and `sfk-signoff` carry one, and `sfk-signoff` includes it in the commands it presents
  when handing off. **Apply:**
  - **refresh** — `sfk-next-ticket`, `sfk-close-ticket`, `sfk-signoff`, `sfk-verify`;
  - **amend** — insert the *Authorship trailers* bullet into `spec/tickets/CLAUDE.md` beside the
    commit-message convention;
  - **add** — insert **§4b (Authorship trailers)** into `spec/verify/verify.md` **only if that file exists**
    (it is lazily created by `sfk-verify`); it seeds the one-line `git log --format=…%(trailers…)` check.
    Two traps are recorded there: match on the **model family**, never an exact string (legitimate variants
    like `Claude Opus 5 (1M context)` exist, and a check that rejects one gets switched off), and never
    match against the **contractual model identifiers** the project pins in its spec — those are spec
    values, not trailer text, and would give a check that can never pass.
- **FIX (major): a resolved parking-lot entry leaves a tombstone, so its id is never reused.** `sfk-todo`
  assigned `TODO-NNN` as "next after the highest existing" by reading `spec/TODO.md`, while that file's own
  lifecycle **deleted** an entry outright once its ticket was filed. So "highest existing" undercounted, and
  the instruction followed literally reused a number — reproduced in the field: `TODO-005` was raised,
  resolved and deleted, and later the same session a new item was assigned `TODO-005`. Nothing in the file
  could reveal it, because the erased entry *was* the evidence. Now the entry **body** is removed and a
  one-line **tombstone** (id · title · the ticket it became · date) goes into a new **Resolved** table, so
  "next after the highest id in the file" is correct by construction. This brings the parking lot into line
  with the kit's other registers — `BOARD.md` collapses shipped versions and `open-questions.md` keeps
  closed rows: **demote, don't erase.** Rejected the alternative of reconstructing ids from git history,
  since `sfk-todo` runs in Cowork too, where it may run no `git` at all. **Apply:**
  - **add** — append a **`## Resolved`** section to `spec/TODO.md` from the new pristine template (table:
    Id · Title · Became · Resolved);
  - **interview** — **the high-water mark cannot be recovered from the file**, because previously-resolved
    entries were deleted. Where the runtime permits git, offer to reconstruct the tombstones from history
    (`git log -p -- spec/TODO.md`, looking for removed `### TODO-` headings) and their tickets. Where it does
    not, **ask the user for the highest `TODO-` id ever issued** and record a single tombstone row for it so
    the next id is right. Do not skip this: an unseeded table reproduces the original bug on the next
    `sfk-todo` run.
  - **add** — insert the `TODO-n` family row into `spec/id-registry.md`, which v1.4.0 omitted, together with
    the general rule: *if a family's entries are ever removed from the document that lists them, that
    document must keep a permanent record of the id.* Recorded as a check to run before inventing any family
    with a delete-on-resolve lifecycle.
  - **refresh** — `sfk-todo`, `sfk-next-milestone`, `sfk-version`, the method guide; **amend** — the
    `spec/TODO.md` line in the root `CLAUDE.md` and the contrast paragraph in `spec/open-questions.md`.
- **FIX: `pr` review mode no longer waits for an approval you cannot give.** The mode treated the forge
  **merge** as the approval — which deadlocks in its most common case, because a user cannot submit an
  approving review on their own PR. Reported from a project that abandoned the mode over it. Approval in
  **both** modes is now the user **invoking `sfk-next-ticket` or `sfk-close-ticket`**, which squash-merge
  the PR as part of finalizing; the Approve button is not used at all. This deletes an inconsistency rather
  than inventing a model — `sfk-close-ticket` already said *"running this skill is your approval"*.
  **`sfk-signoff` no longer finalizes tickets**: a ticket's lifecycle belongs to the ticket skills, and
  sign-off often runs in Cowork where it may run no `git`, so it could neither merge nor verify a merge. It
  now requires a clean queue and stops, naming the ticket. A building milestone ends
  `sfk-close-ticket` → `sfk-signoff` — one extra command, for a boundary that holds in every runtime.
  Also documents what the mode **is** (a durable, line-anchored review surface a skill can read back; checks
  before merge; an unmerged rollback boundary) and what it **is not** (a second reviewer — the PR is authored
  by whoever's git identity the agent runs under). **Apply:**
  - **refresh** — `sfk-next-ticket`, `sfk-close-ticket`, `sfk-signoff`, `sfk-address-review`;
  - **amend** — the *Review mode* bullet in the root `CLAUDE.md` (**preserve the project's own forge/CLI
    value**) and its *Definition of done* paragraph; the status-lifecycle rows in
    `spec/tickets/CONVENTIONS.md` §2 and the finalize bullet in `spec/tickets/CLAUDE.md`.
  - **n/a for projects on `in-place`** except the sign-off change, which applies to both modes.
- **FIX: `sfk-address-review` fetched only half a review.** It suggested `gh pr view --comments` while
  instructing the agent to read *"inline (line-level) and conversation-level"* comments — but line-anchored
  review comments come from a **different endpoint**, so the configured command could return only the
  timeline. Survivable while the merge was the real gate; serious once comments are the only channel. It now
  fetches **both**, states how many of each it found, and treats an empty inline fetch as a **fetch failure
  rather than an empty review**. Also adds the instruction that makes the loop work: **submit a review**
  (*Files changed → Start a review → Submit review → "Comment"*), not a conversation comment — a submitted
  review records the commit it was made against, which is what gives *changes since your last review* and
  resolvable threads. **Apply:** refresh — `sfk-address-review`; **interview** — reconfirm the project's
  fetch commands, and **verify on the first run that they actually return a line comment** visible on the
  forge.
- **`sfk-signoff` sweeps the parking lot and the open-questions register.** Both had scheduled reads coarser
  than a milestone, so an item whose blocker cleared mid-version could age out an entire version: the parking
  lot was harvested only at `sfk-version` (a project had four entries parked, three with a caller inside the
  current version), and the register had **no scheduled read for answers arriving at all** — v1.4.0 sharpens
  questions at batch boundaries but never asked whether the answer came. Sign-off now surfaces related
  entries and rows and asks once. For parked items: *is the decision now made?* — recorded and carried,
  **never filed as a ticket** (an entry leaves at ticket generation, behind that step's gate). For questions:
  *has the answer arrived?* **and** *has the ask actually been sent?* — the second catches a question
  sharpened into something precisely answerable that nobody sent. It is two file reads, so it is safe in
  every runtime, and **it can never block a sign-off**. **Apply:** refresh — `sfk-signoff`, `sfk-todo`;
  **amend** — the *harvested at version planning* bullet in `spec/TODO.md`, the parking-lot paragraph in the
  method guide, and the rules list in `spec/open-questions.md`, so both scheduled reads are documented.
- **Keep the always-loaded `CLAUDE.md` lean.** The root `CLAUDE.md` is the one file read every session, and
  it is also where the kit appends correction notes — with nothing ever pruning them. A project had three
  accumulated inline, **every one already recorded in the owning document's decisions log**. The cost is not
  tokens but **dilution**: a rule that goes unread is how rules fail. Two changes — the template now states
  that **corrections are logged where the value is defined, not inline** (an inline *"this used to say X"* is
  loaded into every future session to describe a value no future reader ever saw), and **anything temporary
  must name the condition that retires it** (*"delete when `<PRJ>-042` lands"*) — the same discipline the
  verifier applies to its own exceptions, since an exception with no expiry becomes an instruction to stop
  looking. `sfk-update-kit` gains a step that **offers** to prune spent notes and expired blocks. **Apply:**
  refresh — `sfk-update-kit`; **amend** — the guidance block at the top of the root `CLAUDE.md` (skip if the
  project deleted it); **offer** — a first prune pass over the existing file, removing nothing without
  confirmation and naming the decisions log that already holds each note.
- **`sfk-verify` confirms as a structured choice, and settles the mode first.** Step 1 announced mode and
  model then waited for free text, though there are exactly four valid answers — proceed, change mode, switch
  model, abort — and the two *change* branches are what free text handles worst, since correcting an
  inference means writing a sentence the agent must interpret. It now asks one question with an option list.
  Also fixes an ordering bug introduced with spec mode: confirmation sat **before** mode determination, so
  the agent could not state the mode it was asking about. Deliberately narrow — a picker is earned by a
  **closed set of mutually-exclusive actions**, so the batch-boundary offer (a yes/no) and the new sign-off
  sweep (report-and-ask-once) keep their current shape. **Apply:** refresh — `sfk-verify`.
- **`BOARD.md` links every ticket and epic id to its file.** `contents.md` links what it indexes; the board —
  navigated far more often — left ids as plain text. Now `[<PRJ>-036](<PRJ>-036-<slug>.md)` everywhere: the
  `id` column, `depends_on` cells, epic and traceability tables, prose. Baked into the convention because the
  board is a **derived, regenerated** view, so a one-off pass does not survive the next ticket-generation
  run. Every writer emits linked ids — ticket generation, `sfk-next-ticket`, `sfk-close-ticket`, and
  `sfk-verify` when it files a promoted cleanup ticket. **The trap, pre-debugged by the reporter:**
  decoration wraps **inside** the link — `` [`<PRJ>-064`](…) ``, never `` `[<PRJ>-064](…)` ``, which puts
  link syntax inside a code span and renders as literal brackets. A naive regex over the id pattern produces
  exactly that. **Apply:** **amend** — §5.4 of `spec/tickets/CONVENTIONS.md` and the ticket-workflow bullet
  list in `spec/tickets/CLAUDE.md`; **offer** — a one-off linkify pass over the existing `BOARD.md`,
  expanding outward over any symmetric backtick or `**` pair *before* wrapping.
- **Independent-test-authorship headers stay compact.** Test-file header docblocks were ballooning — one
  reported at 219 lines, which trimmed to **27 with no assertion changing**. The mechanism compounds: a
  subagent shown a prior file as precedent imitates its density, so each file inherits the last one's
  verbosity plus its own. The delegation prompt now says to keep the header to **only what the ticket and
  spec did not settle**, never to restate the type surface, to give a one-line pointer where a decision is
  *"mirror the sibling file"* — and **never to match the house style** of prior files, which is the
  instruction that causes the compounding. What survives the trim is the valuable part: where the test-writer
  had to invent a decision because the spec left a gap, that is usually an **`S-n` row** in
  `spec/open-questions.md`. **Apply:** refresh — `sfk-next-ticket`.

---

## v1.4.0 — three living registers, spec-level verification, and asking later

One data-loss fix, three new project documents, and a shift in *when* the kit asks you things. Theme, if
there is one: the kit stops guessing — it records what it doesn't know instead of inventing it, and it asks
each question at the point the answer exists. There is **no pre-copy step**; nothing a project owns is
overwritten.

- **FIX (major): a delta milestone no longer copies a template over your living spec.**
  `sfk-next-milestone` step 3 said, unconditionally, to copy the milestone's template out into its working
  `spec/` location before filling it. On a **delta version** that document already exists and **is the
  binding specification**, so following the instruction literally replaced a signed-off `requirements.md`
  or `architecture.md` with a skeleton of placeholders — silently, at the start of the milestone, before
  you saw anything. The method guide already said the spec is amended in place, so two kit documents gave
  opposite instructions and the destructive one was the one the agent ran. The copy is now conditional on
  the working document **not existing**, and the previous version-brief-only exception is **deleted** rather
  than extended: the file's existence is the whole test, so there is nothing left for an agent to reason its
  way around. Where the document exists, the milestone reads it, amends in place, and presents a diff.
  **Apply:** refresh — `sfk-next-milestone`; **amend** — the *How versions evolve* section of the method
  guide gains the "a delta milestone amends, never regenerates" note (kit-owned; arrives with the copy).
- **New: `spec/open-questions.md` — the register of what you're building against but can't confirm.**
  `Q-n` for what you need from the client, `S-n` for what you owe yourselves. Two rules carry it: **an open
  question never blocks work** (build to the documented assumption — it is a *dependency* register, not a
  blocker list) and **an answer is a specification change, not a cleanup ticket** (amend the owning document
  first, then code). Every place built on an assumption **cites its id**, so one search finds them all when
  the answer lands. Capture is **automatic and unasked** — recording what you don't know is always correct —
  so the rule lives in the always-loaded root `CLAUDE.md` and rows are opened by whichever skill hits the
  unknown. No new skill. §1 is written in plain language on purpose, so it can be sent to a client as it
  stands and returned with the *Answer* column filled in; §3 is the ingest path. Closed rows are **never
  deleted**: the answer and its date are the audit trail for why the code says what it says. **Apply:**
  - **add** — create `spec/open-questions.md` from `.sfk/templates/spec/open-questions.md` if absent, laid
    down **empty** (both tables keep their placeholder row only), replacing `<PROJECT>`; committed like any
    living doc;
  - **add** — insert the `spec/open-questions.md` line into the root `CLAUDE.md` *Where things live*, and
    the "when you and the user are both guessing, record it" bullet into its *Non-negotiables*;
  - **offer** (step 5 backfill) — **sweep the existing spec for `(to confirm)`, `TBD` and similar markers
    and turn each into a row**, interviewing briefly for the plain-language question and the assumption.
    This is the highest-value part of the migration for an existing project: those markers are exactly what
    the register replaces. Offer it; do not force it, and do not delete a marker whose row the user declines.
  - **refresh** — `sfk-next-milestone`, `sfk-next-ticket`, `sfk-verify`, `sfk-version`, `sfk-todo`, `sfk-init`.
- **New: `spec/contents.md` — one index of every specification document.** Every spec document in milestone
  order, linked, one line each, so finding a document doesn't mean opening folders — most valuable for
  `wireframes/` and `design/`, whose shape is least predictable. Each section's **first entry is that
  section's binding master**; anything under it is supporting context, which makes the binding/supporting
  split visible for the first time (it was previously prose in `CLAUDE.md` only). Links point at **files,
  never numbered-section anchors**, and following one then using the browser's back button is the whole
  navigation model — so no other document needs a link back. **Regenerated, not maintained:** `sfk-signoff`
  rewrites the sections its milestone touched, preserving hand-written descriptions; `sfk-verify` checks
  every spec file appears and every entry still exists. `tickets/<PRJ>-*.md` is deliberately **not**
  enumerated — `BOARD.md` is their index. **Apply:**
  - **add** — create `spec/contents.md` from `.sfk/templates/spec/contents.md` if absent, replacing
    `<PROJECT>`, **then populate it from this project's actual `spec/` tree**: walk `spec/` for `*.md`, one
    row per file, binding master first in each section, a one-line description each, and **delete every
    placeholder row the template ships with**. Do *not* lay this one down empty — an index of placeholders
    is worse than no index. Skip `tickets/<PRJ>-*.md` entirely. Drop sections for milestones this project
    doesn't have (e.g. no UI).
  - **add** — insert the `spec/contents.md` line into the root `CLAUDE.md` *Where things live*;
  - **refresh** — `sfk-signoff`, `sfk-verify`, `sfk-init`, and the method guide (which gains the link to it).
- **New: `spec/id-registry.md` — what each id prefix means and which document defines it.** The spec cites
  itself by id constantly (`FR-9`, `NFR-3`, and whatever families a project invents); a large spec
  accumulates thousands of citations and none of them explained themselves. One row per **family**, not per
  id — families are rare and stable, so this is written once and barely maintained. It is a **navigation aid,
  never binding**, and a rule's content is never copied into it. To find what a specific id *says*, **search
  for it**: ids are unique, permanent and always backticked, so one search finds the definition *and* every
  citation. **Explicitly rejected, and recorded as such:** linking every citation, and linking ids to
  numbered-section anchors — ids are list items not headings, and numbered headings make anchor slugs embed
  section numbers that break silently on any renumber. **Apply:**
  - **add** — create `spec/id-registry.md` from `.sfk/templates/spec/id-registry.md` if absent, replacing
    `<PROJECT>` and the `<PRJ>` prefix, **then populate it from the id families this project actually
    uses**: scan `spec/` for id prefixes in use (`FR-`, `NFR-`, `Q-`, `S-`, plus any the project invented)
    and write a row for each; **delete the template's `<X>-n` example row**. Do not invent families.
  - **add** — insert the `spec/id-registry.md` line into the root `CLAUDE.md` *Where things live*;
  - **refresh** — `sfk-next-milestone`, `sfk-init`, and the method guide (*Resolving an id*).
- **`sfk-verify` gains a spec mode: review the spec before it becomes work.** The verifier audited code
  against the spec; nothing audited the spec against itself. That gap is structural — the spec is authored
  across six milestones, each in its own session, so no context ever holds all of it at once and
  per-milestone sign-off cannot see cross-document drift. **Spec mode** reads all the authoring deliverables
  together: coverage forwards and backwards, whether the brief still describes the spec, cross-document
  contradiction, testability, terminology drift, leftovers, register integrity, and whether a ticket queue
  could actually be derived as it stands. It runs **before ticket generation**, where a surviving
  contradiction becomes tickets and then code, and `sfk-next-milestone` now **offers** it at that gate. A
  mode rather than a twelfth skill; the roster stays at eleven. **Mode is selected by the milestone the
  current version is on** (from `spec/milestone-plan.md`) — explicitly *not* by whether code exists, which
  is always true from v2 onward while the delta spec still needs reviewing. **Spec mode needs no
  configuration and never creates or reads `spec/verify/verify.md`.** Three limits: it reports inconsistency
  but never disputes a settled decision; findings become spec amendments, open questions or parked items,
  never tickets; and amending a signed-off document needs your explicit approval plus a decisions-log line.
  **Apply:** refresh — `sfk-verify`, `sfk-next-milestone`, and the method guide's skills table. No project
  content changes; `spec/verify/verify.md` is untouched and still code-mode only.
- **A `task` ticket can change what a person sees, and now has somewhere to say so.** Only the `Story` body
  had a design section, so in a project whose rendering work is all `Task`-shaped there was nowhere to cite
  the design and an implementer picked values by eye. Both bodies now carry **`## Design authority`** — named
  for *authority*, not *references*, because the point is which artefact **binds** — asking for artefact,
  section and values, so "as per the mockup" is not an answer. `design-system.md` gains **§1.1 Artefact
  authority**, a table the project fills with its own artefacts against kit-supplied fact categories,
  because a design milestone's several artefacts are **not interchangeable**: one built with substitute
  assets carries compensation for them, and one drawn at other than the real output dimensions is
  proportionally wrong — both by margins small enough to survive review. The kit had been actively
  encouraging that artefact ("proactively offer mockups", v1.0.1) without warning it is one. Two related
  fixes: the kit is now **format-neutral** here (output format is the project's choice, never the kit's), and
  the binary UI/non-UI split is corrected — **judge by whether appearance is specified, not by whether there
  is a screen**, so a project rendering documents no longer skips the milestones it needs. **Apply:**
  - **add** — insert `## Design authority` into `spec/tickets/TICKET-TEMPLATE.md`'s `Task` body and rename
    the `Story` body's `## Design references` to it, per the new pristine template;
  - **add** — insert `### 1.1 Artefact authority` into `spec/design/design-system.md` after §1, leaving the
    table for the user to fill (**interview** if they want it filled now — ask which artefact binds
    placement, which binds values, and which are illustrative only);
  - **amend** — the `type` row in `spec/tickets/CONVENTIONS.md`; the *when to skip* notes in
    `spec/wireframes/overview.md` and `spec/design/design-system.md`; and remove any hard-coded output
    format the project inherited from an older wireframes template if it does not match what they build;
  - **offer** (step 5 backfill) — add `## Design authority` to existing open tickets that change rendered
    output. Do not backfill closed ones.
  - **refresh** — `sfk-next-milestone`.
- **`sfk-init` stops asking what it cannot yet know.** It asked for the architecture layers, the dependency
  rule, the command runner and the default gate on day one — but the layering is the **architecture
  milestone's** deliverable, decided from the brief and requirements, and the runner and gates are settled at
  **test strategy** and **scaffolding**. Asking at init invents facts the project must unpick and leaves a
  visibly half-filled `CLAUDE.md`. Those sections now ship marked *not set yet*, with their shape in HTML
  comments (stripped before context injection, so they cost nothing while they wait), plus an instruction
  never to invent a command before *Commands* is filled. The architecture milestone now **proposes** a
  layering and stack with its rationale and the alternatives it rejected — the point of moving it — and
  writes the settled rule into `CLAUDE.md` at sign-off. *"Is there a UI"* moves to `sfk-version`, which is
  what consumes it, reworded to *"does this version render anything a person looks at"*. Same reasoning that
  moved `verify.md` to lazy creation in v1.1.0: **ask when the answer is knowable.** **Apply:**
  - **n/a for existing projects — this changes only what `sfk-init` writes for a *new* project.** Your root
    `CLAUDE.md` already has *Architecture dependency rule*, *Stack* and *Commands* filled in with real
    content. **Do not** apply the template's not-set markers to them, and do not "helpfully" blank them:
    that is the one destructive action in this release. Leave all three exactly as they are.
  - **refresh** — `sfk-init`, `sfk-version`, `sfk-next-milestone`, and the method guide.
- **Optional per-person conversational register (`CLAUDE.local.md`).** One project is worked by a BA, a
  designer and engineers of different specialisms, and the register that helps one obscures things for
  another. The **rule** lives in the shared root `CLAUDE.md`; the **declaration** lives in a gitignored
  `CLAUDE.local.md`, one per person, which loads after `CLAUDE.md` so it takes precedence without anyone
  editing a shared file. **It changes how things are explained, never what is decided** — not scope, not
  rigour, not gates, and never a requirement's precision. Everything in `spec/` stays audience-neutral and
  identical for everyone. **Apply:**
  - **add** — append `CLAUDE.local.md` to the project's root `.gitignore`. Check this specifically: a
    generic `*.local` pattern does **not** match it, and an accidental commit puts one person's preferences
    on everybody;
  - **add** — insert the `## Audience` section into the root `CLAUDE.md` from the new pristine template,
    before *What this project is*;
  - **offer** — create `CLAUDE.local.md` from `.sfk/templates/CLAUDE.local.md` for **this** user if they
    want one, filled from a one-question ask. Never create it unasked, and never commit it. Teammates create
    their own.
- **`sfk-todo` should be offered, not only obeyed.** Parking work changes scope, so the agent now *offers*
  ("shall I park this?") whenever work is deliberately stopped for a missing decision, rather than only
  acting when asked — the deliberate counterpart to the open-questions register, which is recorded without
  asking. Both asymmetries are stated in both files. **Apply:** refresh — `sfk-todo`; **amend** — the
  `sfk-todo` row in the method guide's skills table.

---

## v1.3.1 — the delta pass gets its missing steps and its own gates

Four fixes to how a **later version** is planned, all from one project-feedback pass. Common root: the
delta pass was described as a *shorter* list, and an agent following that list literally produced a
milestone table with work that had nowhere to go and review gates that had been merged away. Nothing here
affects a first release, and no project content is overwritten — there is **no pre-copy step**.

- **Optional tooling step in the delta pass.** A later version can add dependencies, gates and build
  plumbing even though the repo is already scaffolded, and the delta pass had no step for it — so it
  landed as the leading tickets of the implementation milestone, putting a dependency addition or a gate
  change in the same review bucket as feature commits. There is now a **tooling deltas** step immediately
  before implementation, the scaffolding step's smaller successor: present **only** when the version adds
  a dependency, a gate or a build change, omitted entirely for pure feature work, and scoped to that
  plumbing alone. **A gate change belongs there, never inside a feature ticket.** Its tickets are worked
  one at a time like scaffolding's. **Apply:** refresh — `sfk-version`, `sfk-next-milestone`,
  `sfk-next-ticket`, `sfk-signoff`, `spec/README.md`.
- **Ticket generation and the two UI steps get their own gates back.** The delta pass merged wireframe
  deltas with design deltas, and the test-strategy delta with ticket generation; both merges cost a review
  gate. **Ticket generation is now always its own step** — on a delta version it means a fresh queue in
  dependency order, new epic ids, a new `BOARD.md` version section and re-milestoning carried-over
  tickets, and it is the one artefact regenerated from scratch every version, so sharing a gate with a
  test-strategy edit guarantees one of the two gets a shallow review. **Wireframe and design deltas stay
  separate** unless the version's UI work is *purely visual*; merged, a layout question gets settled
  inside what looks like a styling review. The "shorter delta pass" framing is dropped: a delta version
  reaching the first release's step count is not a sign anything went wrong, and steps are never merged to
  hit a target length. **Apply:** refresh — `sfk-version`, `spec/README.md`; **amend** —
  `spec/milestone-plan.md` *only if* it still carries the commented example delta table (split its
  test-strategy + ticket-generation row in two); a project's real, filled-in version tables are **not**
  touched, and the next table `sfk-version` lays down follows the new shape automatically.
- **Ticket generation waits for a fully signed-off spec.** It may not begin while any preceding spec
  milestone of that version is ⬜ or 🔶 — no provisional or draft queue, and no offer to start early —
  because a queue derived from an unapproved draft is thrown away the moment that draft moves. The old
  wording ("confirm its inputs are signed off") was soft enough to read as satisfied mid-flow.
  **Apply:** refresh — `sfk-next-milestone`, `spec/README.md`.
- **The version-brief milestone is a ratification gate, not re-authoring.** `sfk-version` writes
  `spec/vX.Y.Z-brief.md` and then lays down a *version brief* milestone as `Not started`, before handing
  off to the skill that produces deliverables — so the prescribed status and the honest-looking status
  disagreed, and a real run marked it `In progress` because the artefact existed. `sfk-version` now states
  it writes a **draft**, labels the row **"Version brief — review and ratify"**, and is barred from
  setting any status beyond ⬜ (only `sfk-next-milestone` marks 🔶). Its Rules also claimed it never
  authors a milestone's deliverable, which the brief contradicted; the brief is now the single named
  exception. `sfk-next-milestone` gains the matching exception — that milestone **reads and reviews the
  existing draft** instead of copying a template over it and re-interviewing. **Apply:** refresh —
  `sfk-version`, `sfk-next-milestone`; **amend** — `spec/milestone-plan.md` only if it still carries the
  commented example delta table (rename its brief row).

Maintainer-side (not shipped): `tools/check_kit.py` gains a 7th check pinning the delta-pass step list to
one canonical sequence across the skill that executes it and the guide that documents it — the two had
drifted, and the skill's reading silently wins at runtime.

---

## v1.3.0 — optional PR-review mode, plus friction fixes

An optional **review surface**: instead of reviewing an `in-review` commit in place, each ticket can be
worked on a **branch** and pushed as a **pull/merge request**, with your **merge** as the approval. Off
by default; `in-place` review is unchanged. It's the same `in-review` gate, on the forge. This release
also folds in friction fixes from a project-feedback pass.

- **Parking lot (`spec/TODO.md`) + `sfk-todo` capture skill.** A home for work you *know* is coming but
  can't ticket yet — its blocking **decision doesn't exist** ("the ticket is the prompt" needs a
  specifiable outcome). Anti-rot by design: every entry **names the decision owed**, the list is
  **harvested at `sfk-version`** (checklist → which does this version resolve?), and a selected item
  becomes a real ticket at **ticket generation** where its entry is **deleted in the same commit** (zero
  residue). It is committed and shared, so a BA can plan from it; it is **not** a second backlog
  (anything specifiable goes to `BOARD.md`). The new **`sfk-todo`** skill (11th) captures a one-liner
  mid-flow, always records the decision owed, and commits `spec/TODO.md` **on its own** (never folded
  into a ticket commit; hand-off in Cowork). **Apply:**
  - **add** — copy `.claude/skills/sfk-todo/` in (new skill; no project edits to it);
  - **add** — create `spec/TODO.md` from `.sfk/templates/spec/TODO.md` if absent (lay it down **empty**,
    replacing `<PROJECT>`); it is committed like any living doc;
  - **add** — insert the `spec/TODO.md` line into the root `CLAUDE.md` *Where things live*, and add
    `sfk-todo` to its `.claude/skills/sfk-*` roster line;
  - **refresh** — `sfk-version` (harvest step), `sfk-next-milestone` (drain-at-ticket-generation),
    `sfk-init` (lays down the empty parking lot), and the method guide.
- **`sfk-verify` is user-triggered only, and announces its model first.** Two fixes to the verifier's
  procedure: (1) it runs **only on the user's explicit request** — a batch boundary is an *offer*
  ("want me to run `sfk-verify`?"), never standing authorization; `sfk-next-ticket` step 8 is corrected
  to offer-and-wait rather than launch. (2) At the start of a run it **states which model** will audit
  and, if the project configures a distinct grader model (*Models*), **recommends switching to it** —
  verification is a grader task, so the cheap `implementation` model is the wrong default. One-line
  confirm, not an interview. **Apply:** refresh — `sfk-verify`, `sfk-next-ticket`.
- **Cowork: no `git` at all — including read-only `status`/`log`/`diff` (bug fix).** In a hand-off
  (Cowork) runtime, even read-only git refreshes the index and leaves a `.git/index.lock` the sandbox
  cannot unlink, which then blocks the *user's* own commits. The Commit protocol prohibition is hardened
  from "don't commit" to "run no git commands at all; never probe `.git` to infer state — read milestone
  and commit state only from `spec/milestone-plan.md` and the user." Reinforced in `sfk-signoff` and
  `sfk-next-milestone`. **Apply:** amend — the *Commit protocol* authoring bullet in the root `CLAUDE.md`
  (extend the prohibition to read-only git + the `index.lock` rationale; preserve user edits); refresh —
  `sfk-signoff`, `sfk-next-milestone`.
- **Feedback template records its source project (audit trail only).** The feedback template gains a
  required `project:` frontmatter field (the source project's short code), filled by `sfk-feedback` on
  every item, so feedback arriving on the SFK side can be traced to its origin. It is explicitly **never**
  a triage input — feedback is accepted on its merits, not on who raised it. Replaces the old "provenance
  optional — omit if in doubt" guidance. **Apply:** refresh — `.sfk/templates/feedback/feedback.md`,
  `sfk-feedback`. (Maintainer-side `FEEDBACK.md` also notes the audit-only rule; not shipped.)
- **Authoring commit cadence: hand off at sign-off, not after every draft.** In a hand-off (Cowork)
  runtime, `sfk-next-milestone` no longer surfaces `git` commands during the authoring feedback loop —
  an authoring milestone iterates several rounds before it's ready, so per-draft commit prompts were
  noise. The whole milestone lands as a **single** commit at `sfk-signoff` (deliverable + status flip);
  mid-way checkpoints are available only on explicit request. Building milestones keep the per-ticket
  cadence. **Apply:** refresh — `sfk-next-milestone`, `sfk-signoff`; amend — the *Commit protocol*
  authoring bullet in the root `CLAUDE.md` (add the "surfaced at sign-off, not per draft" cadence note;
  preserve any user edits).
- **`Review mode` setting** in the root `CLAUDE.md` (*Project & kit*): `in-place` (default) or `pr`.
  **Apply:** add — insert the `Review mode` line into *Project & kit*; **interview** — *offer* `pr` mode
  (default `in-place`, so behaviour is unchanged unless chosen); if `pr`, detect the forge from the git
  remote and record its CLI. On an existing project this is an **offer**, not a forced change.
- **`sfk-next-ticket` gains `pr`-mode behaviour** — a branch per ticket, push + open a PR at `in-review`,
  and finalize by **detecting the merge** (the merge is the user's approval; the kit never merges).
  Degrades to `in-place` where unconfigured or unsupported (no remote / not git-safe). **Apply:** refresh.
- **New skill `sfk-address-review`** — pulls a ticket PR's review comments and revises on its branch;
  standalone, user-invoked, self-configures its forge command on first run. **Apply:** add — copy
  `.claude/skills/sfk-address-review/` in; no project edits.
- **`sfk-init` asks the review-mode question; `sfk-signoff` confirms a PR is merged before finalizing the
  last ticket in `pr` mode.** **Apply:** refresh — `sfk-init`, `sfk-signoff`.
- Method guide gains a *Review mode* note. **Apply:** refresh — the guide.

---

## v1.2.0 — independent test authorship (optional)

Optional **model split for tests vs code**: a test written by the same model that writes the code it
must pass is a weak check (shared blind spots; a misread requirement embodied in both). You can now have
a *different, stronger* model write the failing test — *grader ≠ graded* — before a cheaper model
implements to green. **Off by default; single-model behaviour is unchanged.**

- **A `Models` line in the root `CLAUDE.md` (*Project & kit*).** Records the `implementation` model and,
  optionally, a distinct `tests` model. **Apply:** add — insert the `Models` entry into the project's
  root `CLAUDE.md` *Project & kit* section; **interview** — ask whether the failing test should be
  written by a different, stronger model than the implementer, and if so record both models (default:
  one model, `tests: same`).
- **`sfk-next-ticket` writes the failing test with the `tests` model when one is configured** — in
  Claude Code, via a subagent pinned to that model, from the ticket + spec only, then implements to
  green in the driving session. Test-writer and implementer do not collaborate on a ticket; still one
  ticket, one commit; degrades to single-model where unconfigured or unsupported. **Apply:** refresh —
  `sfk-next-ticket`.
- **`sfk-init` asks the model question** and fills the `Models` line. **Apply:** refresh — `sfk-init`.
- Method guide gains an *Independent test authorship* note (Test discipline). **Apply:** refresh — the
  guide.

---

## v1.1.0 — two-folder payload, neutral verifier, copy-then-migrate updates

> ### ⚠ Pre-copy — back up your filled-in `sfk-verify` **before** copying this kit over your project
>
> In v1.0.x the `sfk-verify` **skill file itself held your content**: you filled its `PLACEHOLDER`s with
> your real gate commands and stack-specific checks at scaffolding. This version makes the skill
> **neutral** and moves those specifics into a new living doc, `spec/verify/verify.md`. The copy
> therefore **overwrites your filled-in skill** — before `sfk-update-kit` ever runs.
>
> ```
> cp .claude/skills/sfk-verify/SKILL.md ../sfk-verify-backup.md   # from your project root, before copying
> ```
>
> Already copied without a backup? **Don't commit** — it's still in git:
> `git show HEAD:.claude/skills/sfk-verify/SKILL.md > ../sfk-verify-backup.md`.
> Full instructions and recovery: repo-root **`UPGRADING.md`**.

- **The payload is now exactly two kit-owned folders: `.sfk/` and `.claude/`.** `spec/README.md` and
  `spec/.gitignore` moved into `.sfk/templates/` and are generated by `sfk-init`. Nothing a project owns
  is shipped any more, which is what makes the copy safe. **Apply:** refresh — the copy handles it; no
  project edits needed.

- **`sfk-verify` is now neutral and kit-owned.** The skill owns the *method* (what to check); the
  *specifics* — gate commands, contractual values, stack-specific and extra checks — live in
  `spec/verify/verify.md`, which the skill creates **by interview on its first run**. Scaffolding no
  longer "fills in the verifier".
  **This supersedes the v1.0.1 entry's `sfk-verify` Apply note** ("merge the new check into the
  project's filled-in `sfk-verify`"): there is no filled-in skill any more, and nothing to merge — the
  skill refreshes wholesale like every other.
  **Apply:** interview — create `spec/verify/verify.md` from `.sfk/templates/spec/verify/verify.md` and
  **extract the project's gate commands and stack-specific checks out of the backed-up (or
  git-recovered) v1.0.x `sfk-verify`** into it, interviewing for anything not recoverable. See the
  Pre-copy note above.

- **Updating is now copy-then-migrate.** The user copies the two kit-owned folders over the project
  (without committing); `sfk-update-kit` then applies this changelog's declared deltas to the files the
  project owns. No external kit, no temp folder, no delete step — and it works inside the Cowork sandbox,
  which can only see the project. **Apply:** refresh — `sfk-update-kit`.

- **New `Pre-copy` changelog note, and a repo-root `UPGRADING.md`.** `Apply` runs *after* the copy;
  `Pre-copy` is an instruction to the human *before* it, for when the copy would destroy something.
  **Apply:** refresh — the `.sfk/CHANGELOG.md` header.

- **Red-green TDD is binding, not optional guidance.** It is the default for all implementation work and
  may be overridden **only** by an explicit exemption recorded in the test strategy (named layer +
  rationale). Reaching `in-review` now requires that red-green was followed (or the layer is a stated
  exemption), said so in the completion report.
  **Apply:** add — the "Red-green is binding" non-negotiable to the root `CLAUDE.md`, and the red-green
  clause to its *Definition of done*; amend + interview — `spec/test-strategy/test-strategy.md` §1: state
  it binding and ask the user to name any exempt layers (or record "none"); refresh — `sfk-next-ticket`.

- **`sfk-feedback`: the template is binding.** Feedback files must be the template, filled — no custom
  structures or frontmatter; delete the guidance block, keep `## For the SFK maintainer` verbatim.
  **Apply:** refresh — `sfk-feedback`.

- **`sfk-signoff` tags the release.** On a version's **final** milestone it now creates the annotated tag
  from the version in the milestone plan and **offers** the push (never pushes unconditionally), guarded
  against a missing/ambiguous version, an existing tag, and a dirty tree. **Apply:** refresh —
  `sfk-signoff`.

---

## v1.0.1 — hardening from first dogfood

Fixes folded in from the first round of real project feedback (consumed per `FEEDBACK.md`). Recurring
theme: a loose agent skipped stated discipline, so the critical gates are now imperative and promoted
into the always-loaded root `CLAUDE.md`.

- **Commit protocol — authoring hands off `git`, building commits.** In Cowork the agent must not touch
  `.git` (a partial commit corrupted the index in a real run); building in Claude Code commits as
  before. **Apply:** add — insert the `## Commit protocol` section into the project's root `CLAUDE.md`
  after `## Commands` (interview if that section was customised); refresh the affected skills
  (`sfk-version`, `sfk-next-milestone`, `sfk-signoff`, `sfk-init`, `sfk-update-kit`).
- **New skill `sfk-close-ticket`** — finalize the current in-review ticket (→ `done`, own commit)
  without starting the next. **Apply:** add — copy `.claude/skills/sfk-close-ticket/` in; no project
  edits needed.
- **Ticket finalize discipline hardened** — `sfk-next-ticket` step 1 is an imperative STOP gate.
  **Apply:** refresh `sfk-next-ticket`; add the "one ticket per commit; finalize before advancing"
  non-negotiable to the root `CLAUDE.md`.
- **Scaffolding is worked ticket-by-ticket** like implementation (not batched). **Apply:** refresh
  `sfk-next-milestone`, `sfk-next-ticket`, `sfk-signoff`, `spec/README.md`.
- **`sfk-verify`: contractual-value sweep (check 6) + fill-in hardening.** **Apply:** amend — merge the
  new check and the fill-in note into the project's filled-in `sfk-verify` (per that skill's merge,
  step 6).
- **Non-negotiable: contractual values are not workarounds; escalate external errors.** **Apply:** add
  to the root `CLAUDE.md` non-negotiables; refresh `sfk-next-ticket`.
- **Commit hygiene** (stage deliberately, never `git add -A`) and **feedback-location** hardening.
  **Apply:** amend `spec/tickets/CLAUDE.md`; refresh `sfk-feedback`.
- **Wireframes: proactively offer interactive HTML mockups.** **Apply:** amend the wireframes template.

---

## v1.0.0 — initial release

Baseline. A project bootstrapped at v1.0.0 needs no migration.

The kit provides:

- The nine-step spec-first method and the milestone lifecycle (`spec/README.md`).
- The living spec templates under `spec/` (brief, requirements, architecture + api-contract,
  wireframes, design system, test-strategy), the milestone plan, and the ticket system (BOARD, CONVENTIONS,
  TICKET-TEMPLATE with an `## In plain English` section, tickets/CLAUDE.md).
- A lean root `CLAUDE.md` and the per-layer `CLAUDE.md` template.
- The workflow skills: `sfk-init`, `sfk-version`, `sfk-next-milestone`, `sfk-signoff`,
  `sfk-next-ticket`, `sfk-verify`, `sfk-update-kit`, `sfk-feedback`.
- The feedback loop: `sfk-feedback` writes to a gitignored `spec/.sfk-feedback/` (seeded by `spec/.gitignore`
  and the `.sfk/templates/feedback/` template); consumed on the SFK side per the repo-root `FEEDBACK.md`.
- Versioning machinery (`.sfk/`).

**Apply:** n/a (baseline).

<!-- Template for future entries:

## vX.Y.Z — <short title>

- <change one>. **Apply:** add — insert `## <heading>` into `spec/<file>` after `<anchor>`; leave its body for the user to fill (interview if they want it filled now).
- <change two>. **Apply:** refresh — overwrite `<kit-owned file>`.
- <change three>. **Apply:** amend — reword `<section>` in `spec/<file>` to match the new pristine template; preserve any user edits.
-->
