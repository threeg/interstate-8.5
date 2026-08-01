#!/usr/bin/env bash
# Fast lint-only gate — PHPCS + PHPStan + boundary check, no PHPUnit (INT8-042).
# Invoked by: lando lint
# A dev-convenience subset of the default gate (tooling/run-tests.sh), not a
# substitute for it — lando test is still the definition-of-done gate.
# All checks must pass with zero warnings.

set -euo pipefail

ROOT=/app

echo "=============================="
echo " Lint-only gate: INT8"
echo "=============================="

echo ""
echo "--- 1/3  PHPCS (Drupal + DrupalPractice, custom code) ---"
php "${ROOT}/vendor/bin/phpcs" --standard="${ROOT}/.phpcs.xml" -p

echo ""
echo "--- 2/3  PHPStan (deprecation rules, custom code) ---"
php "${ROOT}/vendor/bin/phpstan" analyse --configuration "${ROOT}/phpstan.neon" --no-progress

echo ""
echo "--- 3/3  Boundary check ---"
bash "${ROOT}/tooling/check-boundary.sh"

echo ""
echo "=============================="
echo " Lint checks passed. This is NOT the default gate — run 'lando test' before a ticket reaches in-review."
echo "=============================="
