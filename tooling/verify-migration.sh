#!/usr/bin/env bash
# Migration verification (INT8-014) — proves the song_type + song import per
# test-strategy.md §4: count parity (FR-5), field-mapping spot-checks,
# idempotency + rollback (FR-4/NFR-3).
#
# NOT part of the default gate (lando test): requires the real seeded `legacy`
# DB and runs a real import/rollback/re-import cycle against the site. Ends in
# the same state it started (fully imported) — safe to re-run any time.
#
# Run via: lando ssh -c "bash tooling/verify-migration.sh"
# Returns exit 1 if any check fails.

set -euo pipefail

FAILURES=0

section() {
  echo ""
  echo "=== $1 ==="
}

run_php_checks() {
  drush php:eval "
    \$failures = 0;
    require '/app/tooling/migration-verification-checks.php';
    if (\$failures > 0) {
      fwrite(STDERR, \"\n{\$failures} check(s) failed.\n\");
      exit(1);
    }
    echo \"\nAll checks passed.\n\";
  "
}

section "1/4 Count parity + field-mapping spot-checks"
if ! run_php_checks; then
  FAILURES=$((FAILURES + 1))
fi

section "2/4 Idempotency (re-import creates no duplicates)"
BEFORE=$(drush php:eval "echo count(\Drupal::entityQuery('node')->condition('type','song')->accessCheck(FALSE)->execute());")
drush migrate:import song
AFTER=$(drush php:eval "echo count(\Drupal::entityQuery('node')->condition('type','song')->accessCheck(FALSE)->execute());")
if [ "$BEFORE" = "$AFTER" ]; then
  echo "  [PASS] song node count unchanged by re-import: $AFTER"
else
  echo "  [FAIL] song node count changed by re-import: $BEFORE -> $AFTER"
  FAILURES=$((FAILURES + 1))
fi

section "3/4 Rollback (removes cleanly)"
drush migrate:rollback song
AFTER_ROLLBACK=$(drush php:eval "echo count(\Drupal::entityQuery('node')->condition('type','song')->accessCheck(FALSE)->execute());")
if [ "$AFTER_ROLLBACK" = "0" ]; then
  echo "  [PASS] song node count after rollback: 0"
else
  echo "  [FAIL] song node count after rollback: expected 0, got $AFTER_ROLLBACK"
  FAILURES=$((FAILURES + 1))
fi

section "4/4 Restore imported state"
drush migrate:import song
RESTORED=$(drush php:eval "echo count(\Drupal::entityQuery('node')->condition('type','song')->accessCheck(FALSE)->execute());")
if [ "$RESTORED" = "$BEFORE" ]; then
  echo "  [PASS] song node count restored: $RESTORED"
else
  echo "  [FAIL] song node count not restored: expected $BEFORE, got $RESTORED"
  FAILURES=$((FAILURES + 1))
fi

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "=== Migration verification passed (0 failures) ==="
  exit 0
else
  echo "=== Migration verification FAILED ($FAILURES section(s)) ==="
  exit 1
fi
