# SFK changelog

Changes to the Spec-First Kit, newest first. Each entry is the migration script `sfk-update-kit`
follows: it applies every entry newer than a project's `applied_version` (see `manifest.md`).

For each change, the **Apply** note tells the update skill how to bring it into an existing project:
*refresh* (overwrite the kit-owned file), *add* (insert a new section/heading into a living file),
*amend* (apply a wording/guidance change), or *interview* (ask the user, because content is needed).

**Apply notes never renumber anything in a project-owned document.** A new item in a numbered list is
**appended**, never inserted — and a note names a section by **title**, not by number (*"the *Numeric
thresholds are contractual* convention"*, not *"§1.4"*). A section number is a **citation target**: a
project cites it from tickets, from other spec documents, from its `CLAUDE.md`. Renumbering one silently
invalidates every citation, and nothing detects it — which is why the kit already forbids linking an id
to a numbered-section anchor, and why ids are never renumbered. The template may order its own list
however reads best for a new project; an existing project appends, so the two legitimately diverge and
only titles are stable across both.

**Apply notes name their targets by path, never in prose.** Write `refresh — spec/README.md`, not
`refresh — the guide`. A prose target invites the reader to categorise it, and a reader who categorises
wrongly skips the file without ever knowing they did. This is not hypothetical: two consecutive releases
declared *"refresh — the guide"*, both were skipped, and the drift went unnoticed for two kit versions
because nothing named the file and nothing checked afterwards.

A change may also carry a **Pre-copy** note. `Apply` happens *after* the user copies the new `.sfk/` +
`.claude/` over their project; **`Pre-copy` is an instruction to the human, *before* that copy** — used
when the copy would destroy something the project owns or filled in. Any entry with a `Pre-copy` note
must also have a section in the repo-root `UPGRADING.md`, because nobody reads a changelog until they
are told to.

---

## v1.4.7 — a section number is a citation target

One fix, found by the first project to apply v1.4.6. **No pre-copy step.**

- **FIX (major): an Apply note never renumbers a section a project cites.** v1.4.6 inserted a new
  convention as item **2** of `requirements.md` §1, pushing *Numeric thresholds are contractual* from
  §1.4 to §1.5 — and its Apply note told projects to renumber, then *"check the project's own citations
  of §1.4"*.

  The first project to upgrade found **§1.4 cited across twenty-two files**: eight tickets, `BOARD.md`,
  `verify.md`, four architecture documents, `contents.md`, `milestone-plan.md`, `open-questions.md`, two
  version briefs and the root `CLAUDE.md`. It **deviated from the note**, appended the new convention at
  the end of the list instead, and was right to. The renumber buys nothing, and every citation missed in
  the sweep is **silently wrong** — it still renders, it just points at a different rule.

  **The kit already states this rule twice, and the same release broke it.** `CONVENTIONS.md` §1.1: *ids
  are permanent — never reused, never renumbered.* `id-registry.md`: never link an id to a
  numbered-section anchor, because *numbered headings make slugs embed section numbers that break
  silently on renumbering*. A section number is a citation target with exactly that property, and nothing
  protected it.

  **Apply:**
  - **amend** — `spec/requirements/requirements.md` §1: the new *This document holds builder
    instructions* convention moves to the **end** of the list, restoring §1.4 for anyone who has not yet
    applied v1.4.6. **If you already applied v1.4.6 as written and did the renumber, do nothing** —
    either numbering is internally consistent, and re-renumbering would invalidate the citations you have
    just fixed. Only the citations and the document need to agree;
  - **n/a — kit-owned** — the `CHANGELOG.md` header rule (Apply notes never renumber; new list items are
    appended; sections are named by **title**, not number) and `sfk-update-kit`, which now carries it in
    the `amend` verb and resolves a numbered reference by title in the project's own file;
  - **n/a — kit-owned** — `spec/architecture/decisions.md`'s scope line, which named two documents; the
    reporting project has four binding documents in that folder, three of which already had logs.

  **v1.4.6's own Apply note is corrected in place, marked and dated.** Entries apply oldest-to-newest, so
  a project upgrading from 1.4.5 would otherwise read the renumber instruction *first* and do the work
  before reaching the rule that forbids it. The changelog is a script as well as a record, and a
  knowingly-wrong executable step is worse than a visibly corrected one.

---

## v1.4.6 — the spec holds instructions, and nobody checks their own work

Three items from one project. Two are the same discovery from opposite ends: **a binding document was
being asked to do two jobs at once, and the person doing them was checking their own work.** **No pre-copy
step, and nothing here restructures a document that already exists.**

- **NEW (major): a newly created binding document gets fresh eyes before sign-off.** Measured on one
  authoring milestone of twenty-four new rules: **six self-verification passes, every one finding a real
  defect — and every one but the last introducing a smaller defect of the same class in its own
  correction.** Three regressions re-used a justification already struck as false elsewhere in the same
  rule; two corrected a mis-citation with a *different* wrong citation. Among the defects that pass did
  catch: two rules that between them required an authenticated session and a stated role on **every**
  route. Sign-in is a route, so **the application was unreachable by its own specification.**

  That is not quality variance. One party writing and checking the same large, cross-referential document
  shares its own model of what the document says, so the same misreading survives every pass. **The kit
  already believes this** — *grader ≠ graded*, applied to tests since v1.2.0 and to ungated tickets since
  v1.4.4 — and had never applied it to the documents every later ticket is checked against.

  Scoped to documents a milestone **created**. An amended one has a natural check in its prior version and
  its diff; one created from nothing has neither, and that is where the reporting project's defect count
  was highest. Self-limiting, since most later milestones amend rather than create.

  **Before sign-off, never after** — the reason v1.4.2 and v1.4.5 both turned on. A finding raised after ✅
  either forces un-signing the milestone, destroying the one human gate the method has, or leaves a
  signed-off document with a known defect standing against it and nothing marking it suspect. And it
  **degrades rather than assuming a runtime**: a subagent pinned to the `tests` model where one is
  configured, otherwise the skill says plainly that the fresh eyes must be **the user's** rather than
  passing off a second self-review as independent.

  It **complements** `sfk-verify` spec mode and both now say so: spec mode is *cross-document* at the
  ticket gate (requirements can only contradict the brief once both exist); this is *single-document*, at
  the moment of writing.

  **Apply:**
  - **refresh** — `spec/README.md`;
  - **n/a — kit-owned** — `sfk-next-milestone` (new step 6), `sfk-signoff` (step 1 now states what
    reviewing an authoring deliverable *means* — a full read for a created document, the diff for an
    amended one — and reports whether the fresh-eyes pass ran; it reports and never blocks);
  - **Forward-only.** This binds from the next authoring milestone. Do **not** retro-verify documents that
    already exist, and do not offer to.

- **NEW (major): a binding document holds builder instructions; its decisions log holds the record.** By
  its third version one project's spec reached **~4,000 lines** describing a dozen HTML forms — a
  1,450-line requirements document, an 1,100-line contract. The dominant cause was the kit's own
  instruction: `requirements.md` said *"superseded ones are amended in place and annotated."*

  **Dead text beside live text is not merely long — it gets read as current, and it caused two real
  defects** in that project: a superseded tail left spliced onto the **next** rule, asserting a behaviour
  that had been removed and which an implementer working from that rule alone would have built; and two
  rules in one authoritative document contradicting each other from ninety lines apart.

  **The kit already held this rule and applied it in exactly one file.** The root `CLAUDE.md` says
  corrections belong in the owning document's decisions log, because an inline *"this used to say X"* note
  tells every future reader about a value they never saw. That reasoning was never extended to the binding
  documents, while `requirements.md` instructed the opposite.

  Now: a superseded rule is **rewritten in place** and marked with a **pinned** marker — exactly
  `*(amended vX.Y.Z)*` — and the old wording **moves to a `decisions.md` beside the document**, keyed by
  id. **The archive is a separate file, not a section**, which is the part that makes it work: a section
  at the foot of `requirements.md` still loads with `requirements.md`, so the binding document keeps
  growing and a builder handed the spec still reads the history. A sibling file is out of the reading
  path, and it matches what the kit already does everywhere else — `open-questions.md`, `TODO.md`,
  `id-registry.md`, `verify/verify.md` are each their own file. Six of them, one per milestone folder. The marker is a
  flag, **never a cross-reference**: a rule that cites its log entry soon acquires a sentence explaining
  the citation, and the narration is back. The reference runs **one way** — log names rules, rules never
  name entries — so the log becomes an **archive, not a living document**. The test for any sentence in a
  binding document: *can this be rewritten as a rule?*

  **Operational hazards are named as a third category so that rule cannot strip them** — a clean
  vulnerability audit that is not sufficient evidence, a published parameter set that throws against a
  default memory limit, a comment-syntax edge case that breaks a parser. Same shape as v1.4.5's permitted
  substitutes: a tightening rule needs its named exception or it causes the harm it was meant to prevent.

  Pinning the marker matters beyond tidiness: it was previously only an example, so superseded text was
  never reliably identifiable. Pinned, it is machine-matchable — which is what lets a condensation pass act
  on it safely instead of guessing.

  *Rejected:* a stated per-document **size budget**. The argument under it is the kit's own — a constraint
  you can see yourself violating beats a rule you must remember — but a line cap is the wrong mechanical
  form: nobody can justify 800 over 1,200, it varies by project, and it creates pressure to **delete rules
  to fit**. The visibility it wanted is what the shape report gives instead.

  **Three binding documents had no decisions log at all** — `brief.md`, `architecture.md` and
  `api-contract.md` — so the rule above was unfollowable on them, including the two most likely to be
  amended in a delta version. Architecture is also the kit's most decision-dense document (§6 is
  *Technology choices*, and `sfk-next-milestone` asks for rejected alternatives by name), so the kit was
  *generating* rationale into it with nowhere to put it. Related long-standing bug, now fixed: the root
  `CLAUDE.md` told people to log corrections in *"`architecture.md`'s decisions log"* — a section that has
  never existed.

  **Apply:**
  - **add** — `decisions.md` in each of the six milestone folders (`brief/`, `requirements/`,
    `architecture/`, `wireframes/`, `design/`, `test-strategy/`), copied from
    `.sfk/templates/spec/<folder>/decisions.md`. Create only for folders the project **already has** — a
    milestone not yet reached gets its archive when `sfk-next-milestone` creates the folder;
  - **amend** — `spec/requirements/requirements.md` §1 (the *Identifiers* convention gains the pinned
    marker and the move-to-archive clause; the list gains a new **This document holds builder
    instructions** convention) and the *Decisions log* section, now a one-line pointer to the archive.
    **APPEND the new convention at the end of the list — do not insert it, and do not renumber
    anything.** *(Corrected 2026-08-06, v1.4.7: this note originally told you to insert it second and
    renumber *Numeric thresholds are contractual* from §1.4 to §1.5, then check your own citations. That
    was wrong — a section number is a citation target, one project cites §1.4 across twenty-two files,
    and the renumber buys nothing. The v1.4.6 template shipped with the item second; the v1.4.7 template
    has it last. Corrected here rather than only in v1.4.7 because entries apply oldest-to-newest, so
    leaving it would have you do the renumber and then undo it.)*;
  - **amend** — the same replacement in `spec/design/design-system.md` §5,
    `spec/test-strategy/test-strategy.md` §13 and `spec/wireframes/overview.md` §6;
  - **MOVE the existing log contents into the new file, verbatim.** This is the *one* structural change
    this release makes to an existing document, and it is safe because it is **whole-section relocation,
    not editing** — the text is identical, the result is verifiable by comparison, and it is reversible.
    That is the mechanical tier, not the judgement tier; do **not** touch anything else in the document
    while you are there. Keep the numbered heading in place as the pointer so the section numbering of
    every other document is undisturbed;
  - **amend** — the root `CLAUDE.md` leanness rule, which named `requirements.md` §7 and a
    non-existent `architecture.md` decisions log; it now names the `decisions.md` files;
  - **amend** — `spec/contents.md`, which gains a row per archive marked *not binding, not in the reading
    path*;
  - **refresh** — `spec/README.md`;
  - **n/a — kit-owned** — `sfk-verify`, `sfk-next-milestone` (which now copies a folder's `decisions.md`
    out alongside its master, and moves superseded wording there when amending).
  - **FORWARD-ONLY, and this is the important part. Amend the *convention text* only — never the rules
    themselves.** Do not restructure the document, do not move existing superseded text, do not strip
    justification, and do not offer to. Every such edit is a *"is this a rule or is this narration?"*
    judgement; a wrong one silently deletes a constraint, the volume makes real review impossible, and
    relocating superseded text wrongly is **exactly how the spliced-tail defect above happened**. An
    existing spec does not shrink as a result of this update, and should not.
  - **The safe retrofit, if the project wants one:** `sfk-verify` spec mode now produces a **shape
    report** on request — in its own section, so hundreds of editorial items cannot bury five real
    contradictions — sorting findings into **mechanical** (marked superseded text, *relocated* not
    rewritten, safe to batch on approval), **judgement** (reported only, never batched) and **leave
    alone** (hazards). Timed at the **start of a delta pass**, never mid-batch, where open tickets cite
    text whose surroundings would shift under them.

