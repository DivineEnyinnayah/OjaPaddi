#!/usr/bin/env bash
# Deploy OjaPaddi backend to Cloudflare Workers
# Run: bash scripts/deploy.sh

set -e

echo "🚀 Deploying OjaPaddi API to Cloudflare Workers..."

# Deploy the Worker
cd "$(dirname "$0")/../apps/server"
npx wrangler deploy

echo ""
echo "✅ Deployed! Your API is live at:"
echo "   https://$(npx wrangler deployments list --json 2>/dev/null | head -1 | grep -o '"url":"[^"]*"' | cut -d'"' -f4)"
echo ""
echo "📋 Next steps:"
echo "   1. Update EXPO_PUBLIC_SERVER_URL in apps/native/.env to the URL above + /v1"
echo "   2. Run: pnpm dev:native"
