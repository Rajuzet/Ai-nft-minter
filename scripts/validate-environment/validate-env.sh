#!/usr/bin/env bash
# ── WCOS Environment Template Validator ────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Checking environment templates..."

ENV_FILES=(
  ".env.local.example"
  ".env.development.example"
  ".env.test.example"
  ".env.staging.example"
  ".env.production.example"
)

ALL_EXIST=true

for file in "${ENV_FILES[@]}"; do
  if [ -f "$PROJECT_ROOT/$file" ]; then
    echo "✓ $file exists."
  else
    echo "✗ Missing $file!"
    ALL_EXIST=false
  fi
done

if [ "$ALL_EXIST" = true ]; then
  echo "✓ Environment validation script: All environment templates present."
  exit 0
else
  echo "✗ Missing template files!"
  exit 1
fi