- **FIX (minor): `sfk-next-milestone`'s own summary no longer contradicts its step 4.** The `description`,
  the H1 and the opening line all said it *commits* the draft, against step 4's *"defer the whole commit to
  sign-off — run no `git` yourself"* for authoring milestones in a hand-off runtime. The report found three
  sites; there were **six**, three of them in the method guide. All are now runtime-neutral, with step 4
  the single place that names a cadence.

  **Apply:** **refresh** — `spec/README.md`; **n/a — kit-owned** — `sfk-next-milestone`.

---

## v1.4.5 — records are tiered by what a false one costs

Three items from one project, which turned out to be one idea: **records differ in how recoverable they
are, and the kit was treating them all the same.** Some can be corrected late at no cost, some produce
wrong work while they are false, and one cannot be corrected at all. That tiering now lives in
`spec/tickets/CONVENTIONS.md` §5.5 and both major changes hang off it. **No pre-copy step.**

- **FIX (major): red-green must show the observed failure, not claim one happened.** The *Definition of
  done* required **stating** that red-green was followed and never the evidence for it — `evidence`,
  `observed` and `verbatim` appeared **zero times** in the `CLAUDE.md` template — so the requirement was
  discharged by assertion.

  **Why this ranked as a major rather than a wording nit: the kit's weakest requirement guarded its most
  perishable record.** Every other definition-of-done item survives in the tree and can be audited later —
  a gate re-runs, an amendment can be re-read, a `BOARD.md` row re-checked. *"The failing test was written
  first, from the spec, before the implementer saw the problem"* is a fact about **a moment that leaves no
  trace**: captured in the work commit, or gone permanently. Under independent test authorship it is
  precisely the property that feature is bought to guarantee.

  The field evidence settled it. In one eight-ticket batch, **six** tickets discharged the requirement with
  *"all new tests passed on the first implementation attempt"* — a sentence equally true of a test authored
  from the spec beforehand and one written afterwards to fit code that already worked. In the **same
  batch**, the mechanically-checked authorship trailers were clean on **all 43 commits**. A previous batch
  was the mirror image: exemplary prose, no trailer on any of ten commits. This is v1.4.1's *they fail
  independently* lesson plus a corollary: **the unverifiable half loses whenever it is the only one.**

  The bar is now *can a reader tell a real red-green from a plausible one **without re-running anything**?*
  A quoted assertion clears it; a claim does not. `sfk-next-ticket` takes the message **at the moment red is
  observed**, because after green it is unrecoverable.

  Two supporting pieces, both load-bearing. **Permitted substitutes are named** — an untouched suite for a
  pure refactor, a guard whose absence cannot be expressed, an exempt layer — because a stricter rule with
  no honest escape creates pressure to manufacture a failure, and **a fabricated red is worse than a stated
  exemption: it is indistinguishable from a real one.** And `sfk-verify` now checks for the quote, which
  cannot prove authorship order but makes absence **loud instead of silent** — the difference that held the
  trailers. It is explicitly forbidden from asking for the evidence to be added at audit time, since a
  retrofitted quote is a fabrication.

  **Apply:**
  - **amend** — the *Definition of done* in the root `CLAUDE.md`: the red-green clause now requires the
    quoted failure, followed by a block giving the bar, the reason this one item is held to evidence, and
    the permitted substitutes;
  - **amend** — `spec/tickets/CONVENTIONS.md` §5.6 (the completion report now carries the quoted failure);
  - **amend** — `spec/tickets/CLAUDE.md`, which gains a `## Notes` bullet;
  - **amend** — `spec/verify/verify.md` **if it exists** (lazily created by `sfk-verify`): insert a new
    **§4a — Red-green evidence**, before the existing §4b. Seeded for **every** project, single-model
    included — unlike §4b, this exposure does not depend on running two models;
  - **refresh** — `spec/README.md`;
  - **n/a — kit-owned** — `sfk-next-ticket`, `sfk-verify`.
  - **Do not backfill.** Existing tickets cannot gain this evidence retrospectively, and a quote written
    now would be fabricated. The rule binds from the next ticket onward; say so and leave the history alone.

