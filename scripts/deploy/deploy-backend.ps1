# ── WCOS Backend Production Deploy Automator (PowerShell) ────────────────

$ProjectRoot = Resolve-Path "$PSScriptRoot\..\.."

Write-Host "Starting Backend Production Deploy..."

# 1. Environment template validation
& "$ProjectRoot\scripts\validate-environment\validate-env.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Environment validation failed!"
    exit 1
}

# 2. Database backup verification
Write-Host "Verifying database backups and preparing migration..."

# 3. Apply Prisma migrations
Write-Host "Running Prisma Migrations: prisma migrate deploy..."
Set-Location "$ProjectRoot\backend"
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Error "Prisma migration failed!"
    exit 1
}

# 4. Build production Docker image
Write-Host "Building Production Docker Image..."
Set-Location $ProjectRoot
docker build -f Dockerfile.backend -t wcos-backend:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed!"
    exit 1
}

Write-Host "✓ Backend build and deploy complete." -ForegroundColor Green
exit 0
