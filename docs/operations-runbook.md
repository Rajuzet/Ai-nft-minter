# Web3 Creator OS (WCOS) — Operations Runbook

Common administrative runbooks and maintenance routines for platform operators.

## 1. Restarting Services
* **Backend API (GCP Cloud Run)**:
  Force a container restart by creating a new revision or redeploying the existing tag:
  ```bash
  gcloud run services update wcos-backend --region=us-central1
  ```
* **Event Indexer**:
  If the indexer process freezes:
  ```bash
  gcloud run services update wcos-indexer --region=us-central1
  ```

## 2. Resolving Indexer Delays
If the Event Indexer is lagging behind the chain:
1. Validate RPC node rate limits.
2. Check logs for contract address match issues or unhandled exceptions.
3. If necessary, adjust `INDEXER_START_BLOCK` to rescan recent blocks or force sync:
   ```bash
   npx ts-node src/indexer/standalone-indexer.ts
   ```

## 3. Secret Rotation Protocol
To rotate `JWT_SECRET` or DB passwords without downtime:
1. Add the new credentials as a new version in Secret Manager.
2. Update the environment bindings of the Cloud Run containers to reference the new secret version.
3. Trigger a blue-green redeployment (Cloud Run revision shift) so old containers drain traffic while new containers boot using the rotated key.
