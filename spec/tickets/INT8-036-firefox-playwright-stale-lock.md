---
id: INT8-036
title: Restore Firefox coverage in the Playwright suite (stale profile-lock symlink) and correct the record
type: task
status: done
milestone: 9
batch: cleanup
layer: tooling
depends_on: [INT8-006, INT8-021]
implements: [NFR-7, NFR-8]
tests_required: false
estimate: 2
---

## In plain English
Our browser tests have not actually run in Firefox since 20 July — every Firefox test has been failing,
and eight tickets wrote that off as "a broken test environment we can't fix." It was neither broken nor
unfixable: a single leftover file was jamming it. Deleting that file makes all 545 tests pass in every
browser. This makes the fix permanent so one crashed test run can't silently switch off a whole
browser again, and corrects what those eight tickets say happened.

## Background

`lando playwright` **exits 1**. All 109 Firefox tests fail with:

```
browserType.launch: ENOENT: no such file or directory, stat '/ms-playwright/firefox-1532/firefox/lock'
```

**Root cause (diagnosed, not assumed).** There is a dangling symlink in the Firefox install directory:

```
lrwxrwxrwx 1 www-data www-data 16 Jul 20 18:46
  /ms-playwright/firefox-1532/firefox/lock -> 172.23.0.2:+6143
```

`<ip>:+<pid>` is Firefox's own profile-lock format. A Firefox process was killed rather than exiting
cleanly on **2026-07-20** and left its lock behind. The target does not exist, so `stat()` on it returns
`ENOENT` — and because Firefox stats that path on every startup, **every subsequent launch fails
permanently**, in every spec file, forever, until the symlink is removed.

**Proven:** removing that one symlink and rerunning gives **545/545 passing across all five browser
projects** (chromium, firefox, webkit, mobile-chrome, mobile-safari). No genuine Firefox-specific
application defects were hiding behind the failure — the application code is fine; only the coverage was
missing.

**The recorded diagnosis is wrong, and was copied forward eight times.** INT8-018/019/021/027/028/029/
030/031 all record this as *"the Firefox binary is missing from the `pw` service"* and *"a pre-existing
tooling gap from scaffolding (INT8-006)"*. Both halves are false:

- The binary **is** present and complete — `/ms-playwright/firefox-1532/` contains
  `INSTALLATION_COMPLETE`, `DEPENDENCIES_VALIDATED` and a full `firefox/` tree; symlink creation in that
  directory works.
- **INT8-006's own notes record Firefox passing** at scaffolding: *"Smoke test verified against all 5
  browser targets (chromium, firefox, webkit, mobile-chrome, mobile-safari) — all pass."*

So this is a **2026-07-20 regression**, not a pre-existing environmental gap, and it was never out of
scope in the way those tickets state.

**Why this is in the main sequence, not the cleanup backlog.** Root `CLAUDE.md` and
`spec/verify/verify.md` §1 both require `lando test-all` (default gate **+** Playwright) green **at
milestone completion**, and Milestone 9 sign-off is the next step. Separately, **NFR-8 names Firefox**
and `BOARD.md` maps NFR-8 → INT8-021 (`done`) — so a requirement is currently recorded as implemented
while one of its four named browsers had zero passing coverage. That is a gate failure and a
traceability defect, which CONVENTIONS §6.5 promotes out of the backlog; it is not an internal-quality
improvement to already-correct behaviour (§6.6).

## Technical requirements

1. **Make `lando playwright` resilient to a stale lock.** A killed run must not be able to disable a
   browser indefinitely. Clear dangling lock symlinks before the suite runs — in the `playwright`
   tooling command in `.lando.yml` (currently
   `bash -c 'cd /app/tests/playwright && npm install --silent && npx playwright test'`), or in a small
   wrapper script under `tooling/` if that reads better beside `tooling/run-tests.sh`.

   The targeted form, which deletes **only** broken symlinks and touches nothing real:

   ```bash
   find /ms-playwright -name lock -xtype l -delete
   ```

   `-xtype l` matches a symlink whose target does not resolve, so a live lock from a genuinely running
   browser is left alone. Verify that claim before relying on it rather than trusting this ticket's text.

2. **Investigate why the lock lands in the install directory at all**, and record the finding in
   `## Notes` even if nothing further is changed. Firefox writes its profile lock into its *profile*
   directory; it appearing under `/ms-playwright/firefox-1532/firefox/` suggests the profile path
   resolves somewhere unintended in the `pw` container (`HOME=/var/www`, running as `uid=1000(www-data)`).
   If a one-line environment fix stops it recurring at source, prefer that over — or alongside — step 1.
   Do **not** widen this ticket into a container rebuild.

3. **Correct the record in the eight affected tickets.** Append a dated `## Notes` correction to
   INT8-018, INT8-019, INT8-021, INT8-027, INT8-028, INT8-029, INT8-030 and INT8-031 stating the real
   cause, that it was a 2026-07-20 regression rather than a scaffolding-era gap, and that the matrix is
   green once fixed. **Append — do not rewrite** the original notes: the point is an honest record of
   what was believed and when, not a tidied history.

