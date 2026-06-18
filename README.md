# AI Studio Collective — AI-Powered NFT Minter

A full-stack SaaS application that generates AI artwork using **Amazon Bedrock (Titan Image Generator v2)**, uploads ERC-721-compliant metadata to **AWS S3**, and mints NFTs on the **Base blockchain** via a custom Solidity smart contract with built-in royalty support (ERC-2981).

---

## 🏗️ Architecture

| Layer | Technology |
|---|---|
| **Smart Contract** | Solidity 0.8.20, OpenZeppelin ERC-721 + ERC-2981, Foundry |
| **Backend API** | Next.js Serverless Route (`/api/generate-art`), AWS Bedrock, AWS S3 |
| **Frontend** | Next.js 14 (App Router), Wagmi v2, RainbowKit v2, TailwindCSS |
| **Blockchain** | Base Mainnet / Base Sepolia Testnet |

---

## ✨ Features

- 🎨 **AI Art Generation** — Prompt-driven image synthesis via Amazon Bedrock Titan Image Generator v2.
- 🖼️ **Style Presets** — Choose from Cyberpunk, Cinematic, Anime, Retro Futurism, and Abstract Expressionism.
- 📦 **Serverless Metadata Upload** — Generated images and ERC-721 JSON metadata are stored publicly on AWS S3.
- ⛓️ **On-Chain Minting** — Mint NFTs directly on Base network using your connected wallet.
- 💸 **Royalty Support** — 5% default creator royalty via ERC-2981 standard.
- 🔐 **Wallet Integration** — MetaMask, Coinbase Wallet, and 100+ wallets via RainbowKit.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20 and npm
- [Foundry](https://getfoundry.sh/) (`forge`, `anvil`)
- AWS Account with Bedrock & S3 access
- MetaMask or another EVM wallet

### 1. Clone the repository
```bash
git clone https://github.com/Rajuzet/Ai-nft-minter.git
cd Ai-nft-minter
```

### 2. Configure Environment Variables

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_AINFT_MINTER_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=YourWalletConnectProjectId
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YourAWSAccessKeyId
AWS_SECRET_ACCESS_KEY=YourAWSSecretAccessKey
S3_BUCKET_NAME=your-nft-assets-bucket
S3_PUBLIC_BASE_URL=https://your-bucket.s3.us-east-1.amazonaws.com
```

**Contracts** — create `contracts/.env`:
```env
PRIVATE_KEY=0xYourPrivateKey
BASESCAN_API_KEY=YourBasescanApiKey
RPC_URL=https://sepolia.base.org
```

### 3. Install Frontend Dependencies
```bash
cd frontend && npm install
```

### 4. Deploy Smart Contract to Base Sepolia
```powershell
cd contracts
.\deploy_sepolia.ps1
# Copy the deployed contract address into frontend/.env.local
```

### 5. Run the Frontend
```bash
cd frontend && npm run dev
# Open http://localhost:3000
```

---

## 📄 Smart Contract

| Function | Description |
|---|---|
| `mintAINFT(address, string)` | Mints a new NFT with ERC-721 token URI (payable, 0.005 ETH) |
| `withdrawEarnings()` | Withdraws accumulated mint fees to contract owner |
| `tokenURI(uint256)` | Returns metadata URI for a token |
| `supportsInterface(bytes4)` | ERC-721 + ERC-2981 interface support |

---

## 🌐 Deployment (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set all `AWS_*` and `NEXT_PUBLIC_*` values in Vercel's **Environment Variables** dashboard.
3. Set the **Root Directory** to `frontend` in Vercel project settings.
4. Deploy — Vercel automatically handles the Next.js Serverless build.

---

## 📜 License

MIT