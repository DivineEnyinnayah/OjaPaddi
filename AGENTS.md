# AGENTS.md — OjaPaddi Project Intelligence

> This file is the single source of truth for every AI agent working on the OjaPaddi codebase.
> Read this file completely before taking any action. Reference it continuously during your work.
> If anything in this file conflicts with a user instruction, flag the conflict and ask before proceeding.

---

## 1. WHAT IS OJAPADDI?

**OjaPaddi** (meaning "Market Friend") is a mobile-first business management app for Nigerian retail SME sellers. It helps market sellers manage products, record sales, track inventory, generate receipts, share products via WhatsApp, and view analytics — all from their phone.

- **Stage:** MVP (active development)
- **Target Market:** Nigerian general retail sellers (physical + informal market)
- **Primary Competitor:** Bumpa (getbumpa.com)
- **Key Differentiator:** Generous permanent free tier + WhatsApp-native commerce

---

## 2. TEAM & ROLES

| Role | Assigned To |
|---|---|
| Product Owner | [Your Name] — must approve all severe/personality changes |
| Lead Engineer | AI Agent (currently active) |
| UI/UX Reference | Google Stitch (fetch via Stitch MCP before all UI work) |

---

## 3. TECH STACK

### Mobile
| Concern | Tool |
|---|---|
| Framework | React Native + **Expo SDK 54** |
| Router | Expo Router v4 (file-based) |
| State | Zustand |
| Server state | TanStack Query (React Query) |
| Local storage | AsyncStorage (**not MMKV** — Expo Go compatibility) |
| Secure storage | Expo SecureStore (tokens only) |
| Images | Expo Image Picker + Expo Image |
| Notifications | Expo Notifications |
| Icons | Expo Vector Icons / Lucide React Native |
| Language | TypeScript (strict mode) |

### Backend
| Concern | Tool |
|---|---|
| Framework | **HonoJS** |
| Runtime | Cloudflare Workers |
| ORM | Drizzle ORM |
| Database | Neon PostgreSQL (serverless) |
| Auth | Custom JWT — `jose` (access: 15min, refresh: 30 days) |
| Password hashing | bcryptjs (salt rounds: 12) |
| Validation | Zod |
| File storage | Cloudflare R2 (private, signed URLs) |
| Email | Resend |
| Language | TypeScript (strict mode) |

### Web (Phase 2)
| Concern | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Hosting | Vercel |
| Purpose | Public per-product share pages |

### Infrastructure
| Concern | Tool |
|---|---|
| Monorepo | Turborepo |
| CI/CD | GitHub Actions + EAS Build |
| Monitoring | Sentry (errors) + Posthog (analytics) |
| Secrets | Cloudflare Workers Secrets + EAS Secrets |

---

## 4. PROJECT STRUCTURE

```
ojapaddi/
├── apps/
│   ├── native/                  # Expo React Native app
│   │   ├── app/
│   │   │   ├── (auth)/          # welcome, login, register, onboarding
│   │   │   ├── (tabs)/          # home, products/, sales/, customers/, more
│   │   │   └── analytics.tsx
│   │   ├── components/
│   │   │   ├── ui/              # Base design system (Button, Input, Card, etc.)
│   │   │   ├── products/
│   │   │   ├── sales/
│   │   │   └── shared/
│   │   ├── hooks/               # useAuth, useProducts, useSales, useAnalytics
│   │   ├── stores/              # authStore.ts, cartStore.ts (Zustand)
│   │   ├── lib/                 # api.ts, queryClient.ts, whatsapp.ts
│   │   ├── constants/           # colors.ts, typography.ts, copy.ts
│   │   └── types/
│   ├── api/                     # HonoJS backend
│   │   └── src/
│   │       ├── routes/          # auth, business, products, sales, customers, expenses, analytics, share
│   │       ├── middleware/      # auth.ts, rateLimit.ts, errorHandler.ts
│   │       ├── db/              # schema.ts, index.ts, migrations/
│   │       ├── services/        # authService, analyticsService, storageService, emailService, pdfService
│   │       ├── validators/      # Zod schemas
│   │       └── utils/           # jwt.ts, hash.ts, generateRef.ts, formatCurrency.ts
│   └── web/                     # Next.js public share pages (Phase 2)
└── packages/
    └── types/                   # Shared TypeScript types (mobile + api)
```

---

## 5. DATABASE SCHEMA REFERENCE

All tables live in Neon PostgreSQL, managed by Drizzle ORM.

| Table | Purpose |
|---|---|
| `users` | Auth + plan info |
| `businesses` | One business per user (MVP) |
| `products` | Product catalog, inventory |
| `customers` | Basic CRM |
| `sales` | Sale records |
| `sale_items` | Line items per sale (snapshot of price at time of sale) |
| `expenses` | Business expenses |
| `refresh_tokens` | JWT refresh token store |

