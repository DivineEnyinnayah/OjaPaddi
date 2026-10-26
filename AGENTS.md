# AGENTS.md — OjaPaddi

> Read this before any work. Flag conflicts with user and ask before proceeding.

---

## Tech stack (verified from source)

**Mobile:** React Native + Expo SDK 55, Expo Router v4 (file-based), Zustand, Tailwind v4 + uniwind (NativeWind v5 compat), AsyncStorage (not MMKV — Expo Go compat), SecureStore (tokens only), Expo Image Picker, Expo Vector Icons / Lucide.

**Backend:** HonoJS, Drizzle ORM + **SQLite (Turso/libSQL)**, **Better Auth**, Zod validation, `@t3-oss/env-core` for typed env vars. Image storage on **Cloudflare R2**.

> Supabase was removed on the SQLite/Better Auth migration. It had only ever been used for Auth and file storage. See `DEPLOY.md`.

**Monorepo:** Turborepo, Bun v1.3.10, TypeScript strict (~5.9.2 root / ^6 in packages).

**Packages:**
- `apps/native/` — Expo mobile app
- `apps/server/` — Hono backend (NOT `apps/api/`)
- `packages/auth/` — Better Auth instance (`@ojapaddi/auth`)
- `packages/db/` — Drizzle SQLite schema & migrations
- `packages/env/` — typed env vars (`@ojapaddi/env/server`, `@ojapaddi/env/native`)
- `packages/config/` — shared tsconfig.base.json

---

## Commands (all via `pnpm`)

| Command | What |
|---|---|
| `pnpm dev` | Start all apps (turbo) |
| `pnpm dev:server` | Hono server only, hot reload |
| `pnpm dev:native` | Expo dev only |
| `pnpm check-types` | Typecheck across all packages (turbo) |
| `pnpm db:push` | Push Drizzle schema to DB |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm build` | Build all apps |
| `pnpm smoke` | End-to-end suite against a throwaway local SQLite file (58 assertions) |
| `pnpm migrate:data -- --dry-run` | Preview the Supabase → SQLite data migration |
| `pnpm migrate:images -- --dry-run` | Preview the Supabase Storage → R2 image copy |

**Server dev server:** runs on `http://0.0.0.0:3001` (configurable via `PORT` env).
**Native dev server:** via Expo on `http://localhost:8081`.

**Server runs with:** `tsx watch --env-file=.env src/server.ts`
**DB commands inherit env from:** `apps/server/.env`

---

## Architecture notes