- **NEW (major): correcting a false record re-opens the work done from it.** §5.5 covered the prospective
  case well — amend the document, then write the code — and had **no retrospective half**. The kit contained
  zero occurrences of *"correct the record"*, *"record-correction"* or *"retrospect"*.

  **The insight that makes this an obligation rather than tidiness: a retrospective correction is not
  neutral.** Repair the document and a reader now sees a `done` ticket beside a **true** document, with
  nothing marking it suspect — so the correction **destroys the last visible trace of the exposure it was
  written to record**, turning a visible inconsistency into an invisible one. A correction that stops at the
  record is worse than none.

  The dated instance: a ticket was filed recording that another's `## Background` was false in three
  respects and instructing it be re-scoped. It sat `todo` — correctly, per §6.4's discretion. The next day
  the subject ticket was implemented and closed as *"already discharged by earlier tickets"*, citing the
  correction nowhere; the false `## Background` was what the implementer read. The genuinely-undone item
  shipped three days and one extra ticket later, and only because someone happened to re-read the
  correction — an accident of drafting, not something the method asked for.

  Three changes. **§5.5 gains the retrospective half:** a correction to a record others implement from must
  **name the tickets worked against the false version and state, per ticket, whether their work stands** —
  one line each, which is what turns a correction back into verification. **§6.7 names the
  record-correction ticket**, because projects otherwise invent it namelessly and repeatedly: one built the
  same instrument **five times across three milestones**. *When a project reinvents one tool per milestone,
  the method is missing it.* And **§6.4's discretion no longer covers it** — a quality ticket that waits
  leaves the code imperfect and nothing worsens, while a record-correction ticket that waits has other
  tickets closing **against the record it exists to fix**, so it compounds and can expire. The observed one
  became literally *unsatisfiable*, its subject having closed first.

  **Apply:**
  - **amend** — `spec/tickets/CONVENTIONS.md`: §5.5 gains the retrospective half and the record tiering,
    §6.4 gains the exception, and **§6.7 is new**;
  - **amend** — `spec/tickets/CLAUDE.md`, which gains a correcting-a-record bullet;
  - **n/a — kit-owned** — `sfk-verify`.
  - **Offer, once:** if the project has open cleanup tickets whose purpose is *make the record true*,
    offer to re-label them as record-correction tickets and bring them forward. Do **not** re-open closed
    ones or audit the history for uncorrected records — that is a project decision, not a migration.

