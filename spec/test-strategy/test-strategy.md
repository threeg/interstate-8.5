# Interstate-8 — Test Strategy (v5, `5.0.x-dev` slice 1)

| | |
|---|---|
| **Document** | Test strategy |
| **Repository location** | `spec/test-strategy/test-strategy.md` |
| **Status** | Binding specification — Milestone 6 signed off (2026-07-11) |
| **Scope** | Slice 1 (dev stack, Songs import, Songs section). Proportionate — this slice is small; lazy adoption applies to test tooling too. |

> **Purpose.** Written *before* implementation so tests express the **spec**, not the code. It fixes
> the frameworks, what each tier proves, the gates, and the **definition of done**. Kept deliberately
> lean for slice 1; heavier machinery is added on a concrete trigger.

---

## 1. Principles

1. **Test-first where behaviour is deterministic and contract-pinned** — the FE behaviour in the
   `FR`s (filters, navigation, the side-by-side lyrics) and any owned services logic: write the test
   from the requirement, watch it fail, implement to green.
2. **Verify rather than re-test the framework** — the migration leans on the Migrate module's own
   mechanisms; we verify *outcomes* (counts, spot-checks), not Migrate itself (NFR-3).
3. **Tests live in the same commit as the behaviour they cover** (§12).
4. **Every numbered requirement (`FR`/`NFR`) is covered by at least one test** (§14).

---

## 2. Frameworks, tooling and invocation

### 2.1 Tooling choices