- **Backend entry:** `apps/server/src/index.ts` — creates Hono app, mounts routes & middleware
- **Route mounting:** `/auth` (unauthenticated), all others (`/products`, `/sales`, etc.) behind `authMiddleware`
- **Auth:** Better Auth (`packages/auth/src/index.ts`) with a SQLite Drizzle adapter and the `bearer()` plugin, so the mobile client keeps sending `Authorization: Bearer <token>`.
- **Single session token:** Better Auth issues one long-lived session token, not an access/refresh pair. The REST contract returns that same value as both `access_token` and `refresh_token` so `apps/native` needs no changes.
- **Auth middleware** resolves the session via `auth.api.getSession()`, then loads the caller's business. Sets `c.set("user")` and `c.set("businessId")`. It picks the **oldest non-deleted** business for the user.
- **Cutover flow (`PASSWORD_RESET_REQUIRED`):** users migrated from Supabase have a `user` row but no `account` credential row. `loginUser` detects that and throws `PasswordResetRequiredError`, which `/auth/login` maps to HTTP 401 + `code: "PASSWORD_RESET_REQUIRED"`. The app routes those users to `/set-password`.
- **Reset-code delivery is email-only**, sent over **HTTPS** to Resend (`packages/auth/src/email.ts`). `EMAIL_API_KEY` and `EMAIL_FROM` are **required** env vars; the server refuses to start without them, and a failed send throws instead of silently dropping the code. The code is never returned by any endpoint — it is the sole proof that the requester controls the inbox. Do not add a dev mode that returns it; that makes reset unauthenticated.
- ⚠️ **Email must use HTTP, never SMTP.** Workers has no outbound raw TCP and blocks port 25, so Nodemailer cannot run there. To change provider (Postmark/Mailgun/SendGrid), edit `sendEmail()` only — the rest of the flow is transport-agnostic.
- **Rate limiting:** in-memory `Map<string, {count, resetAt}>` — resets on server restart. Auth endpoints: 10 req/min. All others: 30 req/min. Skipped when `NODE_ENV=test` so the smoke suite isn't throttled.
- **Validation middleware** (`apps/server/src/middleware/validate.ts`) parses request body with Zod schema, sets `c.set("validatedBody")`.
- **Server bundling:** tsdown (`apps/server/tsdown.config.ts`) — bundles into ESM, inlines `@ojapaddi/*` workspace packages.
- **Env types:** `packages/env/src/server.ts` and `packages/env/src/native.ts` use `@t3-oss/env-core` with Zod schemas. Never use `process.env.X` inline.
- **Native mobile** uses `expo-router` file-based routing: `(auth)/` (welcome, login, register, onboarding), `(tabs)/` (home, products, sales, customers, more), standalone screens (analytics, receipt, upgrade).
- **New Architecture** is **disabled** (`"newArchEnabled": false` in app.json).
- **Dev mode bypass:** Setting `EXPO_PUBLIC_DEV_MODE=true` in native `.env` routes all API calls through `lib/mockApi.ts` (in-memory store with realistic latency). The root `_layout.tsx` also bypasses auth — injects a mock user/token directly in `useAuthStore.initialize()`. This means the app is fully functional in dev without any backend running.
- **WhatsApp:** Native deep links only (`whatsapp://send?text=...` with `https://wa.me/` fallback). Message templates in `apps/native/lib/whatsapp.ts`.
- **UI strings** live in `apps/native/constants/copy.ts`. Never hardcode in components.
- **Color tokens** in `apps/native/constants/colors.ts` (light + dark theme). Themes via `contexts/app-theme-context.tsx`.

---

## DB & schema (SQLite)

- All tables in `packages/db/src/schema/` (7 files).
  - `auth.ts` — Better Auth core: `user`, `session`, `account`, `verification`. **These are generated**; re-run `npx @better-auth/cli generate` after changing the auth config and diff.
  - `businesses.ts`, `products.ts`, `customers.ts`, `sales.ts`, `sale_items.ts`, `expenses.ts`
- There is **no `users` table any more** — Better Auth's `user` table *is* the app profile (`fullName`, `plan` live there). There is also **no `refresh_tokens` table**; `session` replaced it.
- **Drizzle config** (`packages/db/drizzle.config.ts`) reads `TURSO_DATABASE_URL` and fails fast if absent — never hardcode credentials.
- **Driver:** `drizzle-orm/libsql`. No connection pool — libSQL is HTTP/WebSocket, so the client is shared and stateless.
- **SQLite-specific rules** (the old Postgres SQL does not run here):
  - **Money is `TEXT`, never `REAL`.** SQLite has no decimal type and REAL loses precision. Always write via `money()` / `moneyFloor0()` from `apps/server/src/lib/money.ts` — never `Number(...).toString()`.
  - Do **money arithmetic in JS, not SQL.** `totalSpent + 5` on a TEXT column silently coerces to float and stores `15.5` instead of `"15.50"`. `GREATEST()` does not exist — use `MAX(a, b)` (2-arg scalar).
  - `CAST(x AS numeric)` is **invalid**; use `CAST(x AS REAL)`.
  - No `ILIKE` — plain `LIKE` is already case-insensitive for ASCII.
  - No `to_char()`. Date bucketing is `strftime('%Y-%m-%d', col / 1000, 'unixepoch')` (see `soldDate` in `analyticsService.ts`).
  - Timestamps are `integer({ mode: "timestamp_ms" })`; drizzle expects **`Date` objects**, not epoch numbers.
  - Aggregates referenced in `ORDER BY` need an explicit `.as("alias")` or SQLite cannot resolve them.
- **Critical rules:** every query scoped by `business_id`; `sale_items` stores price snapshots (never join back to live product prices); product delete = soft delete (`is_active: false`); stock decrement in transaction.
- **FK behaviour:** SQLite has no cascades in the engine, but the generated migration declares `ON DELETE CASCADE` / `SET NULL`. Drizzle enables `PRAGMA foreign_keys` per connection.

