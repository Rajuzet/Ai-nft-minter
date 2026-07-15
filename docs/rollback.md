# Web3 Creator OS (WCOS) — Rollback & Recovery Procedures

Step-by-step guides for reverting code, migrations, and static deployments in production.

## 1. Backend Rollback (Cloud Run)
If a backend release introduces critical regressions or fails smoke tests:
1. Locate the previous stable image in Artifact Registry or the previous Cloud Run revision.
2. Route 100% of traffic back to the previous stable revision:
   ```bash
   gcloud run services update wcos-backend --rollback-to-revision=PREVIOUS_REVISION_NAME --region=us-central1
   ```
3. Verify that CPU usage and error rates stabilize.

## 2. Frontend Rollback (Vercel)
To roll back a Next.js release:
1. Open the Vercel dashboard and locate the deployments tab.
2. Find the previous stable deployment card.
3. Click the options menu and select **Promote to Production**.
4. Vercel instantly updates CDN pointers to serve the selected static build.

## 3. Database Rollback (Prisma)
> [!CAUTION]
> Do NOT run `npx prisma migrate reset` in production! It deletes all user records and database tables.

If a schema migration fails or causes application incompatibility:
1. Roll back the application code to the previous compatible version.
2. Write a "forward fix" migration that modifies the database schema to fix the issue without losing data.
3. Apply the forward-fix migration using `npx prisma migrate deploy`.
