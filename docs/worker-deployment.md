# Web3 Creator OS (WCOS) — Background Workers & Indexer Deployment

Details of running standalone indexers and scheduled worker scripts in production.

## Standalone Event Indexer
The event indexer runs in a separate process/container to avoid blocking backend API threads.
* **Build**: Utilizes the backend Dockerfile.
* **Entrypoint**: `npm run indexer` (boots `standalone-indexer.ts` which runs a loop polling blockchain events every 10 seconds).
* **Graceful Shutdown**: Listens to `SIGTERM` and `SIGINT` signals, flushes any pending transaction updates, and disconnects Prisma cleanly.

## News Sync Worker
The news sync worker is a scheduled script that runs daily.
* **Command**: `npm run news-sync` (boots `standalone-news-sync.ts`).
* **Deployment Option**: Deployed as a **Google Cloud Run Job** triggered by a **Cloud Scheduler** cron event (`0 2 * * *` daily at 2:00 AM).
* **Execution**: Syncs RSS feeds, writes to Database, and exits with code `0`.
