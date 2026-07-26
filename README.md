# Web3 Creator Operating System (WCOS) — AI NFT Platform

A production-ready Web3 platform for AI-powered NFT artwork generation, custom collection deployment, non-custodial wallet minting, marketplace listings, DAO governance, DeFi yield tools, and daily Web3 news ingestion built on **Base Sepolia / Base Mainnet**.

---

## 🏗️ System Architecture

| Tier | Technology Stack |
|---|---|
| **Frontend Web App** | Next.js App Router, React, TailwindCSS, RainbowKit v2, Wagmi v2, Viem |
| **Backend API Gateway** | NestJS, Prisma ORM (SQLite / PostgreSQL), SIWE Auth, OpenAPI / Swagger |
| **Storage Engine** | Unified Storage Service (Google Cloud Storage, AWS S3, IPFS Pinata, Local) |
| **Smart Contracts** | Solidity 0.8.20, OpenZeppelin ERC-721 + ERC-2981, Foundry |
| **Blockchain** | Base Sepolia Testnet (Chain ID `84532`) & Base Mainnet (`84533`) |

---

## 🚀 Quick Setup & Execution Guide

### 1. Prerequisites
- Node.js ≥ 18 and npm
- Git

---

### 2. Backend Setup (`backend/`)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy environment variables template
cp .env.example .env

# 4. Fill DATABASE_URL and JWT_SECRET in backend/.env (defaults preconfigured)

# 5. Generate Prisma ORM client & sync database
npx prisma generate
npx prisma db push

# 6. Start backend development server
npm run start:dev
```
*Backend Gateway runs on `http://localhost:3001`.*

#### Backend Health & Status Endpoints
- **Health Check**: `http://localhost:3001/health` (or `http://localhost:3001/api/health`)
- **API Status**: `http://localhost:3001/api/status`
- **Swagger Documentation**: `http://localhost:3001/api/docs`

---

### 3. Frontend Setup (`frontend/`)

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Run development server (or production build)
npm run dev
```
*Frontend Application runs on `http://localhost:3000`.*

#### Frontend API Configuration
Set in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_DEFAULT_CHAIN=base-sepolia
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A
```

#### Reown AppKit / WalletConnect Setup
1. Go to [Reown Cloud Dashboard](https://cloud.reown.com).
2. Create an AppKit Project.
3. Copy your **Project ID**.
4. Add it to `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_reown_project_id
   ```
5. Restart the frontend server (`npm run dev`).

#### Diagnostic Debug Page
Open `http://localhost:3000/debug` in your browser to test backend API gateway connectivity and database health in real time.

---

## 🧪 Testing Pages & Endpoints

- **Backend Health**: `http://localhost:3001/health`
- **Frontend App**: `http://localhost:3000`
- **Learn Hub**: `http://localhost:3000/learn`
- **User Manual**: `http://localhost:3000/manual`
- **Daily News**: `http://localhost:3000/news`
- **Magazine**: `http://localhost:3000/magazine`
- **AI & IPFS Creator Studio**: `http://localhost:3000/mint`
- **DeFi Swap & Staking**: `http://localhost:3000/defi`
- **DAO Governance**: `http://localhost:3000/dao`

---

## 🧪 Smart Contracts & Testing (`contracts/`)

```bash
cd contracts
forge test
```

---

## 📄 Key Features & API Endpoints

- 🎨 **AI Art Studio** (`POST /api/v1/ai/generate`) — Generate AI artwork & upload ERC-721 metadata.
- 📦 **Collections** (`GET /api/v1/collections`, `POST /api/v1/collections`) — Deploy & manage creator collections.
- 🛒 **Marketplace** (`GET /api/v1/marketplace/listings`, `POST /api/v1/marketplace/list`) — Buy & sell NFTs on-chain.
- 🏛️ **DAO Governance** (`GET /api/v1/daos`, `POST /api/v1/daos/proposals`) — Vote on protocol upgrades.
- 🔐 **SIWE Wallet Auth** (`GET /api/v1/auth/nonce`, `POST /api/v1/auth/verify`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`) — Non-custodial sign-in with Ethereum.
- 📊 **Transaction Indexer** (`GET /api/v1/transactions`) — Persisted on-chain activity history.
- 📰 **Daily News Engine** (`GET /api/v1/news`, `POST /api/v1/news/sync`) — RSS ingestion engine.

---

## 🔐 Sign-In with Ethereum (SIWE) Authentication

WCOS features full **EIP-4361 Sign-In with Ethereum (SIWE)** non-custodial wallet authentication.

### SIWE API Endpoints
- `GET /api/v1/auth/nonce?address=0x...` (or `/api/auth/nonce`): Generates a unique cryptographic nonce stored in Prisma DB.
- `POST /api/v1/auth/verify` (or `/api/auth/verify`): Verifies the wallet's EIP-4361 message signature, checks nonce to prevent replay attacks, clears the nonce, and returns an HMAC-SHA256 JWT session token.
- `POST /api/v1/auth/logout` (or `/api/auth/logout`): Clears active user session.
- `GET /api/v1/auth/me` (or `/api/auth/me`): Returns the currently authenticated user profile from `Authorization: Bearer <jwt_token>`.

---

## 📦 Pinata & IPFS Setup Guide

WCOS provides real IPFS storage integration via **Pinata** for image pinning and standard NFT metadata JSON pinning.

### Environment Configuration in `backend/.env`:
```env
STORAGE_PROVIDER=ipfs
PINATA_JWT=your_pinata_jwt_bearer_token_here
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
```

> [!NOTE]
> **Fallback Mode**: If Pinata credentials are not provided in `backend/.env`, the system will operate in IPFS simulation mode using deterministic CIDs (`ipfs://QmSimulated...`) and IPFS gateway links so local development runs without errors.

---

## 📊 DeFi Center 0x API & RPC Setup Guide

The WCOS DeFi module leverages the **0x Swap API v2** for gas-optimized routing and unsigned swap calldata. It also reads real-time staking APY values directly from the on-chain `WcosStaking.sol` contract.

### Environment Configuration in `backend/.env`:
```env
DEFI_ZEROX_API_KEY="your_0x_api_key_here"
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
```

> [!NOTE]
> **API Key**: You can request a developer API key from the [0x Developer Dashboard](https://dashboard.0x.org/). If the 0x API fails or rate limit is hit, the backend will gracefully fall back to returning simulated swap quotes with warning labels, keeping the UI fully interactive.

---

## ⛓️ Blockchain Event Indexer Setup & Testing

WCOS includes an automated background event indexer that scans RPC logs and synchronizes smart contract events (`NFTMinted`, `Transfer`, `TokenListed`, `TokenBought`, `TokenListingCancelled`, `ProposalCreated`, `VoteCast`, `ProposalExecuted`) directly into the Prisma database.

### Running the Indexer:
```bash
cd backend
npm run indexer
```

---

## 📰 Daily News & Magazine Update System

WCOS includes an automated news ingestion engine that fetches, filters, moderates, and stores Web3, NFT, DeFi, DAO, AI + Blockchain, Regulation, and Marketplace updates from RSS feeds directly into Prisma DB.

### Running Daily News Sync:
```bash
cd backend
npm run news-sync
```

---

## 📜 License

MIT