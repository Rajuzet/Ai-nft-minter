# Local deployment script for AINFTMinter

$ForgePath = "$PSScriptRoot\..\.foundry\forge.exe"
$AnvilPath = "$PSScriptRoot\..\.foundry\anvil.exe"

# Anvil Default Account 0 Private Key and RPC Url
$PrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
$RpcUrl = "http://127.0.0.1:8545"

Write-Host "Starting Anvil local node in the background..." -ForegroundColor Cyan
Start-Process -FilePath $AnvilPath -NoNewWindow -PassThru

# Wait 3 seconds for Anvil to spin up
Start-Sleep -Seconds 3

Write-Host "Deploying WCOS Smart Contracts to Anvil..." -ForegroundColor Cyan
& $ForgePath script script/DeployAll.s.sol --rpc-url $RpcUrl --broadcast --private-key $PrivateKey -vvvv

Write-Host "Deployment complete! Please check the output above for the deployed contract addresses." -ForegroundColor Green
Write-Host "Configure the contract address in frontend/.env.local under NEXT_PUBLIC_AINFT_MINTER_ADDRESS" -ForegroundColor Yellow
