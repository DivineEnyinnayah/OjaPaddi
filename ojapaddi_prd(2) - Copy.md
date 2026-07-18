# OjaPaddi – Product Requirements Document
**Version:** 1.0  
**Status:** MVP  
**Last Updated:** May 2026  
**Tagline:** *Your Market Friend — Manage, Sell & Grow Your Business.*

---

## 1. Product Overview

### 1.1 Vision
OjaPaddi is a mobile-first business management platform built for African retail SMEs. It gives small and medium business owners everything they need to run their business — inventory, sales, invoicing, storefront, and analytics — in one simple app, with a genuinely useful free tier that lets real businesses operate without paying a kobo.

### 1.2 Mission
To be the most accessible, easiest-to-use, and most generous business tool for African market sellers — starting with Nigeria.

### 1.3 Core Differentiators (vs. Bumpa)
| Feature | Bumpa | OjaPaddi |
|---|---|---|
| Free tier | 14-day trial only | Permanent free tier (real features) |
| WhatsApp sharing | Basic | Deep (store link, product cards, receipts) |
| Onboarding | Multi-step | <2 minutes, guided |
| UX Complexity | Moderate | Radically simple |
| Target user | Tech-comfortable SME | Any market seller |

---

## 2. Target Users

### 2.1 Primary Persona — "Mama Tope" (The Market Seller)
- Sells clothing, shoes, accessories, or general goods
- Uses WhatsApp as primary sales/marketing channel
- Has 50–500 products in stock
- Struggles with knowing what's selling, what's running low, and how much profit she's making
- Not very tech-savvy; responds to simplicity
- Has a smartphone (Android, mid-range)

### 2.2 Secondary Persona — "Chukwudi" (The Growing Retailer)
- Has a physical store and is trying to go online
- Manages 1–3 staff
- Wants to look professional (branded invoices, receipts)
- Needs basic analytics to make buying decisions
- Would pay for premium features once he sees value

### 2.3 Out of Scope (Post-MVP)
- Enterprise businesses (50+ staff)
- Pure service businesses (salons, repair shops)
- International merchants (non-Nigeria)

---

## 3. MVP Scope

### 3.1 What's IN for MVP
1. **Authentication & Onboarding**
2. **Business Profile Setup**
3. **Product Catalog Management**
4. **Sales Recording (POS-lite)**
5. **Inventory Tracking**
6. **Invoice & Receipt Generation**
7. **WhatsApp Sharing**
8. **Basic Analytics Dashboard**
9. **Customer Records (Basic CRM)**
10. **Free vs. Pro Plan Gating**

### 3.2 What's OUT for MVP (Post-MVP Roadmap)
- eCommerce storefront (public website) — Phase 2
- Payment collection / Paystack terminal — Phase 2
- Staff management & permissions — Phase 2
- Logistics integration — Phase 3
- AI demand forecasting — Phase 3
- Barcode scanning — Phase 2
- Multi-location — Phase 2
- Web dashboard — Phase 2

---

## 4. Tech Stack & Architecture

### 4.1 Frontend
- **Framework:** React Native (Expo SDK 54 — compatible with Expo Go)
- **Navigation:** Expo Router (file-based)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **UI Components:** Custom design system (no heavy UI library)
- **Icons:** Expo Vector Icons / Lucide React Native
- **Storage (local):** Expo SecureStore (tokens), MMKV (app state cache)
- **Notifications:** Expo Notifications
- **Image Handling:** Expo Image Picker + Expo Image

### 4.2 Backend
- **Framework:** HonoJS (running on Node.js / Cloudflare Workers)
- **Language:** TypeScript
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL (via Neon — serverless, scalable)
- **Auth:** Supabase Auth
- **File Storage:** Supabase Storage
- **Email:** Resend (transactional emails)
- **PDF Generation:** @pdf-lib/pdflib or Puppeteer (serverless-compatible)