**Critical rules:**
- Every query MUST be scoped to the authenticated user's `business_id`
- `sale_items` stores price snapshots — never join back to live product price for historical sales
- Deleting a product is a soft delete (`is_active: false`), never hard delete
- Stock decrement on sale MUST use a DB transaction to prevent race conditions

---

## 6. API CONVENTIONS

- **Base URL:** `https://api.ojapaddi.com/v1`
- **Auth:** `Authorization: Bearer <access_token>` on all protected routes
- **Success shape:** `{ success: true, data: { ... } }`
- **Error shape:** `{ success: false, error: { code: string, message: string } }`
- **Pagination:** `?page=1&limit=20` on all list endpoints
- **Date params:** ISO 8601 (`2026-05-08T00:00:00Z`)
- **Currency:** All monetary values stored and returned as `decimal(12,2)` in Naira (NGN)
- **Error codes (typed):**
  - `UNAUTHORIZED` — missing/invalid token
  - `FORBIDDEN` — valid token but wrong resource
  - `NOT_FOUND` — resource doesn't exist
  - `VALIDATION_ERROR` — Zod schema failure
  - `PLAN_LIMIT_REACHED` — free tier limit hit
  - `CONFLICT` — duplicate resource (e.g. email already exists)

---

## 7. AUTH FLOW

```
Register/Login → { access_token (15min), refresh_token (30 days) }
                          │
                          ▼
              access_token stored in memory (Zustand)
              refresh_token stored in Expo SecureStore
                          │
                          ▼
              On 401 → auto-call POST /auth/refresh
              Old refresh token invalidated immediately (rotation)
                          │
                          ▼
              On refresh failure → force logout → welcome screen
```

**Never store access tokens in AsyncStorage. Only SecureStore for refresh tokens.**

---

## 8. WHATSAPP INTEGRATION

No WhatsApp API used. All sharing is via native deep links.

**Per-product share link format:**
```
store.ojapaddi.com/[business-slug]/[product-id]
```

**WhatsApp deep link format:**
```
whatsapp://send?text=[encoded message]
```
Fallback: `https://wa.me/?text=[encoded message]`

**Message templates live in:** `apps/mobile/lib/whatsapp.ts`
Do not hardcode message strings anywhere else.

---

## 9. FREE vs PRO PLAN GATING

Plan limits are enforced **server-side first, client-side second.**
Never trust client-side plan checks alone.

| Resource | Free Limit | Pro |
|---|---|---|
| Products | 50 | Unlimited |
| Customers | 100 | Unlimited |
| Analytics date range | 30 days | Custom |
| Staff accounts | 0 | 3 |
| Product images | 1 | 5 |

When a limit is hit, API returns: `{ success: false, error: { code: "PLAN_LIMIT_REACHED", message: "..." } }`
Mobile intercepts this globally in `lib/api.ts` and triggers the upgrade bottom sheet.

**Pro pricing:** ₦3,500/month or ₦30,000/year
**Paystack integration:** Phase 2 — not in MVP

---

## 10. STOREFRONT STRATEGY

| Phase | Feature | URL Pattern |
|---|---|---|
| MVP | Per-product share pages (static, no cart) | `store.ojapaddi.com/[slug]/[product-id]` |
| Phase 2 | Full public storefront (cart + checkout) | `store.ojapaddi.com/[slug]` |

The per-product page has one CTA: **"Order on WhatsApp"** → deep links to seller's WhatsApp.
No cart, no checkout, no payment on the MVP share page.

---

## 11. DESIGN SYSTEM

**Always fetch from Google Stitch via Stitch MCP before writing any UI code.**

| Token | Value |
|---|---|
| Primary | `#1A6B3C` (Deep Green) |
| Accent | `#F5A623` (Warm Gold) |
| Background | `#F8F9FA` |
| Surface | `#FFFFFF` |
| Text Primary | `#1A1A1A` |
| Text Secondary | `#6B7280` |
| Error | `#E53935` |
| Success | `#2E7D32` |
| Border Radius (card) | 16px |
| Border Radius (button) | 12px |
| Border Radius (input) | 10px |
| Min tap target | 44x44pt |

**Tone of UI copy:**
- "Record a Sale" not "Create Transaction"
- "Add Product" not "Create SKU"
- "Running Low" not "Below Threshold"
- "Walk-in Customer" for sales with no attached customer
- Friendly confirmations: *"Sale recorded! 🎉"*, *"Product added ✓"*

All UI strings live in `apps/mobile/constants/copy.ts`. Never hardcode strings in components.

---

## 12. CODE QUALITY RULES

These apply to every file, every agent, every PR:

