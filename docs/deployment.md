# Web3 Creator OS (WCOS) — Deployment Overview

This document provides a high-level overview of the production deployment architecture, staging workflows, and continuous integration pipeline for the Web3 Creator Operating System (WCOS) platform.

## Architecture Highlights
* **Frontend**: Next.js 15 App Router deployed to Vercel (Edge-network CDN).
* **Backend API Gateway**: NestJS application containerized and deployed to Google Cloud Run.
* **Database**: Managed PostgreSQL (Google Cloud SQL) configured with connection pooling.
* **Cache & Queues**: Managed Redis (Google Cloud Memorystore) for rate limiting and queue scheduling.
* **Indexer**: Standalone event indexer service running in Google Cloud Run (worker context) or VM.
* **Storage**: Integrated with Google Cloud Storage (GCS) and Pinata (IPFS) for decentralized metadata.

## Environment Separation
We maintain distinct environments to isolate operations and protect mainnet state:
1. **LOCAL**: Personal developer workspaces connecting to Anvil/local Postgres.
2. **DEVELOPMENT**: Automatic deploys of `main` branch to preview URLs.
3. **TEST**: Sandbox environment for CI unit and integration testing.
4. **STAGING**: Identical to production setup but deployed to Base Sepolia testnet.
5. **PRODUCTION**: Live mainnet deployment requiring multi-signature approval.
