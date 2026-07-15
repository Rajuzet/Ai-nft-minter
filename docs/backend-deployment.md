# Web3 Creator OS (WCOS) — Backend Deployment

Details of NestJS backend containerization, process parameters, and resource sizing.

## Docker Containerization
The backend uses a multi-stage Docker build that:
1. Installs development dependencies in the `builder` stage.
2. Compiles NestJS typescript code.
3. Generates the Prisma Client.
4. Copies only compiled JS and production dependencies into a clean `runner` stage.
5. Runs under a non-root alpine `node` user for security.

## Configuration Parameters
* **Listen Port**: `4000` (Exposed), listening on interface `0.0.0.0`.
* **Health Check**: `GET /health` or `GET /api/v1/health` (checks Postgres status, Redis connection, and RPC responsiveness).
* **Startup Probe**: Configured with a 15-second initial delay to allow Prisma `$connect` and database checks to finish before routing traffic.