- TypeScript strict mode — `"strict": true` in all `tsconfig.json` files
- **No `any` types** — ever. Use `unknown` and narrow, or define proper types
- All API inputs validated with Zod on the server
- All forms validated with Zod on the client
- All environment variables accessed via typed `env.ts` — never `process.env.X` inline
- All API calls wrapped in `try/catch` with typed error handling
- No `console.log` in production code — use a logger utility
- Every screen must handle: loading state, error state, empty state
- No hardcoded strings in UI components — use `constants/copy.ts`
- No raw SQL strings in Drizzle queries unless absolutely unavoidable
- Expo Go compatibility required for all packages in MVP — no bare workflow modules

---

## 13. SECURITY RULES

Every agent must follow these without exception:

1. **Business scoping** — every DB query must filter by the authenticated user's `business_id`. An IDOR vulnerability here is catastrophic.
2. **No stack traces in production** — `errorHandler.ts` must strip them before responding
3. **Rate limiting** — all auth endpoints: 10 req/min per IP. All public endpoints: 30 req/min per IP.
4. **Signed URLs only** — R2 bucket is private. Never expose direct R2 URLs.
5. **Refresh token rotation** — invalidate old token immediately on refresh. One-time use only.
6. **Password reset tokens** — single-use, expire in 15 minutes, hashed before DB storage
7. **CORS** — only allow known origins (app domain + Expo Go during dev)
8. **File uploads** — validate MIME type server-side (not just extension), max 2MB per image
9. **Plan limits server-side** — never rely on client to enforce plan gating
10. **No secrets in mobile bundle** — all secrets via EAS Secrets or Cloudflare Workers Secrets

---

## 14. APPROVAL GATES

The following changes require explicit written approval from the Product Owner before any agent proceeds:

### 🔴 Always requires approval:
- Any database schema change (add/remove/rename table or column)
- Any change to auth mechanism or token strategy
- Any change to API response format or versioning
- Replacing a core dependency
- Adding a new third-party SaaS or paid service
- Significant folder/project structure changes
- Modifying security-critical middleware

### 🔴 Product changes requiring approval:
- Changing free tier limits or Pro plan gating
- Changing onboarding flow steps
- Changing WhatsApp share message templates
- Changing brand colors, typography, or tone of voice
- Adding or removing any MVP feature
- Changing pricing

**Format for requesting approval:**
```
🛑 APPROVAL REQUIRED
Type: [Architecture / Product / Security]
Change: [Exactly what you want to change]
Reason: [Why]
Impact: [What breaks or changes]
Alternative: [Can this be avoided?]

Awaiting approval.
```

---

## 15. BUILD PHASES (CURRENT STATUS)

| Phase | Description | Status |
|---|---|---|
| 0 | Project setup, monorepo, CI/CD | ⬜ Not started |
| 1 | Authentication (backend + mobile) | ⬜ Not started |
| 2 | Products (CRUD, images, share pages) | ⬜ Not started |
| 3 | Sales & inventory | ⬜ Not started |
| 4 | Customers & expenses | ⬜ Not started |
| 5 | Analytics | ⬜ Not started |
| 6 | Per-product share pages (Next.js) | ⬜ Not started |
| 7 | Notifications, plan gating, polish | ⬜ Not started |
| 8 | Launch prep & security audit | ⬜ Not started |

**Update the Status column as phases are completed.**

---

## 16. KNOWN OPEN DECISIONS

These are intentional deferrals — do not implement until explicitly instructed:

| Decision | Deferred To |
|---|---|
| Paystack payment collection | Phase 2 |
| Google OAuth ("Continue with Google") | Phase 2 |
| Full eCommerce storefront with cart | Phase 2 |
| Staff accounts & permissions | Phase 2 |
| Barcode scanning | Phase 2 |
| Multi-location support | Phase 3 |
| AI demand forecasting | Phase 3 |
| Logistics integration (Gig, Kwik, Sendbox) | Phase 3 |
| BNPL integration | Phase 3 |
| Web dashboard | Phase 3 |
| Ghana / Kenya expansion | Phase 3 |
| MMKV (swap from AsyncStorage) | Post Expo Go dev phase |

---

## 17. AGENT HANDOFF PROTOCOL

When a new agent picks up this project mid-build:

1. Read this entire `AGENTS.md` file first
2. Check Phase status table (Section 15) to understand current state
3. Review the last git commit message to understand what was last completed
4. Do NOT assume anything not written here — ask the Product Owner
5. Do NOT undo or refactor completed phases without approval
6. Run `tsc --noEmit` and confirm zero TypeScript errors before starting new work
7. Fetch Stitch design before touching any UI

---

*AGENTS.md v1.0 — OjaPaddi Project. Keep this file updated as the project evolves.*
