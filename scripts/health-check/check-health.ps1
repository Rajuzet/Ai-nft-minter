# ── WCOS Service Health Checker (PowerShell) ───────────────────────────

$Port = if ($env:PORT) { $env:PORT } else { 3001 }
$HostName = "localhost"
$HealthUrl = "http://$HostName:$Port/health"
$StatusUrl = "http://$HostName:$Port/api/status"

Write-Host "Checking backend health at $HealthUrl..."

try {
  $Response = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 5
  Write-Host "✓ Health endpoint is accessible!" -ForegroundColor Green
  $Response | ConvertTo-Json
} catch {
  Write-Host "✗ Health endpoint check failed! Cannot connect to $HealthUrl." -ForegroundColor Red
  exit 1
}

Write-Host "Checking API status at $StatusUrl..."

try {
  $Response = Invoke-RestMethod -Uri $StatusUrl -Method Get -TimeoutSec 5
  Write-Host "✓ Status endpoint is accessible!" -ForegroundColor Green
  $Response | ConvertTo-Json
} catch {
  Write-Host "✗ Status endpoint check failed! Cannot connect to $StatusUrl." -ForegroundColor Red
  exit 1
}

exit 0
