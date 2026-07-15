# WCOS Database Documentation & Operations Manual

This document provides a comprehensive guide to the Web3 Creator Operating System (WCOS) database tier, including schema design, migrations, seeding, backup/restore operations, and production deployment guidelines.

---

## 1. Database Architecture & Technology Stack
- **ORM**: Prisma (v5.18.0)
- **Database Engine**: PostgreSQL (v15+)
- **Connection Model**: Connection pooling utilizing direct and pooled database URLs (e.g. Neon, Supabase, AWS RDS).

---

## 2. Environment Variables Configuration
Configure the following database-related variables in your environment or production host:

```env
# Primary Connection Pool URL (Used by application query engine)
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/wcos?schema=public&pgbouncer=true"

# Direct URL for migrations (Bypasses connection pooling/PgBouncer)
DIRECT_URL="postgresql://postgres:postgrespassword@localhost:5432/wcos?schema=public"

# Shadow Database URL (Used by Prisma migrate dev for diffing)
SHADOW_DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/wcos_shadow?schema=public"

# Performance & Logging settings
DATABASE_SLOW_QUERY_MS=500
```

---

## 3. Database Schema Overview
The database acts as a localized transaction index, creator profile store, and tracking layer for on-chain events:

```mermaid
erDiagram
    User ||--o| Profile : "has profile"
    User ||--o{ DeployedContract : "owns contracts"
    User ||--o{ NftCollection : "creates collections"
    User ||--o{ Nft : "owns nfts"
    User ||--o{ MarketplaceListing : "sellers/buyers listings"
    User ||--o{ DaoProposal : "proposes"
    User ||--o{ DaoVote : "votes"
    User ||--o{ TransactionRecord : "initiates txs"
    User ||--o{ AuditLog : "triggers logs"
    User ||--o{ Wallet : "links wallets"
    User ||--o{ Session : "authenticates sessions"
    User ||--o{ Notification : "receives notifications"
    
    NftCollection ||--o{ Nft : "groups nfts"
    MarketplaceListing ||--o{ NftSale : "produces sales"
```

### Core Schema Models:
1. **User / Wallet**: Stores Web3 identities. Wallets track verified statuses, last active times, and primary markers.
2. **Nfts & Collections**: Tracks minted assets, metadata URIs, IPFS hashes, and collection configurations.
3. **Marketplace Listings / Sales**: Manages current order book listings and sale records for volume/revenue analysis.
4. **DAO & Governance**: Stores on-chain governance proposals, user voting records, and delegation trees.
5. **Blockchain Transactions / Events**: Unified log tracking of transaction receipts and confirmed event logs.
6. **Authentication & Security**: Stores temporary nonces for SIWE logins, active sessions, audit trails, and idempotency records.

---

## 4. Idempotency & Concurrency Rules
To prevent double-spend or duplicate listing execution:
- All indexer synchronization steps use composite unique constraints (e.g. `[chainId, transactionHash, logIndex]` for events).
- Operations (e.g. NFT mint registrations, DAO votes) write to `IdempotencyRecord` with a unique UUID key before execution.

---

## 5. Production Migration Workflow
Never run `prisma db push` in production. Always use versioned migrations:

1. **Local Development Change**:
   Modify `schema.prisma`, then run:
   ```bash
   npx prisma migrate dev --name <migration_description>
   ```
2. **Production Deployment**:
   Apply migrations using the non-pooled `DIRECT_URL`:
   ```bash
   npx prisma migrate deploy
   ```

---

## 6. Migration Rollback Procedure
If a production migration fails or needs to be reverted:
1. Identify the failed migration using:
   ```bash
   npx prisma migrate status
   ```
2. Revert the database schema manually by executing the corresponding reverse SQL statements.
3. Mark the migration as resolved/rolled-back:
   ```bash
   npx prisma migrate resolve --rolled-back <failed_migration_name>
   ```
4. Restore from the pre-migration backup if data corruption has occurred.

---

## 7. Seeding Strategy
Run seeding via:
```bash
npx prisma db seed
```
- **Production Mode**: Only seeds static platform configs (chains, verified tokens, canonical DAO).
- **Development Mode**: Seeds mock users, profiles, and dummy proposals for frontend testing.

---

## 8. Backup & Restore Procedures

### Automated Backup Strategy:
- Retain daily automated backups for 30 days.
- Execute a backup job before applying any production migration.

### Manual Backup Command:
```bash
pg_dump -h localhost -U postgres -d wcos -F c -b -v -f wcos_backup_YYYYMMDD.dump
```

### Manual Restore Command:
```bash
pg_restore -h localhost -U postgres -d wcos -v wcos_backup_YYYYMMDD.dump
```
