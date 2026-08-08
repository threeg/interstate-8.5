# Interstate-8 — the test strategy decisions

| | |
|---|---|
| **Document** | Decision record and superseded wording for `test-strategy.md` |
| **Repository location** | `spec/test-strategy/decisions.md` |
| **Status** | **Archive — not binding.** The binding document is `test-strategy.md` |

> **This is an archive, and it is deliberately not in the reading path.** It exists so the binding
> document beside it can hold **builder instructions only** (`spec/README.md`, *How versions evolve*).
> Nobody reads this file routinely, and that is correct — its whole value is at the rare, expensive
> moment someone asks *"why is this rule like this, and can I just change it?"*
>
> **Do not summarise it upward into the binding document, and do not maintain it as though it were
> current.** Append; never rewrite.

## What belongs here

- **Decisions** — testing decisions — framework choices, coverage levels, what is deliberately not tested and why. Record the options considered and the reason, not just the outcome.
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
> **Relocated verbatim from `test-strategy.md` §11 at the v1.4.7 kit update (2026-08-08).** Order is as
> it stood there; nothing was reworded.

- **2026-07-11** — **FE tool = Playwright + Axe** (NFR-7). Chosen over Nightwatch because **Drupal
  core is replacing Nightwatch with Playwright** (core issue #3467492 — Nightwatch unreliable) and the
  ecosystem has moved to Playwright; adopting Nightwatch now would mean betting on a tool being
  removed. Axe covers the WCAG 2.1 AA checks.
- **2026-07-11** — **No bespoke migration tests** — verify outcomes (counts/spot-checks) and lean on
  the Migrate module (NFR-3); only the deterministic FR-21 transform gets a unit test.
- **2026-07-11** — **PHPCS + PHPStan in the default gate from slice 1**, scoped to **custom code only**
  (`web/modules/custom` + the custom theme; never core/contrib). Reverses an earlier "defer to a later
  composite" draft: slice 1 already writes custom PHP, and PHPStan **deprecation detection** is the
  on-mission guard against the PHP-EOL/upgrade-fragility trap that ended v2. PHPCS = `Drupal` +
  `DrupalPractice`; PHPStan starts at a modest level with the deprecation rules on.
- **2026-07-11** — **No numeric coverage gate** in slice 1 (no pure core; lazy adoption).
- **2026-07-11** — **SEO deferred whole to the SEO slice** (Metatag titles/descriptions, schema.org,
  XML sitemap, canonical, legacy-URL redirects); slice 1 adds **no** SEO-specific tests. Safe because
  the structural base — semantic HTML, one `<h1>` + heading order, clean Pathauto URLs — is already
  enforced by the a11y checks (NFR-1) and the architecture, and the URL structure + `field_legacy_id`
  are already locked, so the SEO slice is additive, not remediation.
- **2026-07-11** — **Performance + Lighthouse deferred to a pre-launch performance pass** (NFR-4):
  budgets set against real content and caching; Drupal's default caching covers the baseline meanwhile.
- **2026-07-11** — **Manual a11y audit** (screen-reader, formal WCAG) is a **periodic pass**, not a
  per-ticket gate; automated Axe + structural day-one is the per-ticket layer.
- **2026-07-11** — **CI deferred**; the local pre-commit hook is the gate pre-launch.
- **2026-08-01** — **Corrected §10: the pre-commit hook is opt-in and unwired, so the gate is manual.**
  The 2026-07-11 decision above assumed the hook would carry the gate, and INT8-006 duly wired it via a
  `composer.json` post-install step — but that was removed on 2026-07-12 (`2d063b9`, "make pre-commit
  hook opt-in") because the full gate is too slow to run on every commit. The decision stands; only the
  record was stale, in three places (§10 here, the root `CLAUDE.md` *Commands* section, and
  `spec/verify/verify.md` §1), each of which asserted an automatic gate that has not existed since day
  six. Nothing about *what* is tested changes. (Operator confirmation, 2026-08-01.)
- **2026-07-11** — **Boundary-check tool (deptrac vs custom) finalized at scaffolding**; runs in the
  default gate.
- **2026-08-02** — **Narrowed INT8-042's "`lando lint` never substitutes for `lando test`" rule.**
  INT8-042 kept the definition of done at a blanket full `lando test` for every ticket; INT8-043 then
  spent ~17 minutes, nearly all of it one `lando test` run, verifying a single-line `.info.yml`
  dependency addition. The fix is to scope the required gate to what the ticket's **diff** touches, not
  to its stated category: docs-only needs no gate (nothing under `web/`/`tooling/` changed, so neither
  PHPCS/PHPStan nor PHPUnit has anything new to check); pure-styling needs only `lando lint` (PHPUnit's
  outcome is provably unaffected by formatting); everything else — explicitly including build-plumbing
  — keeps the full `lando test`. Categorising by `tests_required` alone was considered and rejected:
  INT8-043 is itself `tests_required: false` (build-plumbing) and is exactly the class of change
  PHPUnit's Kernel tests exist to catch (a module failing to install/boot on a wrong dependency list),
  so a category-based exemption would have removed real coverage rather than redundant ceremony.