- **FIX (minor): a verify pass's finding labels are labels, not ids.** Reported as *"`sfk-verify`'s `F-n`
  ids are never registered in `id-registry.md`"*. The premise was wrong in a way that changed the fix: **the
  kit never minted `F-n` at all** — there is nothing about finding labels anywhere in `sfk-verify` or the
  `verify.md` template. The convention was **emergent model behaviour the kit had never defined**, which is
  why nothing scoped it either.

  So the bug was not a missing registry row. It was an **ephemeral conversation label written into durable
  documents as though it were an id**. The sequence restarts every pass, so two unrelated findings from two
  passes were both cited as bare `F7` in different documents, silently breaking `id-registry.md`'s own
  binding rule that **ids are permanent — never reused, never renumbered**.

  `sfk-verify` now owns the convention and bounds it: number findings for the conversation, and **never**
  write one into a ticket's `## Background`, `BOARD.md` or `verify.md`. A finding is ephemeral by design —
  it either becomes a cleanup ticket, which has a real permanent id, or it is rejected — so the durable
  reference is always the ticket, or the finding restated in words. That removes the collision
  structurally instead of relying on every citation to remember to qualify itself. *Rejected:* baking a
  batch qualifier into the label (`<batch> Fn`), which fixes the collision while legitimising the thing
  that should not happen. *Kept as the escape hatch:* if a project genuinely wants durable finding ids,
  that is a **new id family** and the skill stops to offer the registry row.

  **Apply:**
  - **amend** — `spec/id-registry.md`, which gains the general form of the rule (a within-a-conversation
    label is not an id) since the same trap awaits any future labelling scheme;
  - **n/a — kit-owned** — `sfk-verify`.
  - **Check for existing damage:** `grep` the project for bare `F<n>` citations in `spec/`. If any are
    found, **offer** to replace each with the cleanup ticket it became or the finding restated. If a
    project already added its own `F-n` registry row, that is the escape hatch working — leave it, and
    reconcile per the *already present under another name* rule in `sfk-update-kit`.