| Layer | Framework | Notes |
|-------|-----------|-------|
| `content-model` (config) | Config export **verified against `content-model.md`** | Non-negotiable: config is generated in the UI/API and exported, then diffed against the spec — not hand-authored, not unit-tested. |
| `migration` | Drupal **Migrate API** + a `drush` verification (row counts / spot-checks) | No bespoke migration tests (NFR-3). One small **PHPUnit unit test** for the deterministic FR-21 rich-text cleanup transform. |
| `services` (custom module) | **PHPUnit** (Unit / Kernel) | For owned logic only (thin in slice 1). |
| `theme` (front end) | **Playwright** + **Axe** (`@axe-core/playwright`) | The Songs landing and Song page flows + WCAG 2.1 AA checks (NFR-1, NFR-7). |
| coding standards | **PHPCS** — `Drupal` + `DrupalPractice` (`drupal/coder`) | **Custom code only** (`web/modules/custom` + the custom theme's PHP/Twig); **never core/contrib**. |
| static analysis / deprecations | **PHPStan** + `phpstan-drupal` + deprecation rules | **Custom code only.** Catches deprecated-API usage — the upgrade-safety gate (guards against the PHP-EOL trap that ended v2). Starts at a modest level with deprecation rules on. |
| boundary rule | **deptrac** or a custom check (finalized at scaffolding) | Enforces the dependency rule (§5). |

### 2.2 Invocation — the command pattern

| Command | What it runs | When |
|---------|-------------|------|
| `lando test` | **the default gate** — PHPUnit (Unit/Kernel/Functional) + **PHPCS** + **PHPStan** (both **custom code only**) + the boundary check | every ticket |
| `lando playwright` | Playwright FE + Axe suite (against the Lando URL) | tickets touching the theme / song screens |
| `lando test-all` | everything (the default gate **+ Playwright**) | milestone completion |

> **`lando test-all` is not a single wired Lando command** (decided at scaffolding, INT8-006): the
> default gate runs on the `appserver` service while Playwright runs on a separate `pw` compose
> service, so a single Lando tooling command cannot span both. "`lando test-all`" is therefore
> shorthand for **running `lando test` then `lando playwright` from the host** at milestone completion.
>
> Command wiring finalized in the scaffolding milestone (M8): `lando test` runs
> `tooling/run-tests.sh` (PHPUnit + PHPCS + PHPStan, all **scoped to `web/modules/custom`** and the
> custom theme via `.phpcs.xml`/`phpstan.neon`, + `tooling/check-boundary.sh`); `lando playwright`
> runs `@playwright/test` against the Lando site on the dedicated `pw` service.

### 2.3 Coverage policy

**No numeric coverage gate in slice 1.** There is no pure-core layer to hold to 100%, and a coverage
number on a thin slice would be ceremony. Coverage is revisited when the services layer grows (lazy).

---

## 3. The test pyramid (slice 1)

Deliberately thin and top-light for this slice:

- **A few unit tests** — the FR-21 rich-text cleanup transform; any owned services helper.
- **Migration verification** — counts + spot-checks after import (§4).
- **The bulk: Playwright FE/E2E** — the two built screens are where the user-facing `FR`s live, so
  that is where the tests concentrate, plus Axe for a11y.

As later slices add services logic and entities, the pyramid broadens at the unit/Kernel base.

---

## 4. Migration verification

Instead of testing the Migrate framework, verify the **import outcome** (FR-1–FR-5):

- **Count parity** — imported Song count equals the source active-song count (a documented `drush`
  command).
- **Spot-checks** — a sample of songs correctly maps name, lyrics, notes, quotes, video, type, the
  parent self-reference, `Song_Live`, and `field_legacy_id`.
- **Idempotency / rollback (FR-4, NFR-3)** — re-run creates no duplicates; rollback removes cleanly
  (Migrate map + `drush migrate:rollback`).
- **FR-21 transform** — a small **unit test** asserts legacy markup is normalized and line/paragraph
  breaks are preserved (deterministic, so test-first).

---

## 5. Enforcing the dependency rule

The architecture rule (`content-model → services → theme`, `migration` → `content-model`; nothing
imports `theme`; architecture §2.1) is enforced by a boundary check (deptrac or a custom PHPUnit
test), wired in at scaffolding (M8) and run inside the **default gate** — a violation fails it. The
ticket `depends_on` graph must agree (NFR-5).

---

## 6. Interface / integration testing

The read surface is `GET /songs` and `GET /songs/<slug>` (`api-contract.md`). These are exercised by
the Playwright suite (§7) rather than a separate API harness, since the site is server-rendered with
no custom API in slice 1. Pathauto aliases and the 404 for an unknown slug are asserted there.

---

## 7. Front-end testing (Playwright + Axe)

The core of slice-1 testing. Against the Lando site, over a seeded Songs fixture (§8):

**Songs landing** (FR-6–FR-11, FR-16, FR-18, FR-19)
- lists songs as links; **excludes** `field_exclude_from_list` (FR-6); complete list, no pagination.
- Type filter defaults to **Modest Mouse**; selecting a type narrows the list (FR-9).
- Alternate-titles **Show/Hide** behaves per FR-10; *Released/Played-live* render **disabled** (FR-11).
- article-insensitive sort (FR-8); empty-state on a no-match filter combo (FR-19).
- a song link navigates to its page (FR-16).

**Song page** (FR-12–FR-17, FR-20)
- renders name, quote, lyrics, notes, embedded video; omits absent fields (FR-15); **no** type/group,
  no release/live/tab/studio (FR-12/FR-14).
- alternate version shows the **side-by-side** lyrics + parent link, and "[same as normal version]"
  when identical (FR-20); a parent lists its alternates (FR-13).

**Accessibility (NFR-1)** — **Automated (in the gate):** Axe on both screens (no serious/critical
violations), plus keyboard operability and visible focus on the filter controls. **Manual (deferred to
a periodic pass, not per-ticket):** screen-reader walkthroughs and a formal WCAG audit — Axe catches
only ~a third of WCAG issues, so automated-green ≠ fully accessible.

**Responsive (NFR-2)** — both screens asserted at a **320px** viewport and desktop.

**Not covered here (deferred, each with a home):**
- the **homepage** (design-only, not built in slice 1) and the deferred relationships;
- **performance + Lighthouse** → a **pre-launch performance pass** (NFR-4): budgets set against real
  content and caching; Drupal's default page/dynamic/BigPipe caching covers the baseline meanwhile;
- **SEO** (Metatag titles/descriptions, schema.org structured data, XML sitemap, and the legacy-URL
  redirects) → the **SEO slice**. The structural base SEO relies on — semantic markup, a single
  `<h1>` + heading order, and clean Pathauto URLs — is already enforced here by the a11y checks and the
  architecture, so the SEO slice starts from a sound base, not remediation;
- **manual a11y audit** (screen-reader / formal WCAG) → a periodic pass.

---

## 8. Test data and fixtures

A small, committed **Songs fixture** exercising the edge cases: a normal song; a parent with an
alternate-title child; an alternate-lyrics version (`Song_Live = 1`, hidden from the landing) with
differing and "same-as-normal" lyrics; songs across all types (Modest Mouse / Ugly Casanova / Side
projects / Covers); a song with no lyrics/video (empty-field paths). Sourced as a curated subset of
the v2 dump so migration spot-checks and FE tests share one fixture.

---

## 9. Definition of done (implementation tickets)

Binding checklist — kept in sync with root `CLAUDE.md` and the ticket template:

- [ ] The default gate (`lando test` — PHPUnit + PHPCS + PHPStan on custom code + boundary check) passes **with zero warnings** (PHPStan reports **no deprecated-API usage**).
- [ ] New/changed numbered-requirement behaviour has tests **in the same commit** (§12.2 rule).
- [ ] The relevant heavier suite passes where the ticket says so (`lando playwright` for theme/song-screen tickets).
- [ ] The dependency-rule boundary check passes (§5).
- [ ] The ticket's `status` + `## Notes` and its `BOARD.md` row are updated in **that same commit**.
- [ ] A completion report (summary + one-line sanity test; QA steps for UI tickets) is recorded.

Docs-only, pure-styling, and build-plumbing tickets may set `tests_required: false` and must state
the exemption in the body.

---

## 10. Conventions

- **PHP tests:** `web/modules/custom/<module>/tests/src/{Unit,Kernel,Functional}` (Drupal convention).
- **Playwright tests:** `tests/playwright/` (specs + the Axe helper); page objects for the two screens.
- **CI:** none in slice 1 — the **local pre-commit hook** runs the default gate (per the git-workflow
  proposal). CI is added on a concrete trigger (lazy).

---

## 11. Decisions log

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
- **2026-07-11** — **Boundary-check tool (deptrac vs custom) finalized at scaffolding**; runs in the
  default gate.

---

## 12. Traceability — requirements to tests

Test *type* per requirement; the concrete test files are filled during ticket work (M7/M9).

| Requirement(s) | Covered by |
|----------------|-----------|
| FR-1 – FR-5 | Migration verification (counts, spot-checks, idempotency/rollback) — §4 |
| FR-21 | Unit test on the rich-text cleanup transform — §4 |
| FR-6 – FR-11, FR-16, FR-18, FR-19 | Playwright — Songs landing — §7 |
| FR-12 – FR-15, FR-17, FR-20, FR-13 | Playwright — Song page (incl. side-by-side) — §7 |
| NFR-1 | Axe (a11y) + keyboard/focus checks — §7 |
| NFR-2 | Responsive assertions at 320px + desktop — §7 |
| NFR-3 | Idempotent/rollbackable migration — §4 |
| NFR-5 | Dependency-rule boundary check — §5 |
| NFR-6 | Config export verified against `content-model.md` — §2.1 |
| NFR-7 | The Playwright suite exists and runs — §7 |
| NFR-4 | (deferred — no perf gate in slice 1) |
| NFR-8 | Browser matrix covered by the Playwright project config |

> **PHPCS** and **PHPStan** are cross-cutting quality gates (Drupal coding standards + deprecation
> safety), not tied to a numbered requirement; they run in the default gate on custom code (§2).
