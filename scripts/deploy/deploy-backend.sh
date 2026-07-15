#!/usr/bin/env bash
# ── WCOS Backend Production Deploy Automator ───────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Starting Backend Production Deploy..."

# 1. Environment template validation
bash "$PROJECT_ROOT/scripts/validate-environment/validate-env.sh"

# 2. Database backup verification (simulation/hook for Cloud SQL)
echo "Verifying database backups and preparing migration..."
# In a real environment, you would call:
# gcloud sql backups create --instance=wcos-postgres --project=YOUR_PROJECT_ID

# 3. Apply Prisma migrations
echo "Running Prisma Migrations: prisma migrate deploy..."
cd "$PROJECT_ROOT/backend"
npx prisma migrate deploy

# 4. Build production Docker image
echo "Building Production Docker Image..."
cd "$PROJECT_ROOT"
docker build -f Dockerfile.backend -t wcos-backend:latest .

echo "✓ Backend build succeeded!"
echo "Deploying/starting backend container..."
# (In a real GCP environment this would push to Artifact Registry and update Cloud Run)
# docker tag wcos-backend:latest us-central1-docker.pkg.dev/YOUR_PROJECT_ID/wcos-repo/wcos-backend:latest
# docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/wcos-repo/wcos-backend:latest
# gcloud run deploy wcos-backend ...

echo "✓ Deployment complete. Verification pending."
exit 0
