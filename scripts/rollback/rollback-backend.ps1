# ── WCOS Backend Rollback Script (PowerShell) ──────────────────────────

Write-Host "Initiating backend container rollback..."

# Check if rollback image exists locally
$ImageCheck = docker images -q wcos-backend:rollback
if ($ImageCheck) {
  Write-Host "✓ Found rollback target image wcos-backend:rollback." -ForegroundColor Green
  docker tag wcos-backend:rollback wcos-backend:latest
  Write-Host "✓ Successfully restored latest tag to rollback target!" -ForegroundColor Green
  exit 0
} else {
  Write-Error "No rollback target image wcos-backend:rollback was found!"
  exit 1
}
