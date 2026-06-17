#!/usr/bin/env bash
set -euo pipefail

# Create directories
mkdir -p contracts/src contracts/script backend frontend/src/app

# Initialize Foundry for the contracts layer
cd contracts
forge init --force --no-git

# Initialize backend Node.js app
cd ../backend
npm init -y

# Initialize frontend Next.js app in app router mode with TypeScript and Tailwind support
cd ../frontend
npx create-next-app@latest . --ts --tailwind --eslint --app --use-npm --src-dir --import-alias "@/*"

# Restore working directory
cd ..

echo "Workspace scaffolded. Install backend and frontend dependencies next."
