# Web3 Creator OS (WCOS) — Deployment Architecture

This document details the network, traffic flow, and connection endpoints between all core services.

## Architecture Diagram

```mermaid
flowchart TD
    User([Users & Wallets])
    CDN[Edge CDN / Vercel Edge]
    FE[Next.js Frontend / Vercel]
    RunAPI[NestJS API / Cloud Run]
    RunWorker[Event Indexer / Cloud Run Worker]
    DB[(Cloud SQL Postgres)]
    Redis[(Memorystore Redis)]
    RPC[Base / Sepolia RPC Node]
    IPFS[IPFS / Pinata Gateway]

    User -->|HTTPS| CDN
    CDN --> FE
    FE -->|API Requests| RunAPI
    User -->|Interact & Sign| RPC
    RunAPI -->|Queries & Updates| DB
    RunAPI -->|Caching & Queues| Redis
    RunAPI -->|IPFS uploads| IPFS
    RunAPI -->|Query Balance/State| RPC
    RunWorker -->|Process Blocks| RPC
    RunWorker -->|Persist Sync State| DB
```

## System Interfaces & Ports
* **Frontend Web Application**: Port 3000 (Local Dev) / Port 443 (Production HTTPS).
* **Backend API Gateway**: Port 3001 (Local Dev) / Port 4000 (Container) / Port 443 (GCP HTTPS).
* **PostgreSQL Database**: Port 5432.
* **Redis Cache**: Port 6379.
