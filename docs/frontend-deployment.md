# Web3 Creator OS (WCOS) — Frontend Deployment

Details of Next.js frontend build configurations, static generation optimization, and deployment procedures.

## Deployment Options

### 1. Vercel (Preferred)
Next.js projects are built natively on Vercel:
* **Build Command**: `npm run build`
* **Output Directory**: `.next`
* **Install Command**: `npm install --legacy-peer-deps`
* **Framework Preset**: `Next.js`

### 2. Docker / Managed Kubernetes / Cloud Run
When running Next.js as a Docker container, we leverage the **Next.js Standalone mode** configured in `next.config.mjs` (using `output: "standalone"`). This generates a minimal `server.js` file and only bundles required node_modules, resulting in a tiny deployment footprint (~120MB image size).

* **Command**: `docker build -f Dockerfile.frontend -t wcos-frontend:latest .`
* **Port**: `3000`
* **Non-Root runtime**: Runs as user `node`.