---

## v1.4.4 — the update checks itself, and the guide stops drifting

Three items, two of them about the same thing from opposite ends: **`spec/README.md` is the file the kit
is worst at keeping current**, and it is the worst one to have stale. **No pre-copy step.**

- **FIX (major): the method guide can no longer be silently skipped by an update.** A project ran **two
  kit versions** on a stale `spec/README.md`. v1.1.0 and v1.2.0 each declared *"refresh — the guide"*;
  both were skipped; it surfaced only when a third update diffed the file by chance. The lagging guide
  still described `sfk-verify` as a fill-in template, still documented the pre-v1.1.0 temp-folder update
  procedure, and still framed the payload as shipping `spec/` — all superseded, all **contradicting the
  skills that had been refreshed alongside it**.

  **The root cause is a real trap, not carelessness.** `spec/README.md` is **kit-owned in substance but
  lives in the project-owned tree** — the only file on that boundary. Step 3 told the agent *"the
  kit-owned folders are already current (the copy did that) — do not re-copy them"*, which is true and
  still misleading, because the guide is **not in one of those folders**: the payload is only `.sfk/` and
  `.claude/`. An agent reasonably buckets the guide as already handled. The guide's own *ownership*
  section reinforced the wrong half, and *"the guide"* was the only prose-named target in the changelog,
  so nothing interrupted the inference.

  Three fixes, each independently sufficient: **Apply notes now name targets by path, never in prose**
  (a rule in the changelog header — a prose target invites the reader to categorise, and one who
  categorises wrongly skips the file without knowing); step 3 **names the exception outright**; and a new
  **step 7 self-check** compares the `Kit version` row in the project's `spec/README.md` against
  `kit_version` in `.sfk/manifest.md` and refuses to continue while they differ.

  The check is the load-bearing one. It runs **before** the version bump — after it, the bump would
  satisfy the check by itself and it would test nothing — and the row must be set by *refreshing the
  guide*, never edited to match, or it is cosmetic. Verification rather than more instruction, because
  this failure is silent, self-concealing and cumulative: a stale guide hands the wrong mental model to
  the next agent that reads it, so the drift compounds instead of surfacing. Instruction had already
  failed twice.

  **Apply:** **n/a — kit-owned** (`sfk-update-kit`, and the changelog header rule); **refresh** —
  `spec/README.md`, whose *ownership* and *Updating* sections now explain why it is the file an update can
  skip. Note the self-check will fire on this very update if the refresh is missed.

