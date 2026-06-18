# Deploy AINFTMinter to Base Sepolia Testnet
# Usage: .\deploy_sepolia.ps1

$ForgePath = "$env:USERPROFILE\.foundry\bin\forge.exe"
$EnvFile = "$PSScriptRoot\.env"

# Load environment variables from .env file
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.+)$") {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
    Write-Host "Loaded environment from $EnvFile" -ForegroundColor Green
} else {
    Write-Error "contracts/.env not found. Please copy .env.example to .env and fill in your credentials."
    exit 1
}

$privateKey = $env:PRIVATE_KEY
$rpcUrl = $env:RPC_URL
$basescanKey = $env:BASESCAN_API_KEY

if (-not $privateKey -or $privateKey -eq "0xYOUR_PRIVATE_KEY_HERE") {
    Write-Error "PRIVATE_KEY is not set or is still the placeholder. Update contracts/.env"
    exit 1
}
if (-not $rpcUrl) {
    $rpcUrl = "https://sepolia.base.org"
    Write-Host "RPC_URL not set — defaulting to https://sepolia.base.org" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploying AINFTMinter to Base Sepolia" -ForegroundColor Cyan
Write-Host "  RPC: $rpcUrl" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run forge deployment
& $ForgePath script script/DeployAINFTMinter.s.sol `
    --rpc-url $rpcUrl `
    --broadcast `
    --private-key $privateKey `
    -vvvv

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment succeeded!" -ForegroundColor Green
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Copy the deployed contract address from 'Contract Address:' above." -ForegroundColor White
    Write-Host "   2. Paste it into frontend/.env.local under NEXT_PUBLIC_AINFT_MINTER_ADDRESS" -ForegroundColor White
    Write-Host "   3. Verify on Base Sepolia: https://sepolia.basescan.org" -ForegroundColor White

    # Optionally verify on Basescan
    if ($basescanKey -and $basescanKey -ne "your_basescan_api_key") {
        Write-Host ""
        Write-Host "Verifying contract on Basescan..." -ForegroundColor Cyan
        & $ForgePath verify-contract `
            --chain-id 84532 `
            --etherscan-api-key $basescanKey `
            --rpc-url $rpcUrl `
            $(& $ForgePath script script/DeployAINFTMinter.s.sol --json | ConvertFrom-Json | Select-Object -ExpandProperty deployments | Select-Object -First 1 | Select-Object -ExpandProperty address) `
            src/AINFTMinter.sol:AINFTMinter
    }
} else {
    Write-Error "Deployment failed. Check forge output above for errors."
    exit 1
}
