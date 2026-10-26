/**
 * One-time data migration: Supabase Postgres -> SQLite (Turso).
 *
 *   pnpm --filter @ojapaddi/server migrate:data -- --dry-run
 *   pnpm --filter @ojapaddi/server migrate:data
 *
 * Reads every row out of the legacy Postgres database and writes it into the
 * new SQLite schema, preserving primary keys so cross-table foreign keys
 * (sale_items -> sales -> customers, etc.) stay valid.
 *
 * ── IMPORTANT: pass ──────────────────────────────────────────────────
 * Passwords cannot be migrated. Supabase Auth stores bcrypt hashes inside
 * GoTrue's private schema and the app's own `password_hash` column was never
 * written to, so there is no hash to copy. Each user gets a `user` row and a
 * business, but NO `account` credential row — they must use
 * "forgot password" once to set one. The script prints the affected emails.
 *
 * Run with --dry-run first. It performs no writes.
 */
import { readFileSync } from "fs";
import pg from "pg";
import { createDb, getClient } from "@ojapaddi/db";
import {
  user,
  businesses,
  products,
  customers,
  sales,
  saleItems,
  expenses,
} from "@ojapaddi/db/schema";

// pnpm forwards a bare "--" through to the script, so filter it out rather
// than relying on exact argv contents.
const ARGS = process.argv.slice(2).filter((a) => a !== "--");
const DRY_RUN = ARGS.includes("--dry-run");

// ── Config ────────────────────────────────────────────────────────────────
// Resolve .env paths from this file, not the cwd — the script may be run from
// the repo root or from apps/server.
const ROOT = new URL("../../../../", import.meta.url).pathname;