- **FIX (minor): the guide claimed `sfk-signoff` closes a milestone's last ticket.** It said a ticket is
  finalized by *"the next `sfk-next-ticket` run … or `sfk-signoff` for the last ticket"* — the exact thing
  **v1.4.1 reversed**. `sfk-signoff` refuses to run while a ticket is open and sends the user to
  `sfk-close-ticket`, because approving a *milestone* is a different decision from approving a *ticket*.
  It was also the only such site missing the `pr`-mode merge clause. Found while checking a report about
  four docs contradicting the skill on `pr` approval — that report is **obsolete** (the v1.4.0 `pr` rework
  unified the rule rather than making the sites conditional: invoking the skill is the approval in both
  modes, the forge Approve button is unused, the merge is plumbing) — but checking its fourth site
  surfaced this unrelated, live one. Fittingly, in the guide.

  **`check_kit.py` gains an eighth check so it cannot return:** *pinned rules not restated
  unconditionally*. When a release makes a universal rule conditional or reverses it, every unconditional
  restatement left behind becomes a defect — and the dangerous ones sit in **ambient, auto-loaded prose**
  rather than in the skill that executes them, so they read as authoritative and nothing catches them.
  Verified in both directions: it passes clean, catches the exact pre-fix wording, and catches a planted
  drift in `spec/tickets/CLAUDE.md`.

  **Apply:** **refresh** — `spec/README.md` (also covered by the item above); **n/a** — `tools/` is
  maintainer-side and ships in no project.

