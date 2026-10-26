#!/usr/bin/env bash
# Set up Cloudflare Worker secrets for OjaPaddi
# Run this once: bash scripts/setup-secrets.sh

set -e

echo "🔐 Setting up Cloudflare Worker secrets..."
echo ""
echo "You'll be prompted to paste each value."
echo "Get TURSO_* from https://turso.tech (or leave the local file: URL in place"
echo "for local development)."
echo ""

cd "$(dirname "$0")/../apps/server"

echo "1/6 — Turso database URL (libsql://... from Turso dashboard)"
npx wrangler secret put TURSO_DATABASE_URL

echo ""
echo "2/6 — Turso auth token (the API token that issued the URL)"
npx wrangler secret put TURSO_AUTH_TOKEN

echo ""
echo "3/6 — Better Auth secret (generate with: openssl rand -base64 32)"
npx wrangler secret put BETTER_AUTH_SECRET

echo ""
echo "4/6 — Better Auth base URL (this Worker's public URL, no /v1 suffix)"
npx wrangler secret put BETTER_AUTH_URL

echo ""
echo "5/6 — Email API key (Resend: https://resend.com)"
npx wrangler secret put EMAIL_API_KEY

echo ""
echo "6/6 — Email from address (e.g. OjaPaddi <noreply@yourdomain.com>)"
npx wrangler secret put EMAIL_FROM

echo ""
echo "✅ All secrets set! Now deploy:"
echo "   bash scripts/deploy.sh"
echo ""
echo "ℹ️  R2_PUBLIC_URL is a plain (non-secret) var — set it in wrangler.json."