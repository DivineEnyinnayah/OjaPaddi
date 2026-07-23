#!/usr/bin/env bash
# Set up Cloudflare Worker secrets for OjaPaddi
# Run this once: bash scripts/setup-secrets.sh

set -e

echo "🔐 Setting up Cloudflare Worker secrets..."
echo ""
echo "You'll be prompted to paste each value."
echo "Get these from your Supabase Dashboard → Settings → API"
echo ""

cd "$(dirname "$0")/../apps/server"

echo "1/3 — Supabase Anon Key (public, from Supabase dashboard)"
npx wrangler secret put SUPABASE_ANON_KEY

echo ""
echo "2/3 — Supabase Service Role Key (secret, from Supabase dashboard)"
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

echo ""
echo "3/3 — JWT Secret (from Supabase dashboard → Auth → JWT Settings)"
npx wrangler secret put JWT_SECRET

echo ""
echo "✅ All secrets set! Now deploy:"
echo "   bash scripts/deploy.sh"