### 4.3 Infrastructure
- **Backend Hosting:** Bun Runtime
- **Package Manager** Bun
- **Database:** Supabase DB
- **Storage:** Supabase
- **Monitoring:** Sentry (errors), Posthog (product analytics)
- **CI/CD:** GitHub Actions → EAS Build (Expo)

### 4.4 Architecture Pattern
```
[React Native App]
      │
      ├── REST API → [Hono Backend on NodeJS]
      │                    │
      │               [Drizzle ORM]
      │                    │
      │             [Supabase]
      │
      ├── Image Upload → Supabase Storage
      └── Push Notifications → [Expo Push Service]
```

---

## 5. Database Schema

### 5.1 Users
```sql
users
- id: uuid (PK)
- email: varchar (unique)
- phone: varchar (unique, nullable)
- password_hash: varchar
- full_name: varchar
- avatar_url: varchar (nullable)
- plan: enum('free', 'pro', 'growth') DEFAULT 'free'
- plan_expires_at: timestamp (nullable)
- created_at: timestamp
- updated_at: timestamp
```

### 5.2 Businesses
```sql
businesses
- id: uuid (PK)
- user_id: uuid (FK → users)
- name: varchar
- description: text (nullable)
- category: varchar
- logo_url: varchar (nullable)
- phone: varchar
- email: varchar (nullable)
- address: text (nullable)
- city: varchar
- state: varchar
- country: varchar DEFAULT 'Nigeria'
- currency: varchar DEFAULT 'NGN'
- whatsapp_number: varchar (nullable)
- created_at: timestamp
- updated_at: timestamp
```

### 5.3 Products
```sql
products
- id: uuid (PK)
- business_id: uuid (FK → businesses)
- name: varchar
- description: text (nullable)
- sku: varchar (nullable, unique per business)
- category: varchar (nullable)
- price: decimal(12,2)
- cost_price: decimal(12,2) (nullable — for profit calc)
- quantity: integer DEFAULT 0
- low_stock_threshold: integer DEFAULT 5
- image_url: varchar (nullable)
- is_active: boolean DEFAULT true
- created_at: timestamp
- updated_at: timestamp
```

### 5.4 Customers
```sql
customers
- id: uuid (PK)
- business_id: uuid (FK → businesses)
- name: varchar
- phone: varchar (nullable)
- email: varchar (nullable)
- address: text (nullable)
- notes: text (nullable)
- total_spent: decimal(12,2) DEFAULT 0
- order_count: integer DEFAULT 0
- created_at: timestamp
- updated_at: timestamp
```

### 5.5 Sales
```sql
sales
- id: uuid (PK)
- business_id: uuid (FK → businesses)
- customer_id: uuid (FK → customers, nullable)
- reference: varchar (unique, e.g. OJA-20260508-001)
- subtotal: decimal(12,2)
- discount: decimal(12,2) DEFAULT 0
- total: decimal(12,2)
- payment_method: enum('cash', 'transfer', 'pos', 'other')
- payment_status: enum('paid', 'partial', 'unpaid') DEFAULT 'paid'
- amount_paid: decimal(12,2)
- notes: text (nullable)
- sold_at: timestamp
- created_at: timestamp
```

### 5.6 Sale Items
```sql
sale_items
- id: uuid (PK)
- sale_id: uuid (FK → sales)
- product_id: uuid (FK → products)
- product_name: varchar (snapshot)
- unit_price: decimal(12,2) (snapshot)
- cost_price: decimal(12,2) (snapshot, nullable)
- quantity: integer
- total: decimal(12,2)
```

### 5.7 Expenses
```sql
expenses
- id: uuid (PK)
- business_id: uuid (FK → businesses)
- description: varchar
- amount: decimal(12,2)
- category: varchar (nullable)
- incurred_at: timestamp
- created_at: timestamp
```

### 5.8 Refresh Tokens
```sql
refresh_tokens
- id: uuid (PK)
- user_id: uuid (FK → users)
- token_hash: varchar
- expires_at: timestamp
- created_at: timestamp
```