## Images (Cloudflare R2)

- `products.image_url` and `businesses.logo_url` store the **bare object key** (e.g. `products/<businessId>/<file>.jpg`), never a full URL.
- `resolveImageUrl()` prefixes it with `R2_PUBLIC_URL` on read; values already starting with `http` are passed through untouched (legacy Supabase data).
- Uploads go through `uploadImage(c.env.IMAGES, key, buffer, contentType)` (binding name `IMAGES`, bucket `ojapaddi-images`).
- Because R2 reuses the same key namespace, migrating images from Supabase Storage does **not** require rewriting any rows.

---

## Current state

Project scaffolded by [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) (bts.jsonc confirms config). Code exists for: auth (Better Auth backend + mobile screens), products CRUD, sales recording, customer management, expenses, analytics dashboard, and WhatsApp sharing. Mock API layer covers all entities for offline dev. CI exists (`.github/workflows/ci.yml`): typecheck → server build → deploy to Cloudflare Workers on `main` push.

**Testing:** `pnpm smoke` (`apps/server/src/scripts/smoke.ts`) is a real end-to-end suite — it boots the Hono app against a temporary SQLite file and drives the actual HTTP contract, including the migrated-user set-password flow. **It runs in CI** (`.github/workflows/ci.yml`, job `smoke`). No lint config and no third-party error reporting (Workers observability only).

**Known gaps:**
- `apps/native` has **no `check-types` script**, so CI does not typecheck it. Run `pnpm exec tsc --noEmit` in `apps/native` manually. Expo's generated route types live in the gitignored `apps/native/.expo/types/router.d.ts` — after adding a route, regenerate with `npx expo start` (it fails typecheck until you do).
- **`turbo.json` runs in strict env mode**, so shell variables are stripped before a task executes and it falls back to `apps/server/.env`. `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `EMAIL_API_KEY`, `EMAIL_FROM` and `R2_PUBLIC_URL` are declared in `globalEnv` so overrides work — without that, `pnpm db:migrate` (turbo) and `pnpm migrate:data` (`pnpm --filter`) would target **different databases**, putting the schema in one and the data in another. Add any new infra env var to `globalEnv`.
- Never add an unknown key to `turbo.json` — turbo rejects the whole file with `turbo_json_parse_error`, which looks like a silent no-op.
- `migrate-from-supabase.ts` and `migrate-images.ts` still read Supabase credentials; they can be deleted once cutover is complete.
- `EMAIL_API_KEY` / `EMAIL_FROM` must be set before any migrated user can activate. Without them the server will not boot.
- R2 bucket + Turso database must be created manually (`DEPLOY.md`).

---

## Security notes

- `.env` / `.dev.vars` files contain live Turso credentials and, until cutover finishes, Supabase credentials. Never commit.
- Agent session logs (`session-*.md`) can contain secrets — they are gitignored; never force-add them.
- `TURSO_AUTH_TOKEN` and `BETTER_AUTH_SECRET` are server-side only; never expose client-side. The native app needs **only** `EXPO_PUBLIC_SERVER_URL`.
- Better Auth owns credential hashing (bcrypt into `account.password`). There is no password column to leak from the app's own tables.
- Server reads `CORS_ORIGIN` from env (comma-separated allowlist or `*`; defined as a var in `wrangler.json`).
- Global error handler returns `INTERNAL_ERROR` without stack traces (Hono `app.onError`).
- Rate limiter is in-memory (not Redis) — resets on restart.
- Every data route is tenant-scoped via `businessId` from the session; cross-tenant reads return 404 (asserted in `pnpm smoke`).
- Rate limits are effectively per-token, not per-IP, because the key is the `Authorization` header when present.

---

## API conventions

- Base: `{BASE_URL}/v1` (BASE_URL configurable via `EXPO_PUBLIC_SERVER_URL`)
- Auth: `Authorization: Bearer <access_token>`
- Success: `{ success: true, data: {...} }`
- Error: `{ success: false, error: { code: string, message: string } }`
- Pagination: `?page=1&limit=20`
- Error codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `PLAN_LIMIT_REACHED`, `CONFLICT`, `TOO_MANY_REQUESTS`

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
