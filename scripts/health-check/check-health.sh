#!/usr/bin/env bash
# ── WCOS Service Health Checker ────────────────────────────────────────

set -euo pipefail

PORT=${PORT:-3001}
HOST=${HOST:-localhost}
HEALTH_URL="http://$HOST:$PORT/health"
STATUS_URL="http://$HOST:$PORT/api/status"

echo "Checking backend health at $HEALTH_URL..."

if curl -s -f "$HEALTH_URL" > /dev/null; then
  echo "✓ Health endpoint is accessible!"
  curl -s "$HEALTH_URL" | jq . || curl -s "$HEALTH_URL"
else
  echo "✗ Health endpoint check failed! Cannot connect to $HEALTH_URL."
  exit 1
fi

echo "Checking API status at $STATUS_URL..."
if curl -s -f "$STATUS_URL" > /dev/null; then
  echo "✓ Status endpoint is accessible!"
  curl -s "$STATUS_URL" | jq . || curl -s "$STATUS_URL"
else
  echo "✗ Status endpoint check failed! Cannot connect to $STATUS_URL."
  exit 1
fi

exit 0
