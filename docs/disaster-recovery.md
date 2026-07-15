# Web3 Creator OS (WCOS) — Disaster Recovery Manual

Protocols to restore services and data integrity during catastrophic failures.

## 1. Database Loss or Corruption
* **Recovery Point Objective (RPO)**: 24 hours.
* **Recovery Time Objective (RTO)**: 1 hour.
* **Restore Steps**:
  1. Open GCP console, navigate to **Cloud SQL Instances** -> `wcos-postgres`.
  2. Select **Backups** from the sidebar.
  3. Find the latest healthy daily backup or choose a specific Point-in-Time recovery timestamp.
  4. Click **Restore**, select the target database, and confirm.
  5. The instance goes offline while restoring and comes back online once ready.

## 2. Redis Outage
* **Impact**: Rate limiting degrades, queues stall. No data is lost as Redis acts as an ephemeral cache.
* **Restore Steps**:
  1. If local container crashed: run `docker compose -f docker-compose.production.yml restart redis`.
  2. If Cloud Memorystore fails: Provision a replacement Redis instance, copy the connection URI, and update `REDIS_URL` in Secret Manager.
  3. Restart backend API containers to establish connections.

## 3. Blockchain RPC Provider Outage
* **Impact**: Indexer halts, balance and NFT metadata checks fail.
* **Restore Steps**:
  1. Set up fallback RPC URLs in backend `.env` (e.g. Infura, Alchemy, LlamaNodes).
  2. The application service automatically falls back to secondary endpoints if the primary endpoint returns timeout or 503 error codes.
