# OjaPaddi — Deployment Guide

## One-Time Setup (do this once)

### 1. Login to Cloudflare
```bash
cd apps/server
npx wrangler login
```

### 2. Set Secrets
```bash
cd apps/server
npx wrangler secret put SUPABASE_ANON_KEY
# Paste your anon key from Supabase Dashboard → Settings → API

npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Paste your service role key from Supabase Dashboard → Settings → API

npx wrangler secret put JWT_SECRET
# Paste your JWT secret from Supabase Dashboard → Auth → JWT Settings
```

### 3. Deploy
```bash
cd apps/server
npx wrangler deploy
```

Your API will be live at:
```
https://ojapaddi-server.<your-subdomain>.workers.dev
```

### 4. Update Native App
Edit `apps/native/.env`:
```bash
EXPO_PUBLIC_SERVER_URL=https://ojapaddi-server.<your-subdomain>.workers.dev/v1
EXPO_PUBLIC_DEV_MODE=false
```

### 5. Run Native App
```bash
bun run dev:native
```

## Redeploying (after code changes)
```bash
cd apps/server
npx wrangler deploy
```

## Rollback

Cloudflare Workers keeps the last 10 deployed versions — rollback is instant.

### Trigger conditions
- Error rate spikes (>2x baseline — check Cloudflare dashboard → Workers → analytics)
- P95 latency regression
- User-reported issues spike
- Data integrity issues detected

### Rollback steps
1. **Dashboard:** Workers → `ojapaddi-server` → Deployments → ⋯ → Rollback to previous version (instant, keeps current version as fallback). Or CLI:
   ```bash
   npx wrangler rollback
   ```
2. **Verify:** hit the health check (`GET /` should return `OjaPaddi API v1 Ready`) and check error rates return to baseline
3. **Communicate:** notify the team of the rollback

### Database considerations
- Schema changes are additive-only (Drizzle migrations). If a migration introduced data you need to remove, do it with a new migration — never edit rolled-back rows manually.
- Time to rollback: < 1 minute for Workers code; migration corrections require a new forward migration.

## Monitoring

- Workers observability is enabled (`observability.enabled: true` in wrangler.json) — request logs and traces in Cloudflare dashboard
- Health check: `GET /` → `OjaPaddi API v1 Ready`
- No Sentry/third-party error reporting yet — watch the Workers analytics dashboard after each deploy for the first hour

## Troubleshooting

### "CORS origin not allowed"
- The server reads `CORS_ORIGIN` from the env var (default `"*"` which allows all origins).
- To restrict, set `CORS_ORIGIN` (comma-separated allowlist, e.g. `https://app.example.com`) in `wrangler.json` → `vars`, then redeploy.

### "404 Not Found"
- Make sure `EXPO_PUBLIC_SERVER_URL` ends with `/v1`
- Check the deployed URL is correct

### "Invalid refresh token"
- The refresh token rotation is working correctly
- Old tokens are invalidated after use — this is by design
