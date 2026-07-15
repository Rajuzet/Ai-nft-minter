# Web3 Creator OS (WCOS) — Vercel Deployment

Details on configuring Next.js frontend deployments, custom domains, and edge routing.

## Vercel Configurations
The Next.js application relies on the following configurations specified in `vercel.json`:
* **regions**: `["iad1"]` (US East, close to main RPC nodes and Google Cloud databases to reduce latency).
* **buildCommand**: `npm run build`
* **outputDirectory**: `.next`

## Dynamic Previews
Every pull request triggers a Vercel preview deployment. CORS on the NestJS backend matches `*.vercel.app` to ensure preview branches can interact securely with the dev/staging API.

## Custom Domain Routing
Add custom domains in the Vercel dashboard:
* **Apex domain**: `example.com` (redirects to `www.example.com`).
* **Sub-domain**: `app.example.com` (main entry point).
* **SSL Certificates**: Automatically issued and renewed by Let's Encrypt at edge nodes.
