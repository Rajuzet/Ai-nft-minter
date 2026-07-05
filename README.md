# Web3 Creator Operating System (WCOS) — AI NFT Platform

A production-ready Web3 platform for AI-powered NFT artwork generation, custom collection deployment, non-custodial wallet minting, marketplace listings, DAO governance, and DeFi yield tools built on **Base Sepolia / Base Mainnet**.

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

## 🚀 Quick Local Setup Guide

### 1. Prerequisites
- Node.js ≥ 18 and npm
- Git

---

### 2. Backend Setup (`backend/`)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Generate Prisma ORM client & sync database
npx prisma generate
npx prisma db push

# Build and start the backend gateway
npm run build
node dist/main.js
```
*Backend Gateway runs on `http://localhost:4000`.*

#### Backend Health & Status Endpoints
- Health Check: `http://localhost:4000/health`
- API Status: `http://localhost:4000/api/status`
- Swagger Documentation: `http://localhost:4000/api/docs`

---

### 3. Frontend Setup (`frontend/`)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Run production build and start server
npm run build
npm run start
```
*Frontend Application runs on `http://localhost:3000`.*

#### Frontend API Configuration
Set in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_DEFAULT_CHAIN=base-sepolia
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532
NEXT_PUBLIC_AINFT_MINTER_ADDRESS=0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A
```

#### Diagnostic Debug Page
Open `http://localhost:3000/debug` in your browser to test backend API gateway connectivity and database health in real time.

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
- 🔐 **SIWE Wallet Auth** (`GET /api/v1/auth/nonce`, `POST /api/v1/auth/verify`) — Non-custodial sign-in.
- 📊 **Transaction Indexer** (`GET /api/v1/transactions`) — Persisted on-chain activity history.

---

## 📜 License

MIT