function loadEnv() {
  for (const f of ["apps/server/.env", "apps/server/.dev.vars", ".env", ".env.local"]) {
    try {
      for (const line of readFileSync(ROOT + f, "utf8").split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m && process.env[m[1]!] === undefined) {
          process.env[m[1]!] = m[2]!.trim().replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      /* optional */
    }
  }
}
loadEnv();

const LEGACY_URL =
  process.env.DIRECT_URL ||
  process.env.SUPABASE_DB_URL ||
  (() => {
    // Supabase exposes the pooler host; fall back to the project URL pattern.
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!url) return undefined;
    const ref = url.replace(/^https?:\/\//, "").split(".")[0];
    return ref ? `postgresql://postgres.${ref}:postgres@aws-0-eu-west-1.pooler.supabase.com:5432/postgres` : undefined;
  })();

if (!LEGACY_URL) {
  console.error(
    "Could not determine the legacy Postgres URL.\n" +
      "Set DIRECT_URL (or SUPABASE_DB_URL) in apps/server/.env to the Supabase connection string."
  );
  process.exit(1);
}

const TURSO_URL = process.env.TURSO_DATABASE_URL;
if (!TURSO_URL) {
  console.error("TURSO_DATABASE_URL is not set.");
  process.exit(1);
}
process.env.BETTER_AUTH_SECRET ??= "migration-only-secret-at-least-32-chars";
process.env.BETTER_AUTH_URL ??= "http://localhost:3001";
process.env.R2_PUBLIC_URL ??= "https://images.example.com";

// ── Connection ────────────────────────────────────────────────────────────
const legacy = new pg.Pool({
  connectionString: LEGACY_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
});

// Reuse the app's shared libSQL client so there is exactly one connection.
const sqlite = getClient();
const db = createDb();

/** Postgres timestamptz -> JS Date, or null.
 *  Columns are declared `integer({ mode: "timestamp_ms" })`, so drizzle expects
 *  Date objects on insert — not raw epoch numbers. */
const ts = (v: any): Date | null => (v ? new Date(v) : null);
/** Postgres numeric -> fixed 2dp string. */
const dec = (v: any): string => (v == null ? "0.00" : Number(v).toFixed(2));
const str = (v: any): string | null => (v == null ? null : String(v));

async function readRows(table: string) {
  const { rows } = await legacy.query(`SELECT * FROM "${table}"`);
  return rows;
}

async function main() {
  // Print the resolved target loudly. A stale/duplicate key in .env once sent
  // this migration to the wrong database while it still reported success.
  const target = new URL(TURSO_URL!).host;
  console.log(
    `TARGET: ${TURSO_URL!.startsWith("file:") ? "LOCAL FILE " + TURSO_URL : "REMOTE " + target}\n`
  );
  if (!DRY_RUN && !TURSO_URL!.startsWith("file:")) {
    console.log("⚠  This will WRITE to the remote production database.\n");
  }

  console.log(
    `${DRY_RUN ? "DRY RUN — no writes" : "MIGRATING"}: Supabase Postgres -> SQLite\n`
  );

  const [oldUsers, oldBusinesses, oldProducts, oldCustomers, oldSales, oldSaleItems, oldExpenses] =
    await Promise.all([
      readRows("users"),
      readRows("businesses"),
      readRows("products"),
      readRows("customers"),
      readRows("sales"),
      readRows("sale_items"),
      readRows("expenses"),
    ]);

  console.log("Source row counts:");
  console.log(`  users=${oldUsers.length} businesses=${oldBusinesses.length} products=${oldProducts.length}`);
  console.log(`  customers=${oldCustomers.length} sales=${oldSales.length} sale_items=${oldSaleItems.length} expenses=${oldExpenses.length}`);

  // ── Build the rows ──────────────────────────────────────────────────────
  const users = oldUsers.map((u: any) => ({
    id: String(u.id),
    name: u.full_name ?? u.email?.split("@")[0] ?? "User",
    email: String(u.email).toLowerCase(),
    emailVerified: false,
    image: str(u.avatar_url),
    fullName: str(u.full_name),
    phone: str(u.phone),
    plan: str(u.plan) ?? "free",
    planExpiresAt: ts(u.plan_expires_at),
    createdAt: ts(u.created_at) ?? new Date(),
    updatedAt: ts(u.updated_at) ?? new Date(),
  }));

  const businessRows = oldBusinesses.map((b: any) => ({
    id: String(b.id),
    userId: String(b.user_id),
    name: b.name,
    slug: str(b.slug),
    description: str(b.description),
    category: str(b.category),
    // Legacy rows may hold an expiring Supabase signed URL; keep it so nothing
    // is lost, but flag it — it will 404 once Supabase is decommissioned.
    logoUrl: str(b.logo_url),
    phone: str(b.phone),
    email: str(b.email),
    address: str(b.address),
    city: str(b.city),
    state: str(b.state),
    country: str(b.country) ?? "Nigeria",
    currency: str(b.currency) ?? "NGN",
    whatsappNumber: str(b.whatsapp_number),
    isPublished: Boolean(b.is_published),
    deletedAt: ts(b.deleted_at),
    createdAt: ts(b.created_at) ?? new Date(),
    updatedAt: ts(b.updated_at) ?? new Date(),
  }));

  const expiringLogos = businessRows.filter(
    (b) => b.logoUrl?.includes("token=") || b.logoUrl?.includes("supabase")
  ).length;
  if (expiringLogos > 0) {
    console.log(
      `\n⚠ ${expiringLogos} business logo URL(s) are Supabase signed URLs that will expire.\n` +
        `  Re-upload them after cutover, or copy the objects to R2 first.`
    );
  }

  const productRows = oldProducts.map((p: any) => ({
    id: String(p.id),
    businessId: String(p.business_id),
    name: p.name,
    description: str(p.description),
    sku: str(p.sku),
    category: str(p.category),
    price: dec(p.price),
    costPrice: p.cost_price == null ? null : dec(p.cost_price),
    quantity: Number(p.quantity ?? 0),
    lowStockThreshold: Number(p.low_stock_threshold ?? 5),
    // Same caveat as logos: these are storage paths in a bucket that is about
    // to stop existing. Migrating the path alone does not migrate the bytes.
    imageUrl: str(p.image_url),
    isActive: p.is_active ?? true,
    isVisible: p.is_visible ?? true,
    createdAt: ts(p.created_at) ?? new Date(),
    updatedAt: ts(p.updated_at) ?? new Date(),
  }));

  const expiredImages = productRows.filter((p) => p.imageUrl && !p.imageUrl.startsWith("http")).length;
  if (expiredImages > 0) {
    console.log(
      `⚠ ${expiredImages} product image path(s) point at the old Supabase Storage bucket.\n` +
        `  The path is preserved, but the files must be copied to R2 to keep rendering.`
    );
  }

  const customerRows = oldCustomers.map((c: any) => ({
    id: String(c.id),
    businessId: String(c.business_id),
    name: c.name,
    phone: str(c.phone),
    email: str(c.email),
    address: str(c.address),
    notes: str(c.notes),
    customerType: str(c.customer_type) ?? "individual",
    expectedPaymentPeriodDays: c.expected_payment_period_days == null ? null : Number(c.expected_payment_period_days),
    suppliedProductIds: Array.isArray(c.supplied_product_ids) ? c.supplied_product_ids : [],
    totalSpent: dec(c.total_spent),
    orderCount: Number(c.order_count ?? 0),
    createdAt: ts(c.created_at) ?? new Date(),
    updatedAt: ts(c.updated_at) ?? new Date(),
  }));

  const saleRows = oldSales.map((s: any) => ({
    id: String(s.id),
    businessId: String(s.business_id),
    customerId: s.customer_id ? String(s.customer_id) : null,
    reference: s.reference,
    orderType: str(s.order_type) ?? "customer",
    expectedPaymentDate: ts(s.expected_payment_date),
    subtotal: dec(s.subtotal),
    discount: dec(s.discount),
    returnedAmount: dec(s.returned_amount),
    total: dec(s.total),
    paymentMethod: s.payment_method,
    paymentStatus: str(s.payment_status) ?? "paid",
    amountPaid: dec(s.amount_paid),
    notes: str(s.notes),
    soldAt: ts(s.sold_at),
    createdAt: ts(s.created_at) ?? new Date(),
    voidedAt: ts(s.voided_at),
    voidedBy: str(s.voided_by),
  }));

  const saleItemRows = oldSaleItems.map((i: any) => ({
    id: String(i.id),
    saleId: String(i.sale_id),
    productId: i.product_id ? String(i.product_id) : null,
    productName: i.product_name,
    unitPrice: dec(i.unit_price),
    costPrice: i.cost_price == null ? null : dec(i.cost_price),
    quantity: Number(i.quantity),
    returnedQuantity: Number(i.returned_quantity ?? 0),
    total: dec(i.total),
  }));

  const expenseRows = oldExpenses.map((e: any) => ({
    id: String(e.id),
    businessId: String(e.business_id),
    description: e.description,
    amount: dec(e.amount),
    category: str(e.category),
    isRecurring: Boolean(e.is_recurring),
    recurringFrequency: str(e.recurring_frequency),
    dueDate: ts(e.due_date),
    isPaid: e.is_paid ?? true,
    reminderDaysBefore: e.reminder_days_before == null ? null : Number(e.reminder_days_before),
    incurredAt: ts(e.incurred_at) ?? new Date(),
    createdAt: ts(e.created_at) ?? new Date(),
  }));

  // ── Referential integrity pre-flight ─────────────────────────────────────
  const userIds = new Set(users.map((u) => u.id));
  const businessIds = new Set(businessRows.map((b) => b.id));
  const customerIds = new Set(customerRows.map((c) => c.id));
  const productIds = new Set(productRows.map((p) => p.id));
  const saleIds = new Set(saleRows.map((s) => s.id));

  const problems: string[] = [];
  for (const b of businessRows) if (!userIds.has(b.userId)) problems.push(`business ${b.id} -> missing user ${b.userId}`);
  for (const p of productRows) if (!businessIds.has(p.businessId)) problems.push(`product ${p.id} -> missing business ${p.businessId}`);
  for (const c of customerRows) if (!businessIds.has(c.businessId)) problems.push(`customer ${c.id} -> missing business ${c.businessId}`);
  for (const s of saleRows) {
    if (!businessIds.has(s.businessId)) problems.push(`sale ${s.id} -> missing business ${s.businessId}`);
    if (s.customerId && !customerIds.has(s.customerId)) problems.push(`sale ${s.id} -> missing customer ${s.customerId}`);
  }
  for (const i of saleItemRows) {
    if (!saleIds.has(i.saleId)) problems.push(`sale_item ${i.id} -> missing sale ${i.saleId}`);
    if (i.productId && !productIds.has(i.productId)) problems.push(`sale_item ${i.id} -> missing product ${i.productId}`);
  }
  for (const e of expenseRows) if (!businessIds.has(e.businessId)) problems.push(`expense ${e.id} -> missing business ${e.businessId}`);

  if (problems.length > 0) {
    console.error(`\n✗ Referential integrity check failed (${problems.length} problems):`);
    for (const p of problems.slice(0, 25)) console.error(`   - ${p}`);
    process.exit(1);
  }
  console.log("\n✓ Referential integrity check passed.");

  // Duplicates that SQLite would reject outright.
  const emails = users.map((u) => u.email);
  const dupEmails = emails.filter((e, i) => emails.indexOf(e) !== i);
  if (dupEmails.length) {
    console.error(`\n✗ Duplicate user emails (unique index would reject): ${[...new Set(dupEmails)].join(", ")}`);
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log("\nDry run complete — nothing was written.");
    console.log(
      `\nThe following ${users.length} user(s) will need to reset their password after cutover:\n` +
        users.map((u) => `  - ${u.email}`).join("\n")
    );
    return;
  }

  // ── Write ────────────────────────────────────────────────────────────────
  // Atomicity note: `BEGIN`/`COMMIT` cannot span HTTP requests — against a
  // remote libSQL/Turso database each `execute()` is a separate round trip, so
  // an explicit transaction is silently discarded and the inserts land
  // un-wrapped (which is how an earlier run reported "cannot rollback - no
  // transaction is active" *after* its rows had already been written).
  //
  // `client.batch()` is the supported primitive: one request, executed
  // atomically by the server. Everything goes in a single batch so the
  // migration is all-or-nothing.
  // Parents before children — the batch is not reorderable.
  const statements = [
    ...(users.length ? [db.insert(user).values(users as any)] : []),
    ...(businessRows.length ? [db.insert(businesses).values(businessRows as any)] : []),
    ...(productRows.length ? [db.insert(products).values(productRows as any)] : []),
    ...(customerRows.length ? [db.insert(customers).values(customerRows as any)] : []),
    ...(saleRows.length ? [db.insert(sales).values(saleRows as any)] : []),
    ...(saleItemRows.length ? [db.insert(saleItems).values(saleItemRows as any)] : []),
    ...(expenseRows.length ? [db.insert(expenses).values(expenseRows as any)] : []),
  ];

  console.log(`\nWriting ${statements.length} statement(s) in a single atomic batch…`);
  await db.batch(statements as any);
  console.log("✓ Batch committed.");

  // ── Verify ───────────────────────────────────────────────────────────────
  console.log("\nVerifying row counts in SQLite:");
  let ok = true;
  for (const [label, expected] of [
    ["user", users.length],
    ["businesses", businessRows.length],
    ["products", productRows.length],
    ["customers", customerRows.length],
    ["sales", saleRows.length],
    ["sale_items", saleItemRows.length],
    ["expenses", expenseRows.length],
  ] as const) {
    const res = await sqlite.execute(`SELECT count(*) AS c FROM "${label}"`);
    const actual = Number(res.rows[0]!.c);
    const match = actual === expected;
    if (!match) ok = false;
    console.log(`  ${match ? "✓" : "✗"} ${label}: ${actual} (expected ${expected})`);
  }

  if (!ok) {
    console.error("\n✗ Verification failed.");
    process.exit(1);
  }

  console.log(`\n✓ Migration complete.`);
  console.log(
    `\nThe following ${users.length} user(s) have NO password and must use "forgot password" once:\n` +
      users.map((u) => `  - ${u.email}`).join("\n")
  );
}

main()
  .catch((e) => {
    console.error("\n✗ Migration failed:", e?.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await legacy.end();
    await sqlite.close();
  });