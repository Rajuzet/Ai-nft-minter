# Local deployment script for AINFTMinter

# Define Paths
$ForgePath = "C:\Users\SRIJAY~1\.foundry\bin\forge.exe"
$AnvilPath = "C:\Users\SRIJAY~1\.foundry\bin\anvil.exe"

# Anvil Default Account 0 Private Key and RPC Url
$PrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
$RpcUrl = "http://127.0.0.1:8545"

Write-Host "Starting Anvil local node in the background..." -ForegroundColor Cyan
Start-Process -FilePath $AnvilPath -NoNewWindow -PassThru

# Wait 3 seconds for Anvil to spin up
Start-Sleep -Seconds 3

Write-Host "Deploying AINFTMinter to Anvil..." -ForegroundColor Cyan
& $ForgePath script script/DeployAINFTMinter.s.sol --rpc-url $RpcUrl --broadcast --private-key $PrivateKey

Write-Host "Deployment complete! Please check the output above for the deployed contract address." -ForegroundColor Green
Write-Host "Configure the contract address in frontend/.env.local under NEXT_PUBLIC_AINFT_MINTER_ADDRESS" -ForegroundColor Yellow
