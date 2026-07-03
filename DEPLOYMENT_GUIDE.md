# Web3 Creator Operating System (WCOS) — Google Cloud Deployment Guide

This guide details the step-by-step production deployment of the WCOS platform using **Google Cloud Platform (GCP)** services: **Cloud Run** for containerized backend execution, **Cloud SQL (PostgreSQL)** for persistence, **Google Cloud Storage (GCS)** for media assets, **Secret Manager** for API keys, and **Base Sepolia / Mainnet L2** for smart contracts.

---

## 1. Prerequisites & GCP Setup

### A. Install GCP CLI & Authenticate
```bash
# Install gcloud CLI and authenticate
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

### B. Enable GCP Services
```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Google Cloud Infrastructure Setup

### A. Cloud SQL (PostgreSQL)
```bash
# Create Cloud SQL PostgreSQL Instance
gcloud sql instances create wcos-postgres \
  --database-version=POSTGRES_15 \
  --cpu=2 \
  --memory=7680MB \
  --region=us-central1

# Create Database and User
gcloud sql databases create wcos_db --instance=wcos-postgres
gcloud sql users create wcos_user --instance=wcos-postgres --password=YOUR_SECURE_PASSWORD
```

### B. Google Cloud Storage Bucket
```bash
# Create GCS Bucket for Creator Assets & NFT Metadata
gcloud storage buckets create gs://wcos-creator-assets \
  --location=us-central1 \
  --uniform-bucket-level-access

# Allow public read access to images/metadata
gcloud storage buckets add-iam-policy-binding gs://wcos-creator-assets \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

### C. Secret Manager Configuration
```bash
# Store Sensitive API Keys in GCP Secret Manager
gcloud secrets create DATABASE_URL --replication-policy="automatic"
echo -n "postgresql://wcos_user:YOUR_SECURE_PASSWORD@/wcos_db?host=/cloudsql/YOUR_GCP_PROJECT_ID:us-central1:wcos-postgres" | gcloud secrets versions add DATABASE_URL --data-file=-

gcloud secrets create OPENAI_API_KEY --replication-policy="automatic"
echo -n "sk-proj-YOUR_KEY" | gcloud secrets versions add OPENAI_API_KEY --data-file=-
```

---

## 3. Backend Deployment to Cloud Run

### A. Build & Push Docker Container to Artifact Registry
```bash
# Create Docker repository in Artifact Registry
gcloud artifacts repositories create wcos-repo \
  --repository-format=docker \
  --location=us-central1

# Build and push container image
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/wcos-repo/wcos-backend:latest .
```

### B. Deploy Container to GCP Cloud Run
```bash
gcloud run deploy wcos-backend \
  --image=us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/wcos-repo/wcos-backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --add-cloudsql-instances=YOUR_GCP_PROJECT_ID:us-central1:wcos-postgres \
  --set-env-vars=NODE_ENV=production,STORAGE_PROVIDER=gcs,GCS_BUCKET_NAME=wcos-creator-assets \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest
```

---

## 4. Frontend Deployment (Vercel / Cloud Run)

### A. Deploy Next.js App to Vercel
```bash
cd frontend
npm run build
vercel --prod
```
Set environment variables on Vercel Dashboard:
- `NEXT_PUBLIC_BACKEND_URL`: `https://wcos-backend-xyz.a.run.app`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: `YOUR_PROJECT_ID`
- `NEXT_PUBLIC_AINFT_MINTER_ADDRESS`: `0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A`

---

## 5. Smart Contract Deployment to Base Sepolia

```bash
cd contracts
source .env
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

---

## 6. End-to-End User Verification Checklist

1. Open deployed Web3 App (`https://wcos-creator-os.vercel.app`).
2. Connect Metamask/Coinbase wallet to Base Sepolia testnet.
3. Open **AI Studio**, enter a prompt, select `GCS` storage, and click **Generate Artwork**.
4. Verify image uploaded to `https://storage.googleapis.com/wcos-creator-assets/` and saved in PostgreSQL `AiAsset` table.
5. Click **Mint NFT with Wallet**, approve gas transaction via wallet prompt.
6. Verify confirmation and click Basescan link (`https://sepolia.basescan.org/tx/0x...`).
7. Open **Marketplace**, approve transfer, and list NFT for fixed ETH price.
8. Switch wallet accounts, click **Buy NFT**, and verify ERC-2981 royalty payout and platform fee split.
