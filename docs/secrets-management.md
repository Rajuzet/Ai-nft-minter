# Web3 Creator OS (WCOS) — Secrets Management

Rules and protocols for storing, accessing, and rotating sensitive keys in production.

## Zero-Secrets-in-Repo Policy
No real credentials, API tokens, private keys, or passwords may be committed to the code repository:
1. `.env` files are added to the root `.gitignore` and sub-project `.gitignore` profiles.
2. Build-time secrets must be injected via CI/CD runners (GitHub Actions secrets).
3. Runtime secrets must be fetched dynamically or bound via Secret Manager.

## GCP Secret Manager Integration
We utilize **Google Secret Manager** to securely mount sensitive parameters onto our container runtimes:
* `DATABASE_URL` -> Bounded as a secret reference in Cloud Run.
* `JWT_SECRET` -> Bounded as a secret reference in Cloud Run.
* `OPENAI_API_KEY` -> Bounded as a secret reference.

## Access Policy (IAM)
* The deployer service account holds the role `roles/secretmanager.viewer` to authorize mounting keys.
* Developer IAM credentials do not permit reading production secret payloads.
