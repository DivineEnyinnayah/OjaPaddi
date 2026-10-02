#!/usr/bin/env bash
# Full setup: secrets + deploy
# Run once: bash scripts/setup.sh

set -e

echo "🚀 OjaPaddi — Full Cloudflare Workers Setup"
echo "============================================"
echo ""

# Check if wrangler is logged in
echo "1. Checking Cloudflare authentication..."
npx wrangler whoami 2>/dev/null || {
  echo "❌ Not logged in. Run: npx wrangler login"
  exit 1
}

echo ""
echo "2. Setting up secrets..."
bash "$(dirname "$0")/setup-secrets.sh"

echo ""
echo "3. Deploying..."
bash "$(dirname "$0")/deploy.sh"

echo ""
echo "============================================"
echo "✅ Setup complete!"
echo ""
echo "📋 Next: Update apps/native/.env"
echo "   EXPO_PUBLIC_SERVER_URL=https://ojapaddi-server.<your-subdomain>.workers.dev/v1"
echo ""
echo "   Then run: pnpm dev:native"
