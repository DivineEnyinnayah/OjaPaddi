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

## Troubleshooting

### "CORS origin not allowed"
- The server has `CORS_ORIGIN: "*"` which allows all origins
- If you restricted it, make sure your app's origin matches

### "404 Not Found"
- Make sure `EXPO_PUBLIC_SERVER_URL` ends with `/v1`
- Check the deployed URL is correct

### "Invalid refresh token"
- The refresh token rotation is working correctly
- Old tokens are invalidated after use — this is by design