---

## 6. API Specification

**Base URL:** `https://api.ojapaddi.com/v1`  
**Auth:** Supbase  
**Format:** JSON  
**Errors:** `{ success: false, error: { code: string, message: string } }`  
**Success:** `{ success: true, data: {...} }`

---

### 6.1 Auth Endpoints

#### POST /auth/register
Register a new user + auto-create a business shell.
```json
// Request
{
  "full_name": "Tope Adeyemi",
  "email": "tope@gmail.com",
  "phone": "08012345678",
  "password": "securepassword123"
}

// Response 201
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "full_name": "..." },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

#### POST /auth/login
```json
// Request
{ "email": "tope@gmail.com", "password": "securepassword123" }

// Response 200
{
  "success": true,
  "data": {
    "user": { ... },
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

#### POST /auth/refresh
```json
// Request
{ "refresh_token": "eyJ..." }

// Response 200
{ "success": true, "data": { "access_token": "..." } }
```

#### POST /auth/logout
```json
// Request (authenticated)
{ "refresh_token": "eyJ..." }

// Response 200
{ "success": true, "data": { "message": "Logged out" } }
```

#### POST /auth/forgot-password
```json
{ "email": "tope@gmail.com" }
```

#### POST /auth/reset-password
```json
{ "token": "...", "new_password": "..." }
```

---

### 6.2 Business Endpoints

#### GET /business
Get authenticated user's business.

#### PUT /business
Update business profile.
```json
{
  "name": "Tope's Fashion Hub",
  "description": "...",
  "phone": "...",
  "whatsapp_number": "...",
  "address": "...",
  "city": "Lagos",
  "state": "Lagos"
}
```

#### POST /business/logo
Upload business logo (multipart/form-data).

---

### 6.3 Product Endpoints

#### GET /products
Query params: `?page=1&limit=20&category=&search=&low_stock=true`

#### POST /products
```json
{
  "name": "Ankara Top",
  "description": "Beautiful ankara fabric top",
  "sku": "ANK-001",
  "category": "Clothing",
  "price": 5000,
  "cost_price": 2500,
  "quantity": 30,
  "low_stock_threshold": 5
}
```

#### GET /products/:id

#### PUT /products/:id

#### DELETE /products/:id (soft delete — sets is_active: false)

#### POST /products/:id/image
Upload product image (multipart/form-data).

#### PATCH /products/:id/stock
Adjust stock manually.
```json
{ "quantity": 10, "reason": "Restock" }
```

#### GET /products/categories
Returns list of unique categories for the business.

---

### 6.4 Sales Endpoints

#### GET /sales
Query params: `?page=1&limit=20&from=2026-01-01&to=2026-05-08&payment_status=`

#### POST /sales
Record a new sale.
```json
{
  "customer_id": "uuid (optional)",
  "items": [
    { "product_id": "uuid", "quantity": 2, "unit_price": 5000 }
  ],
  "discount": 0,
  "payment_method": "cash",
  "payment_status": "paid",
  "amount_paid": 10000,
  "notes": ""
}
```
*Side effect: Automatically decrements stock for each item.*

#### GET /sales/:id
Full sale with items and customer info.

#### DELETE /sales/:id
Void a sale (restores stock).

#### GET /sales/:id/receipt
Returns receipt data (for rendering in-app or generating PDF share).

---

### 6.5 Customer Endpoints

#### GET /customers
Query params: `?page=1&limit=20&search=`

#### POST /customers
```json
{
  "name": "Amaka Obi",
  "phone": "08098765432",
  "email": "",
  "address": "21 Bode Thomas, Surulere"
}
```

#### GET /customers/:id
Includes purchase history.

#### PUT /customers/:id

#### DELETE /customers/:id

---

### 6.6 Expense Endpoints

#### GET /expenses
Query params: `?from=&to=&category=`

#### POST /expenses
```json
{
  "description": "Restock transport",
  "amount": 2000,
  "category": "Logistics",
  "incurred_at": "2026-05-08T10:00:00Z"
}
```

#### PUT /expenses/:id

#### DELETE /expenses/:id

---

### 6.7 Analytics Endpoints

#### GET /analytics/summary
Query params: `?from=&to=`
```json
// Response
{
  "total_revenue": 250000,
  "total_profit": 95000,
  "total_expenses": 18000,
  "net_profit": 77000,
  "total_sales_count": 48,
  "avg_order_value": 5208.33,
  "top_products": [
    { "product_id": "...", "name": "Ankara Top", "quantity_sold": 12, "revenue": 60000 }
  ],
  "low_stock_count": 3
}
```

#### GET /analytics/revenue-chart
Query params: `?period=daily|weekly|monthly&from=&to=`
Returns time-series data for revenue chart.

#### GET /analytics/top-customers
Returns top 5 customers by spend.

---

### 6.8 Share Endpoints

#### GET /share/receipt/:sale_id
Generates a shareable receipt image/PDF URL (stored in R2).

#### GET /share/product/:product_id
Returns data for a public, shareable per-product page.
```json
// Response (no auth required)
{
  "success": true,
  "data": {
    "product": {
      "id": "...",
      "name": "Ankara Top",
      "description": "Beautiful ankara fabric top",
      "price": 5000,
      "image_url": "...",
      "is_available": true
    },
    "business": {
      "name": "Tope's Fashion Hub",
      "logo_url": "...",
      "whatsapp_number": "08012345678",
      "city": "Lagos"
    }
  }
}
```
*Used to power the public per-product share page (MVP). No cart or checkout — buyer contacts seller via WhatsApp CTA.*

#### GET /store/:business_slug
*(Phase 2)* Returns full public storefront data — all active products, business info, categories.

#### GET /store/:business_slug/:product_id
*(Phase 2)* Returns individual product within storefront context (with related products).

---

## 7. Screen-by-Screen UI Requirements

### 7.1 Onboarding Flow
**Screen 1 — Splash/Welcome**
- OjaPaddi logo + tagline
- "Get Started" CTA + "I already have an account" link

**Screen 2 — Register**
- Fields: Full Name, Phone Number, Email, Password
- "Continue with Google" (Post-MVP)
- Inline validation (Zod)
- Submit → OTP verification on phone (Post-MVP, just email verify for MVP)

**Screen 3 — Business Setup**
- Fields: Business Name, Business Category (dropdown), WhatsApp Number, City, State
- Logo upload (optional, skip available)
- On complete → navigate to Home

---

### 7.2 Home / Dashboard Screen
- **Header:** "Good morning, [Name] 👋" + notification bell
- **Today's Summary Card:** Revenue | Sales Count | Profit (tappable → analytics)
- **Quick Actions Row:** [+ Record Sale] [+ Add Product] [+ Add Expense]
- **Low Stock Alert Banner** (if any products below threshold)
- **Recent Sales List** (last 5, tappable)
- **Bottom Tab Bar:** Home | Products | Sales | Customers | More

---

### 7.3 Products Screen
- Search bar + filter (by category, low stock)
- Product list (card view: image, name, price, stock qty)
- FAB (+) → Add Product
- Each product card → tap → Product Detail

**Add/Edit Product Screen**
- Image picker (tap to upload)
- Fields: Name, Category, Selling Price, Cost Price, Stock Qty, Low Stock Alert, SKU (optional), Description (optional)
- Save button

**Product Detail Screen**
- Product image, name, price, stock
- **"Share Product Page"** button → copies link `store.ojapaddi.com/[slug]/[product-id]` + opens WhatsApp with pre-filled message containing the link
- Edit / Delete actions
- Stock adjustment button (+ / -)

**Public Per-Product Share Page** *(web, no auth)*
- Hosted at `store.ojapaddi.com/[business-slug]/[product-id]`
- Shows: business logo + name, product image, product name, price, description, availability badge
- Single CTA: **"Order on WhatsApp"** → deep links to seller's WhatsApp with pre-filled message: *"Hi, I'm interested in [Product Name] (₦5,000). Is it available?"*
- No cart, no checkout — intentionally simple for MVP
- Mobile-optimized, fast-loading (Next.js static/SSR — separate web repo)


**Note**
Make use of the Stitch MCP for the UI designs.
The Project ID is 12780427853953747299

---

### 7.4 Record Sale Screen (POS-lite)
**Step 1 — Add Items**
- Search/browse products
- Tap product → add to cart
- Qty adjuster per item
- Running total at bottom

**Step 2 — Sale Details**
- Optional: Select/Add Customer
- Discount field
- Payment Method selector (Cash / Transfer / POS / Other)
- Amount Paid field (auto-fills total)
- Notes (optional)

**Step 3 — Confirmation**
- Sale summary
- "Record Sale" button
- On success → show receipt modal with "Share via WhatsApp" button

**Receipt Modal**
- Branded receipt with business logo, name, items, total, payment method, date, reference
- Buttons: "Share Receipt on WhatsApp" | "Download PDF" | "Done"

---

### 7.5 Sales Screen
- Date range filter (Today / This Week / This Month / Custom)
- Payment status filter (All / Paid / Unpaid / Partial)
- Sales list (reference, customer name/Guest, amount, date)
- Each sale → tap → Sale Detail (items breakdown, receipt share)

---

### 7.6 Customers Screen
- Search bar
- Customer list (name, phone, total spent, # of orders)
- FAB (+) → Add Customer
- Customer Detail Screen:
  - Contact info + Edit button
  - Total Spent, # Orders, Avg Order Value
  - Purchase history list

---

### 7.7 Analytics Screen
*(Pro only for advanced, basic available on free)*

**Free tier shows:**
- Total Revenue (last 30 days)
- Number of Sales
- Top 3 Products

**Pro tier adds:**
- Profit (requires cost price to be filled)
- Revenue chart (line/bar toggle)
- Avg order value
- Top Customers
- Expense breakdown
- Date range picker

---

### 7.8 Expenses Screen
- Monthly expense total card
- Expense list with category tags
- FAB (+) → Add Expense
- Fields: Description, Amount, Category, Date

---

### 7.9 More / Settings Screen
- Business Profile (edit)
- Subscription & Plan (free/pro indicator + upgrade CTA)
- Notifications settings
- Share OjaPaddi (referral)
- Help & Support (WhatsApp link)
- Privacy Policy / Terms
- Logout

---

### 7.10 Upgrade / Pricing Screen
- Plan comparison table (Free vs Pro vs Growth)
- Pay with Paystack (Phase 2 — for MVP just show plans, collect interest)

---

## 8. Free vs. Pro Tier Definition

### Free Tier (Always Free — No Credit Card)
| Feature | Free Limit |
|---|---|
| Products | Up to 50 |
| Sales recording | Unlimited |
| Customers | Up to 100 |
| Expenses | Unlimited |
| Invoices/Receipts | Unlimited |
| WhatsApp sharing | Unlimited |
| Basic analytics | Last 30 days only |
| Image uploads | 1 per product |
| Staff accounts | 0 (owner only) |

### Pro Tier (₦3,500/month or ₦30,000/year)
| Feature | Pro |
|---|---|
| Products | Unlimited |
| Customers | Unlimited |
| Analytics | Full (custom date range, profit, charts) |
| Image uploads | 5 per product |
| Staff accounts | Up to 3 |
| Low stock alerts (push) | ✅ |
| Barcode scanning | ✅ (Phase 2) |
| eCommerce storefront | ✅ (Phase 2) |
| Priority support | ✅ |

### Growth Tier (₦8,000/month — Phase 2)
- Everything in Pro
- Unlimited staff
- Multi-location
- USD storefront
- Logistics integrations
- Advanced CRM

---

## 9. WhatsApp Integration Spec

WhatsApp sharing in OjaPaddi uses **native deep links** — no WhatsApp API required for MVP.

### Share Receipt
```
wa.me/{whatsapp_number}?text=
*OjaPaddi Receipt* 🧾
Business: Tope's Fashion Hub
Ref: OJA-20260508-001

Items:
• Ankara Top x2 — ₦10,000
• Palazzo Pants x1 — ₦5,000

Discount: ₦0
*Total: ₦15,000*
Payment: Cash ✅

Thank you for your patronage! 🙏
```

### Share Product
```
wa.me/?text=
*Ankara Top* 🛍️
Price: ₦5,000

Beautiful ankara fabric top, available now!
Contact: 08012345678
```

### Share Product Page (MVP — per-product link)
```
wa.me/?text=
*Ankara Top* 🛍️
Price: ₦5,000

Tap to view & order 👇
store.ojapaddi.com/topes-fashion-hub/ankara-top-abc123
```

### Share Full Storefront (Phase 2)
```
wa.me/?text=
Shop from Tope's Fashion Hub 🛍️
Browse all products 👇
store.ojapaddi.com/topes-fashion-hub
```

All share text is auto-generated by the app. User can edit before sending.

---

## 10. Notification Spec

### Push Notifications (Expo Notifications)
| Trigger | Message |
|---|---|
| Product below low stock threshold | "⚠️ Ankara Top is running low — only 4 left!" |
| Daily sales summary (8pm) | "Today's sales: ₦25,000 across 8 orders 📊" |
| New sale recorded (for staff, Phase 2) | "New sale of ₦5,000 recorded by [Staff Name]" |

---

## 11. Non-Functional Requirements

### Performance
- App cold start: < 3 seconds
- API response time (p95): < 500ms
- Image upload: handled client-side before upload (compress to max 500KB)

### Security
- All passwords hashed with bcrypt (salt rounds: 12)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 30 days
- All API routes (except auth) require valid JWT
- R2 bucket is private; signed URLs used for image access
- Rate limiting on auth endpoints (10 req/min per IP)

### Offline Support
- Sales can be recorded offline (queued with MMKV)
- Syncs automatically when connectivity is restored
- Products list cached locally for offline browsing

### Accessibility
- Minimum tap target: 44x44pt
- Color contrast ratio: WCAG AA minimum
- Support for system font size scaling

### Localization (MVP)
- Language: English
- Currency: Nigerian Naira (₦) with proper formatting
- Date format: DD/MM/YYYY

---

## 12. Folder Structure

### Mobile App (Expo)
```
ojapaddi-app/
├── app/                      # Expo Router screens
│   ├── (auth)/
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── index.tsx          # Home/Dashboard
│   │   ├── products/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── add.tsx
│   │   ├── sales/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── record.tsx
│   │   ├── customers/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   └── more.tsx
│   └── analytics.tsx
├── components/
│   ├── ui/                    # Base design system components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   └── BottomSheet.tsx
│   ├── products/
│   ├── sales/
│   └── shared/
├── hooks/
│   ├── useAuth.ts
│   ├── useProducts.ts
│   ├── useSales.ts
│   └── useAnalytics.ts
├── stores/
│   ├── authStore.ts           # Zustand
│   └── cartStore.ts
├── lib/
│   ├── api.ts                 # Axios/fetch client with interceptors
│   ├── queryClient.ts
│   └── whatsapp.ts            # WA deep link generators
├── constants/
│   ├── colors.ts
│   └── typography.ts
└── types/
    └── index.ts
```

### Backend (HonoJS)
```
ojapaddi-api/
├── src/
│   ├── index.ts               # Hono app entry
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── business.ts
│   │   ├── products.ts
│   │   ├── sales.ts
│   │   ├── customers.ts
│   │   ├── expenses.ts
│   │   ├── analytics.ts
│   │   └── share.ts
│   ├── middleware/
│   │   ├── auth.ts            # Supabase Auth setup
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema
│   │   ├── index.ts           # DB connection
│   │   └── migrations/
│   ├── services/
│   │   ├── authService.ts
│   │   ├── analyticsService.ts
│   │   ├── storageService.ts  # Supabase uploads (if necessary)
│   │   ├── emailService.ts    # Resend
│   │   └── pdfService.ts
│   ├── validators/
│   │   └── schemas.ts         # Zod schemas
│   └── utils/
│       ├── jwt.ts
│       ├── generateRef.ts
│       └── formatCurrency.ts
├── drizzle.config.ts
├── wrangler.toml              # Cloudflare Workers config
└── package.json
```

---

## 13. MVP Build Phases

### Phase 0 — Setup (Week 1)
- [ ] Repo setup (monorepo with Turborepo)
- [ ] Expo app scaffolding with Expo Router
- [ ] Hono API scaffolding on Cloudflare Workers
- [ ] Neon DB setup + Drizzle schema + migrations
- [ ] R2 bucket setup
- [ ] CI/CD: GitHub Actions + EAS Build

### Phase 1 — Auth & Core (Weeks 2–3)
- [ ] Register, Login, Logout, Refresh token
- [ ] Business onboarding flow
- [ ] Business profile update + logo upload
- [ ] JWT middleware on all protected routes

### Phase 2 — Products (Weeks 3–4)
- [ ] Product CRUD
- [ ] Image upload to R2
- [ ] Stock adjustment
- [ ] Low stock detection
- [ ] Product list + detail screens

### Phase 3 — Sales & Inventory (Weeks 4–6)
- [ ] Record sale flow (cart → confirm → receipt)
- [ ] Automatic stock decrement on sale
- [ ] Sale list + detail screens
- [ ] Receipt generation + WhatsApp share
- [ ] Void sale (stock restore)

### Phase 4 — Customers & Expenses (Week 6–7)
- [ ] Customer CRUD
- [ ] Attach customer to sale
- [ ] Customer purchase history
- [ ] Expense CRUD

### Phase 5 — Analytics & Polish (Weeks 7–8)
- [ ] Analytics summary API + screen
- [ ] Revenue chart (daily/weekly/monthly)
- [ ] Top products + customers
- [ ] Low stock push notifications
- [ ] Daily sales summary notification
- [ ] Offline queue for sales

### Phase 6 — Launch Prep (Week 9)
- [ ] Plan gating (free limits enforced)
- [ ] Upgrade screen (interest capture)
- [ ] Referral share flow
- [ ] App Store + Play Store assets & submission
- [ ] Privacy Policy + Terms of Service
- [ ] Onboarding tooltips / empty states

---

## 14. Success Metrics (MVP KPIs)

| Metric | Target (3 months post-launch) |
|---|---|
| Total signups | 2,000 |
| Active businesses (weekly) | 500 |
| Sales recorded per active biz/week | ≥ 10 |
| Free → Pro conversion rate | ≥ 8% |
| D7 retention | ≥ 40% |
| D30 retention | ≥ 25% |
| App Store rating | ≥ 4.3 |
| Support response time | < 4 hours (WhatsApp) |

---

## 15. Out of Scope (Future Phases)

| Feature | Phase |
|---|---|
| Public eCommerce storefront (`store.ojapaddi.com/slug`) | 2 |
| Per-product share pages (`store.ojapaddi.com/slug/product-id`) | **MVP** |
| Paystack payment collection | 2 |
| Barcode scanning (Expo Camera) | 2 |
| Staff accounts & permissions | 2 |
| Multi-location support | 3 |
| AI demand forecasting | 3 |
| Logistics integration (Gig, Kwik, Sendbox) | 3 |
| BNPL integration (Carbon, Kreditufor) | 3 |
| Web dashboard | 3 |
| Ghana / Kenya expansion | 3 |

---

*OjaPaddi MVP PRD v1.0 — Built with 💚 for African market sellers.*
