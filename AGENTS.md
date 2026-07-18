# AGENTS.md — OjaPaddi

> Read this before any work. Flag conflicts with user and ask before proceeding.

---

## Tech stack (verified from source)

**Mobile:** React Native + Expo SDK 55, Expo Router v4 (file-based), Zustand, Tailwind v4 + uniwind (NativeWind v5 compat), AsyncStorage (not MMKV — Expo Go compat), SecureStore (tokens only), Expo Image Picker, Expo Vector Icons / Lucide.

**Backend:** HonoJS, Drizzle ORM + PostgreSQL (Supabase), Supabase Auth (via `@supabase/supabase-js`), Zod validation, `@t3-oss/env-core` for typed env vars.

**Monorepo:** Turborepo, Bun v1.3.10, TypeScript strict (~5.9.2 root / ^6 in packages).

**Packages:**
- `apps/native/` — Expo mobile app
- `apps/server/` — Hono backend (NOT `apps/api/`)
- `packages/db/` — Drizzle schema & migrations
- `packages/env/` — typed env vars (`@ojapaddi/env/server`, `@ojapaddi/env/native`)
- `packages/config/` — shared tsconfig.base.json

---

## Commands (all via `bun`)

| Command | What |
|---|---|
| `bun run dev` | Start all apps (turbo) |
| `bun run dev:server` | Hono server only, hot reload |
| `bun run dev:native` | Expo dev only |
| `bun run check-types` | Typecheck across all packages (turbo) |
| `bun run db:push` | Push Drizzle schema to DB |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run pending migrations |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run build` | Build all apps |

**Server dev server:** runs on `http://0.0.0.0:3001` (configurable via `PORT` env).
**Native dev server:** via Expo on `http://localhost:8081`.

**Server runs with:** `bun --env-file=.env run --hot src/server.ts`
**DB commands inherit env from:** `apps/server/.env`

---

## Architecture notes

- **Backend entry:** `apps/server/src/index.ts` — creates Hono app, mounts routes & middleware
- **Route mounting:** `/auth` (unauthenticated), all others (`/products`, `/sales`, etc.) behind `authMiddleware`
- **Auth:** Supabase Auth via service role key. `POST /auth/complete-registration` creates Supabase user + inserts users/businesses rows in a DB transaction. Login/refresh/logout delegate to `supabase.auth.*`.
- **Auth middleware** verifies Bearer token via `supabase.auth.getUser()` then looks up user's business_id. Sets `c.set("user")` and `c.set("businessId")`.
- **Rate limiting:** in-memory `Map<string, {count, resetAt}>` — resets on server restart. Auth endpoints: 10 req/min. All others: 30 req/min.
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

## DB & schema

- All tables in `packages/db/src/schema/` (9 files: users, businesses, products, customers, sales, sale_items, expenses, refresh_tokens).
- **Drizzle config** (`packages/db/drizzle.config.ts`) has hardcoded connection URL (DB credentials present in `.env` and drizzle config — handle with care).
- **Critical rules:** every query scoped by `business_id`; `sale_items` stores price snapshots (never join back to live product prices); product delete = soft delete (`is_active: false`); stock decrement in transaction.

---

## Current state

Project scaffolded by [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) (bts.jsonc confirms config). Substantial code exists for: auth (backend + mobile screens), products CRUD, sales recording, customer management, expenses, analytics dashboard, and WhatsApp sharing. Mock API layer covers all entities for offline dev. No CI/CD workflows yet (no `.github/`). No tests found in repo. No lint/format config found.

---

## Security notes

- `.env` files contain live Supabase credentials (service role key, DB URLs). Never commit.
- Drizzle config `packages/db/drizzle.config.ts` contains hardcoded DB connection string.
- `SUPABASE_SERVICE_ROLE_KEY` is used server-side; never expose client-side.
- Server uses variable `CORS_ORIGIN` from env (restricted origin).
- Rate limiter is in-memory (not Redis) — resets on restart.
- No stack traces in error responses expected by middleware convention.

---

## API conventions

- Base: `{BASE_URL}/v1` (BASE_URL configurable via `EXPO_PUBLIC_SERVER_URL`)
- Auth: `Authorization: Bearer <access_token>`
- Success: `{ success: true, data: {...} }`
- Error: `{ success: false, error: { code: string, message: string } }`
- Pagination: `?page=1&limit=20`
- Error codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `PLAN_LIMIT_REACHED`, `CONFLICT`, `TOO_MANY_REQUESTS`