- **NEW (minor): independent authorship now covers tickets that no gate stands behind.** Where a distinct
  `tests` model is configured, it already writes the failing test so the test is not shaped to fit the
  code. **A ticket's acceptance criteria are the other thing the implementer's work is judged against**,
  so a model writing both can set itself a bar it happens to find easy — the same grader ≠ graded
  argument, applied one step earlier.

  Deliberately **narrow**: it covers only tickets with **no human gate behind them** — `sfk-verify`'s
  cleanup tickets, and any ad-hoc *"file this as a ticket"*. Both go straight to the backlog from a
  finding the same session just produced, with nobody in between. It does **not** cover the
  **ticket-generation milestone**, which the report proposed including: that deliverable is reviewed and
  signed off, and a human gate is the stronger of the two checks — it is also the expensive case, pinning
  a whole board to the stronger model rather than one ticket.

  No new configuration: the same `tests` model, set at `sfk-init`, is simply used for more. The drafting
  commit carries a `Co-authored-by` trailer for the model that wrote the ticket, matching how a work
  commit records its test author, and it degrades to single-model behaviour exactly as test authorship
  does.

  **Also rejected, and recorded in `SFK-DESIGN.md`:** having `sfk-feedback` hand its drafting to the
  `tests` model. Grader ≠ graded exists so the *bar* is not shaped to fit the *work*; a feedback file
  grades nothing and gates nothing, and its independent check is the maintainer at triage. Worse, it would
  make the artefact *less* useful — the value of a feedback file is that the model which hit the friction
  saw it, and handing raw material to a subagent that was not there loses exactly the specifics that make
  one actionable.

  **Apply:**
  - **amend** — the **Models** bullet in the root `CLAUDE.md` (now *independent authorship*, with the
    ungated-tickets rule);
  - **amend** — `spec/tickets/CLAUDE.md`, which gains the ad-hoc-filing bullet;
  - **refresh** — `spec/README.md` (the *Independent authorship* section);
  - **n/a — kit-owned** — `sfk-verify`, `sfk-init`.
  - Projects with **no distinct `tests` model configured are unaffected** — nothing to apply beyond the
    wording. Do not offer to configure one here; that is `sfk-init`'s question.

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
