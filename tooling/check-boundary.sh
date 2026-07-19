#!/usr/bin/env bash
# Boundary check — enforces the full architecture dependency rule (architecture.md §2.1):
#   content-model → services → theme
#   migration → content-model
#   content-model imports nothing project-internal
#   NOTHING imports theme (Drupal\interstate_85\*)
#
# Module → layer convention (custom modules, machine-name suffix):
#   *_migrate  => migration layer  (may depend only on content-model: forbidden from importing
#                 services or theme namespaces)
#   *_services => services layer   (may depend only on content-model: forbidden from importing
#                 migration or theme namespaces)
# content-model is pure Drupal config in this project — no custom-module code exists for it yet,
# so "content-model imports nothing project-internal" has nothing to check today. Revisit this
# script if a content-model custom module is ever added.
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

# Rule: migration modules (*_migrate) may depend only on content-model — forbidden from
# importing a services-layer namespace.
if [ -d "$CUSTOM_MODULES" ]; then
  for dir in "$CUSTOM_MODULES"/*_migrate; do
    [ -d "$dir" ] || continue
    HITS=$(grep -rE 'use Drupal\\[A-Za-z0-9_]*_services\\' "$dir" 2>/dev/null \
      | grep -v '^\s*//' || true)
    if [ -n "$HITS" ]; then
      echo "BOUNDARY VIOLATION: migration module '$dir' imports a services namespace:"
      echo "$HITS"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done
fi

# Rule: services modules (*_services) may depend only on content-model — forbidden from
# importing a migration-layer namespace.
if [ -d "$CUSTOM_MODULES" ]; then
  for dir in "$CUSTOM_MODULES"/*_services; do
    [ -d "$dir" ] || continue
    HITS=$(grep -rE 'use Drupal\\[A-Za-z0-9_]*_migrate\\' "$dir" 2>/dev/null \
      | grep -v '^\s*//' || true)
    if [ -n "$HITS" ]; then
      echo "BOUNDARY VIOLATION: services module '$dir' imports a migration namespace:"
      echo "$HITS"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done
fi

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "Boundary check passed (0 violations)."
  exit 0
else
  echo "Boundary check FAILED — $VIOLATIONS violation(s)."
  exit 1
fi
