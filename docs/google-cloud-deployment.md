# Web3 Creator OS (WCOS) — Google Cloud Platform Deployment

Step-by-step setup guides for deploying backend services, indexers, and databases to GCP.

## Core Services Configuration

### 1. Cloud Run (Backend API)
Deploy the backend image to Google Cloud Run:
* **Memory Limit**: `2GiB`
* **CPU Limit**: `2 vCPU`
* **Scaling Limit**: Min: `1` (avoids cold starts), Max: `10` instances.
* **Concurrency**: `80` requests per container.
* **Environment variables**: `NODE_ENV=production`, `PORT=4000`.

### 2. Cloud SQL (PostgreSQL)
Provision a Postgres 15 database instance:
* **Sizing**: `2 vCPUs`, `7.5 GB RAM` (standard instance).
* **Network**: Configured with private VPC access for secure connections from Cloud Run.
* **Auto-backup**: Enabled daily with point-in-time recovery.

### 3. Cloud Memorystore (Redis)
Provision a standard Tier Redis instance:
* **Access**: Private VPC peering.
* **Use Cases**: API gateway rate-limiting (NestJS Throttler) and indexer queues.
