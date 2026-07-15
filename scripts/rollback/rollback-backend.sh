#!/usr/bin/env bash
# ── WCOS Backend Rollback Script ───────────────────────────────────────

set -euo pipefail

echo "Initiating backend container rollback..."

# In production Cloud Run:
# gcloud run services update wcos-backend --rollback-to-revision=PREVIOUS_REVISION

# Local simulation: Re-tag latest stable image and restart
echo "Checking for previous stable image..."
if docker image inspect wcos-backend:rollback > /dev/null 2>&1; then
  echo "✓ Found rollback target image wcos-backend:rollback."
  docker tag wcos-backend:rollback wcos-backend:latest
  echo "✓ Successfully restored latest tag to rollback target!"
  echo "✓ Please restart the container now."
  exit 0
else
  echo "✗ No rollback target image wcos-backend:rollback was found!"
  exit 1
fi
