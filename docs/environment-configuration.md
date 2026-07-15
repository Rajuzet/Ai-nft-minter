# Web3 Creator OS (WCOS) — Environment Variables Reference

A detailed guide explaining environment configuration options, scopes, and target formats.

## Backend Environment Variables

| Variable Name | Required | Target Format | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://...` | Main DB connection URL |
| `DIRECT_URL` | Yes | `postgresql://...` | Direct connection (non-pooled) for migrations |
| `JWT_SECRET` | Yes | High-entropy string | Used to sign SIWE user session tokens |
| `PORT` | No | Numeric port | Port for NestJS gateway server (default `3001`) |
| `FRONTEND_URL` | Yes | Fully-qualified URL | Allowed origin for CORS whitelisting |
| `RPC_URL` | Yes | HTTPS RPC URL | Blockchain node RPC provider |
| `CHAIN_ID` | Yes | Chain ID number | Web3 Chain ID (e.g. `84532` for Sepolia) |
| `NFT_CONTRACT_ADDRESS`| Yes | Ethereum Address | Address of the AI NFT contract |

## Frontend Environment Variables

| Variable Name | Required | Target Format | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Fully-qualified URL | Target backend endpoint URL |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | HEX String | WalletConnect/Reown platform Project ID |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | Chain ID number | Chain ID for smart contract execution |
