#!/usr/bin/env bash
# Boundary check — enforces the architecture dependency rule:
#   content-model → services → theme
#   migration → content-model
#   NOTHING imports theme (Drupal\interstate_85\*)
#
# Run via: lando test  (included in the default gate)
# Returns exit 1 on any violation, 0 on clean.

set -euo pipefail

VIOLATIONS=0
THEME_NS="Drupal\\\\interstate_85"
CUSTOM_MODULES="web/modules/custom"

# Rule: nothing in custom modules may import the theme namespace.
if [ -d "$CUSTOM_MODULES" ]; then
  HITS=$(grep -rE "use ${THEME_NS}" "$CUSTOM_MODULES" 2>/dev/null \
    | grep -v '^\s*//' || true)
  if [ -n "$HITS" ]; then
    echo "BOUNDARY VIOLATION: custom module imports theme namespace (Drupal\\interstate_85):"
    echo "$HITS"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
fi

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "Boundary check passed (0 violations)."
  exit 0
else
  echo "Boundary check FAILED — $VIOLATIONS violation(s)."
  exit 1
fi
