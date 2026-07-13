#!/usr/bin/env bash
# Default gate — run all four checks (PHPUnit + PHPCS + PHPStan + boundary).
# Invoked by: lando test
# All checks must pass with zero warnings.

set -euo pipefail

ROOT=/app

echo "=============================="
echo " Default gate: INT8"
echo "=============================="

echo ""
echo "--- 1/4  PHPUnit (custom code) ---"
php "${ROOT}/vendor/bin/phpunit" --configuration "${ROOT}/phpunit.xml"

echo ""
echo "--- 2/4  PHPCS (Drupal + DrupalPractice, custom code) ---"
php "${ROOT}/vendor/bin/phpcs" --standard="${ROOT}/.phpcs.xml" -p

echo ""
echo "--- 3/4  PHPStan (deprecation rules, custom code) ---"
php "${ROOT}/vendor/bin/phpstan" analyse --configuration "${ROOT}/phpstan.neon" --no-progress

echo ""
echo "--- 4/4  Boundary check ---"
bash "${ROOT}/tooling/check-boundary.sh"

echo ""
echo "=============================="
echo " All checks passed."
echo "=============================="
