# OjaPaddi — Deployment Guide

Stack: **Hono (Cloudflare Workers) + Drizzle + Turso/libSQL (SQLite) + Better Auth + Cloudflare R2.**

Supabase is gone: it was only ever used for Auth and file storage, and both have
been replaced (Better Auth and R2 respectively).

---

## One-Time Setup (do this once)

### 1. Create the SQLite database

Install the CLI **globally** (it is not a workspace dependency — never run this
inside `apps/` or `packages/`):

```bash
npm install -g @turso/cli
turso login
turso db create oja-paddi
turso db tokens create oja-paddi      # paste this as TURSO_AUTH_TOKEN
```

Put both values in **`apps/server/.env`** (and `apps/server/.dev.vars`). That
file is the source of truth for every command below.

> **Which database a command hits.** `turbo.json` runs in strict env mode, which
> normally strips shell variables — so tasks would silently fall back to
> `apps/server/.env`. `TURSO_DATABASE_URL` and friends are declared in
> `globalEnv` so shell overrides _do_ work and `pnpm db:migrate` and
> `pnpm migrate:data` always target the same database. Either way, the safest
> habit is to edit `apps/server/.env` and not pass shell overrides.

For local dev you can skip Turso entirely and use a file:

```
TURSO_DATABASE_URL=file:./local.db
# TURSO_AUTH_TOKEN not needed for file URLs
```

### 2. Run migrations

```bash
pnpm db:migrate
```

This creates all ten tables (`user`, `session`, `account`, `verification`,
`businesses`, `products`, `customers`, `sales`, `sale_items`, `expenses`).

### 3. Create the R2 bucket

```bash
cd apps/server
npx wrangler r2 bucket create oja-paddi-images
```

Then enable public access: either attach a custom domain, or enable the
`r2.dev` subdomain in the Cloudflare dashboard and set `R2_PUBLIC_URL` in
`wrangler.json` → `vars` to `https://pub-<id>.r2.dev`.

### 4. Login to Cloudflare and set secrets

```bash
cd apps/server
npx wrangler login
bash ../../scripts/setup-secrets.sh
```

Secrets: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`
(`openssl rand -base64 32`), `BETTER_AUTH_URL` (the Worker's public URL, **no
`/v1` suffix**).

### 5. Migrate data off Supabase

Do this **before** pointing the app at the new backend.

```bash
# Preview: reads Supabase, validates referential integrity, writes nothing
pnpm --filter @ojapaddi/server migrate:data -- --dry-run

# For real
pnpm --filter @ojapaddi/server migrate:data

# Copy product images from Supabase Storage into R2
pnpm --filter @ojapaddi/server migrate:images -- --dry-run
pnpm --filter @ojapaddi/server migrate:images
```

The data migration preserves primary keys, so foreign keys stay valid. Existing
image keys are unchanged — `image_url` stores the bare key and `resolveImageUrl`
prefixes it with `R2_PUBLIC_URL`.

> ⚠️ **Passwords cannot be migrated.** Supabase Auth keeps bcrypt hashes inside
> GoTrue's private schema, and the app's own `password_hash` column was never
> written to. The migration prints every affected email; each of those users must
> set a password once.

### 5a. Configure email delivery (required)

Migrated users have an account but no password, so they land on a **set-password**
screen that needs a verification code. The code is **only ever delivered by
email** — the API never returns it, because it is the sole proof that the
requester controls the inbox.

Delivery is HTTP (Resend), **not SMTP**: Workers has no outbound TCP, so an SMTP
transport cannot run there at all.

1. Sign up at <https://resend.com> and verify a sending domain.
2. Create an API key.
3. Set the two secrets:

```bash
cd apps/server
npx wrangler secret put EMAIL_API_KEY     # re_xxx
npx wrangler secret put EMAIL_FROM        # OjaPaddi <support@yourdomain.com>
```

Both are required — the server refuses to start without them, and a failed send
throws rather than silently dropping the code.

Add the same two to `apps/server/.env` for local dev.

> To use Postmark/Mailgun/SendGrid instead, change `sendEmail()` in
> `packages/auth/src/email.ts`. Nothing else in the reset flow touches the
> transport.

### 6. Deploy

```bash
cd apps/server
npx wrangler deploy
```

### 7. Update the native app

`apps/native/.env`:

```bash
EXPO_PUBLIC_SERVER_URL=https://ojapaddi-server.<subdomain>.workers.dev/v1
EXPO_PUBLIC_DEV_MODE=false
```

No mobile code changes are required — the REST contract is unchanged.

---

## Verifying a deploy

```bash
curl https://ojapaddi-server.<subdomain>.workers.dev/   # -> "OjaPaddi API v1 Ready"
```

Run the full end-to-end suite against a throwaway local database:

```bash
pnpm --filter @ojapaddi/server smoke
```

It exercises registration, login, auth guards, products, customers, sales,
returns, analytics, expenses, business, share, void, tenant isolation, refresh,
logout **and the migrated-user set-password flow** — 72 assertions against a
real SQLite file.

---

## Redeploying (after code changes)

```bash
cd apps/server
npx wrangler deploy
```

## Rollback

Cloudflare Workers keeps the last 10 deployed versions — rollback is instant.

### Trigger conditions

- Error rate spikes (>2x baseline — Cloudflare dashboard → Workers → analytics)
- P95 latency regression
- User-reported issues spike
- Data integrity issues detected

### Rollback steps

1. **Dashboard:** Workers → `ojapaddi-server` → Deployments → ⋯ → Rollback. Or:
    ```bash
    npx wrangler rollback
    ```
2. **Verify:** `GET /` returns `OjaPaddi API v1 Ready`; error rates recover.
3. **Communicate** the rollback.

### Database considerations

- Schema changes are additive-only. Never hand-edit rows to "undo" a migration —
  write a new forward migration.
- Rolling back the Worker does **not** roll back migrations. Keep migrations
  backwards-compatible for at least one release.

---

## Monitoring

- Workers observability is on (`observability.enabled: true`).
- Health check: `GET /` → `OjaPaddi API v1 Ready`
- No third-party error reporting yet.

---

## Troubleshooting

### "CORS origin not allowed"

`CORS_ORIGIN` is read from the env var (default `"*"`). To restrict, set a
comma-separated allowlist in `wrangler.json` → `vars` and redeploy.

### "404 Not Found"

`EXPO_PUBLIC_SERVER_URL` must end with `/v1`.

### "Invalid or expired token" (401)

The `Authorization: Bearer <token>` value is a Better Auth session token. It
expires after 30 days; the client should call `POST /v1/auth/refresh` with the
stored `refresh_token`. A user who used "forgot password" gets a new session on
reset.

### "Invalid environment variables" on boot

`TURSO_DATABASE_URL`, `BETTER_AUTH_SECRET` (min 32 chars), `BETTER_AUTH_URL` and
`R2_PUBLIC_URL` are all required. In Workers, `SKIP_ENV_VALIDATION` /
`CF_WORKERS` relax this — see `packages/env/src/server.ts`.

### `SQLITE_CONSTRAINT_UNIQUE` on a product

A duplicate `(business_id, sku)` pair. That partial unique index is intentional:
SKUs are unique per business, and rows with `NULL` sku are exempt.

### Better Auth schema drift

The `user` / `session` / `account` / `verification` tables are owned by Better
Auth. After changing the auth config, regenerate and diff:

```bash
npx @better-auth/cli generate --config <path-to-auth-config> --output ./schema-out
```