4. **Reconcile INT8-021's definition of done.** Its DoD boxes are checked with the caveat *"all projects
   green except the pre-existing, documented firefox-in-`pw`-container gap"* and *"`lando test-all` green
   (default gate + Playwright, same caveat)"*. Once Firefox passes, the caveats are obsolete — restate
   them plainly. INT8-021 stays `done`; this is a note correction, not a reopening.

5. **Update `BOARD.md` traceability** so NFR-7 and NFR-8 list INT8-036 alongside INT8-021.

Out of scope: any application-code change (nothing is wrong with it — the full matrix passes);
upgrading Playwright or the `pw` image; the browser-matrix composition itself (NFR-8's browser list is
settled); INT8-033's separate Playwright-assertion cleanup.

## Definition of done (acceptance criteria)
- [x] `lando playwright` exits **0** with **545/545 passing**, Firefox included.
- [x] A stale lock left behind by a killed run no longer disables the suite — verified by recreating the
      condition deliberately (`ln -s 1.2.3.4:+999 /ms-playwright/firefox-1532/firefox/lock`) and
      confirming the next `lando playwright` still passes.
- [x] The profile-lock-location finding from step 2 is recorded in `## Notes`, whatever it turns out to be.
- [x] All eight tickets carry a dated correction; INT8-021's DoD caveats are restated.
- [x] `BOARD.md` traceability lists INT8-036 against NFR-7 and NFR-8.
- [x] `lando test` still green (unchanged — this ticket touches no PHP).
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification

`tests_required: false` — **build-plumbing** exemption per root `CLAUDE.md`'s definition of done. The
change is to how the test runner is invoked, not to application behaviour, so there is no application
assertion to write test-first; the suite itself is the verification, and the deliberate-recreation check
in the DoD above is the regression test for the plumbing.

Verify with:

```
lando playwright                      # expect: 545 passed, exit 0
lando ssh -s pw -c "ls -la /ms-playwright/firefox-1532/firefox/lock"   # expect: no such file
```

## Notes
- 2026-07-27 — created by `sfk-verify` on the theme batch (INT8-015…021, 027–031). Root cause diagnosed
  during that run: the dangling `lock` symlink was found by inspecting the browser directory the error
  message named, rather than accepting the "missing binary" explanation the tickets carried. Removing it
  in the running container took the suite from 436/545 to **545/545** immediately, which is what
  established that no application defect was involved. Promoted into the main sequence at the site
  owner's decision, before Milestone 9 sign-off.

- 2026-07-27 — **implemented, in review.** `.lando.yml`'s `playwright` tooling command now runs
  `find /ms-playwright -name lock -xtype l -delete` before `npx playwright test`. Verified the `-xtype l`
  claim directly rather than trusting it: created both a dangling lock symlink and a live-target symlink
  under a scratch directory, ran the exact `find` invocation, and confirmed only the dangling one was
  removed. Verified the regression test in the DoD by hand: recreated
  `/ms-playwright/firefox-1532/firefox/lock -> 1.2.3.4:+999` deliberately, then ran `lando playwright` —
  545/545 passed, and the stale symlink was gone afterward.

  **Step 2 finding (profile-lock location).** `HOME=/var/www` is set for `www-data` in the `pw`
  container and is writable, but no `~/.mozilla` profile directory has ever been created there —
  Playwright drives Firefox with its own ephemeral per-run temp profile, so normal profile-lock
  resolution via `$HOME` is not the mechanism. The `lock` symlink instead appears directly inside the
  *installation* directory (`/ms-playwright/firefox-1532/firefox/`), alongside a `.parentlock` regular
  file that gets recreated on every launch. This is most consistent with Playwright's own one-time
  post-install browser-validation launch (evidenced by the adjacent `INSTALLATION_COMPLETE` /
  `DEPENDENCIES_VALIDATED` marker files in that same directory) — a launch that doesn't go through a
  per-test temp profile — being killed mid-run on 2026-07-20 and leaving its lock in the shared install
  directory rather than a disposable one. No environment variable fix was found that stops it landing
  there at source (root cause sits inside Playwright's/Firefox's own launch code, not this container's
  configuration), so this ticket relies on step 1's defensive cleanup rather than a source fix, per the
  ticket's own instruction not to widen into a container rebuild.

  Corrected the record in all eight affected tickets (INT8-018, 019, 021, 027, 028, 029, 030, 031) with a
  dated, appended note — originals left intact. INT8-021's DoD caveats and summary were restated plainly
  (its own correction, per this ticket's requirement 4, rather than a bare append). `BOARD.md`
  traceability already listed INT8-036 against NFR-7/NFR-8 from its creation.

  **Summary:** a single leftover symlink from a killed Firefox launch on 2026-07-20 was silently failing
  every Firefox test ever since; eight tickets recorded it as an unfixable, pre-existing environment gap.
  The suite now clears dangling lock symlinks before every `lando playwright` run, so a future killed run
  can't repeat this, and all eight tickets' records are corrected.

  **Sanity test:** `lando ssh -s pw -c "ln -s 1.2.3.4:+999 /ms-playwright/firefox-1532/firefox/lock" && lando playwright` → 545/545 passed.
