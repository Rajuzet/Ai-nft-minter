# ── WCOS Environment Template Validator (PowerShell) ───────────────────

$ProjectRoot = Resolve-Path "$PSScriptRoot\..\.."

Write-Host "Checking environment templates in $ProjectRoot..."

$EnvFiles = @(
  ".env.local.example",
  ".env.development.example",
  ".env.test.example",
  ".env.staging.example",
  ".env.production.example"
)

$AllExist = $true

foreach ($file in $EnvFiles) {
  $path = Join-Path $ProjectRoot $file
  if (Test-Path $path) {
    Write-Host "✓ $file exists." -ForegroundColor Green
  } else {
    Write-Host "✗ Missing $file!" -ForegroundColor Red
    $AllExist = $false
  }
}

if ($AllExist) {
  Write-Host "✓ All environment templates present." -ForegroundColor Green
  exit 0
} else {
  Write-Error "Missing environment templates!"
  exit 1
}
