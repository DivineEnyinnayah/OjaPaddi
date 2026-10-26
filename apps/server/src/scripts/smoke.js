/**
 * End-to-end smoke test against a real SQLite database.
 *
 * Exercises the full mobile-facing contract: register -> login -> product ->
 * sale -> analytics -> returns -> void -> refresh -> logout. Run with:
 *   pnpm --filter @ojapaddi/server exec tsx src/scripts/smoke.ts
 */
process.env.TURSO_DATABASE_URL = process.env.SMOKE_DB ?? "file:/tmp/opencode/ojapaddi-smoke.db";
// SAFETY: this suite DELETEs FROM every table before it starts. `apps/server/.env`
// now points at the production Turso database, so a mis-set SMOKE_DB would wipe
// real data. Refuse to run against anything remote unless explicitly forced.
if (!process.env.TURSO_DATABASE_URL.startsWith("file:") && process.env.SMOKE_ALLOW_REMOTE !== "1") {
    console.error(
        "\n✗ REFUSING TO RUN.\n" +
            `  SMOKE_DB is set to a remote database (${new URL(process.env.TURSO_DATABASE_URL).host}).\n` +
            "  This suite deletes every row before running. Point SMOKE_DB at a scratch\n" +
            "  database, or set SMOKE_ALLOW_REMOTE=1 if you truly mean it.\n",
    );
    process.exit(1);
}
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET ?? "smoke-test-secret-at-least-32-characters-long";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
process.env.R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://images.example.com";
process.env.NODE_ENV = "test";
// Email is the ONLY way a reset code reaches a user. The suite intercepts the
// provider's HTTPS call rather than sending mail, and asserts on the real
// request payload — so the production path is verified without an API key.
process.env.EMAIL_API_KEY = "smoke-test-key";
process.env.EMAIL_FROM = "OjaPaddi <support@example.com>";
const { migrate } = await import("drizzle-orm/libsql/migrator");
const { createDb, getClient } = await import("@ojapaddi/db");
const { user: userTable, businesses: businessTable } = await import("@ojapaddi/db/schema");
const sentEmails = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url;
    if (url?.includes("api.resend.com")) {
        const payload = JSON.parse(String(init?.body ?? "{}"));
        const auth = String(init?.headers?.Authorization ?? "");
        sentEmails.push({
            apiKey: auth.replace("Bearer ", ""),
            from: payload.from ?? "",
            to: payload.to?.[0] ?? "",
            subject: payload.subject ?? "",
            text: payload.text ?? "",
        });
        return new Response(JSON.stringify({ id: "smoke-test" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }
    return realFetch(input, init);
};
/** Pulls the reset code out of the emailed body (it sits on its own line). */
function codeFromEmail(mail) {
    return /^[ \t]{4}(\S+)[ \t]*$/m.exec(mail.text)?.[1];
}
const MIGRATIONS = new URL("../../../../packages/db/src/migrations", import.meta.url).pathname;
const app = (await import("../index")).default;
let passed = 0;
let failed = 0;
function check(name, cond, detail) {
    if (cond) {
        passed++;
        console.log(`  ✓ ${name}`);
    } else {
        failed++;
        console.log(`  ✗ ${name}`, detail !== undefined ? JSON.stringify(detail) : "");
    }
}
async function api(path, init = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...init.headers,
    };
    if (init.token) headers.Authorization = `Bearer ${init.token}`;
    const res = await app.request(`http://localhost${path}`, {
        ...init,
        headers,
    });
    const text = await res.text();
    let body;
    try {
        body = JSON.parse(text);
    } catch {
        body = text;
    }
    return { status: res.status, body };
}
// ── Prepare a clean database ──────────────────────────────────────────
const db = createDb();
await migrate(db, { migrationsFolder: MIGRATIONS });
// Clear previous runs so ids are stable across iterations.
await getClient().execute("PRAGMA foreign_keys = ON");
for (const t of [
    "sale_items",
    "sales",
    "products",
    "customers",
    "expenses",
    "businesses",
    "session",
    "account",
    "verification",
    "user",
]) {
    await getClient().execute(`DELETE FROM "${t}"`);
}
const stamp = Date.now();
const email = `smoke${stamp}@example.com`;
const password = "SuperSecret123!";
console.log(`\n▶ register (${email})`);
const reg = await api("/v1/auth/complete-registration", {
    method: "POST",
    body: JSON.stringify({
        registration: { fullName: "Ada Smoke", email, phone: "08012345678", password },
        onboarding: {
            businessName: "Smoke Shop",
            category: "Provision",
            whatsappNumber: "08012345678",
            city: "Lagos",
            state: "Lagos",
        },
    }),
});
check("registration returns 201", reg.status === 201, reg.body);
check("has access_token", typeof reg.body?.data?.access_token === "string", reg.body);
check("has refresh_token", typeof reg.body?.data?.refresh_token === "string");
check(
    "refresh_token is snake_case (mobile contract)",
    "refresh_token" in (reg.body?.data ?? {}),
    Object.keys(reg.body?.data ?? {}),
);
const token = reg.body?.data?.access_token;
console.log("\n▶ login");
const login = await api("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
});
check("login returns 200", login.status === 200, login.body);
check(
    "login returns businessName + plan",
    typeof login.body?.data?.user?.businessName === "string" && login.body?.data?.user?.plan === "free",
    login.body?.data?.user,
);
check(
    "wrong password is rejected",
    (
        await api("/v1/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password: "wrong" }),
        })
    ).status === 401,
);
console.log("\n▶ auth guards");
check("no token -> 401", (await api("/v1/products")).status === 401);
check("garbage token -> 401", (await api("/v1/products", { token: "nope" })).status === 401);
console.log("\n▶ products");
const p1 = await api("/v1/products", {
    method: "POST",
    token,
    body: JSON.stringify({
        name: "Rice 50kg",
        sku: `RICE-${stamp}`,
        category: "Grains",
        price: 45000,
        costPrice: 38000,
        quantity: 10,
    }),
});
check("create product -> 201", p1.status === 201, p1.body);
check("price stored as 2dp string", p1.body?.data?.price === "45000.00", p1.body?.data?.price);
const productId = p1.body?.data?.id;
const dupSku = await api("/v1/products", {
    method: "POST",
    token,
    body: JSON.stringify({ name: "Dup", sku: `RICE-${stamp}`, price: 1, quantity: 1 }),
});
check("duplicate SKU rejected", dupSku.status === 400, dupSku.body);
const noSku = await api("/v1/products", {
    method: "POST",
    token,
    body: JSON.stringify({ name: "No SKU A", price: 100, quantity: 1 }),
});
const noSku2 = await api("/v1/products", {
    method: "POST",
    token,
    body: JSON.stringify({ name: "No SKU B", price: 100, quantity: 1 }),
});
check("two products without SKU allowed (partial unique index)", noSku.status === 201 && noSku2.status === 201, {
    a: noSku.status,
    b: noSku2.status,
});
const list = await api("/v1/products", { token });
check("list products returns 3", list.body?.data?.products?.length === 3, list.body?.data?.pagination);
const search = await api(`/v1/products?search=Rice`, { token });
check("search filters", search.body?.data?.products?.length === 1);
const categories = await api("/v1/products/categories", { token });
check("categories endpoint", Array.isArray(categories.body?.data?.categories), categories.body);
console.log("\n▶ customers");
const c1 = await api("/v1/customers", {
    method: "POST",
    token,
    body: JSON.stringify({ name: "BigMart", phone: "08099998888", customerType: "supermarket" }),
});
check("create customer -> 201", c1.status === 201, c1.body);
const customerId = c1.body?.data?.id;
const dupPhone = await api("/v1/customers", {
    method: "POST",
    token,
    body: JSON.stringify({ name: "Dup Mart", phone: "08099998888" }),
});
check(
    "duplicate customer phone rejected",
    dupPhone.status === 409 || dupPhone.status === 400,
    dupPhone.body?.error?.code,
);
console.log("\n▶ sales");
const s1 = await api("/v1/sales", {
    method: "POST",
    token,
    body: JSON.stringify({
        orderType: "customer",
        customerId,
        items: [{ productId, quantity: 2, unitPrice: 45000 }],
        discount: 1000,
        paymentMethod: "transfer",
        paymentStatus: "partial",
        amountPaid: 50000,
    }),
});
check("create sale -> 201", s1.status === 201, s1.body);
check("sale total = 89000.00", s1.body?.data?.total === "89000.00", s1.body?.data?.total);
const saleId = s1.body?.data?.id;
const afterSale = await api(`/v1/products/${productId}`, { token });
check("stock decremented to 8", afterSale.body?.data?.quantity === 8, afterSale.body?.data?.quantity);
const custAfter = await api(`/v1/customers/${customerId}`, { token });
check(
    "customer totalSpent = 89000.00",
    custAfter.body?.data?.totalSpent === "89000.00",
    custAfter.body?.data?.totalSpent,
);
check("customer orderCount = 1", custAfter.body?.data?.orderCount === 1);
const oversell = await api("/v1/sales", {
    method: "POST",
    token,
    body: JSON.stringify({
        items: [{ productId, quantity: 9999, unitPrice: 45000 }],
        paymentMethod: "cash",
        paymentStatus: "paid",
        amountPaid: 0,
    }),
});
check("oversell rejected", oversell.status >= 400, oversell.body?.error?.message);
console.log("\n▶ returns");
const saleDetail = await api(`/v1/sales/${saleId}`, { token });
const saleItemId = saleDetail.body?.data?.items?.[0]?.id;
const ret = await api(`/v1/sales/${saleId}/returns`, {
    method: "POST",
    token,
    body: JSON.stringify({ returns: [{ saleItemId, quantity: 1 }], notes: "damaged bag" }),
});
check("returns -> 200", ret.status === 200, ret.body);
check("returnedAmount = 45000.00", ret.body?.data?.returnedAmount === "45000.00", ret.body?.data?.returnedAmount);
check("net total = 44000.00", ret.body?.data?.total === "44000.00", ret.body?.data?.total);
const afterReturn = await api(`/v1/products/${productId}`, { token });
check("stock restored to 9", afterReturn.body?.data?.quantity === 9, afterReturn.body?.data?.quantity);
const overReturn = await api(`/v1/sales/${saleId}/returns`, {
    method: "POST",
    token,
    body: JSON.stringify({ returns: [{ saleItemId, quantity: 99 }] }),
});
check("over-return rejected", overReturn.status >= 400, overReturn.body?.error?.message);
console.log("\n▶ analytics (SQLite date bucketing + text money sums)");
const summary = await api("/v1/analytics/summary", { token });
check("summary -> 200", summary.status === 200, summary.body);
check(
    // 2 x 45000 less the 1000 discount, minus the 45000 returned unit = 44000.
    "summary revenue reflects the return (44000)",
    Number(summary.body?.data?.totalRevenue) === 44000,
    summary.body?.data,
);
const chart = await api("/v1/analytics/revenue-chart", { token });
check("revenue chart -> 200", chart.status === 200, chart.body);
check(
    "chart rows are YYYY-MM-DD",
    Array.isArray(chart.body?.data) && chart.body.data.every(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date)),
    chart.body?.data,
);
const topCustomers = await api("/v1/analytics/top-customers", { token });
check("top customers -> 200", topCustomers.status === 200, topCustomers.body);
const prodAnalytics = await api(`/v1/analytics/product/${productId}`, { token });
check("product analytics -> 200", prodAnalytics.status === 200, prodAnalytics.body);
const superAnalytics = await api(`/v1/analytics/supermarket/${customerId}`, { token });
check("supermarket analytics -> 200", superAnalytics.status === 200, superAnalytics.body);
const mba = await api("/v1/analytics/mba", { token });
check("mba -> 200", mba.status === 200, mba.body);
console.log("\n▶ expenses");
const e1 = await api("/v1/expenses", {
    method: "POST",
    token,
    body: JSON.stringify({ description: "Diesel for generator", amount: 15000, category: "Fuel" }),
});
check("create expense -> 201", e1.status === 201, e1.body);
check("expense amount 2dp", e1.body?.data?.amount === "15000.00", e1.body?.data?.amount);
const expSearch = await api("/v1/expenses?search=diesel", { token });
check("expense case-insensitive search (LIKE)", expSearch.body?.data?.length === 1, expSearch.body?.data);
console.log("\n▶ business");
const biz = await api("/v1/business", { token });
check("get business -> 200", biz.status === 200, biz.body);
check("business has slug column", "slug" in (biz.body?.data ?? {}));
const bizUpd = await api("/v1/business", {
    method: "PUT",
    token,
    body: JSON.stringify({ name: "Smoke Shop Renamed", city: "Ikeja" }),
});
check("update business -> 200", bizUpd.status === 200, bizUpd.body);
check("name updated", bizUpd.body?.data?.name === "Smoke Shop Renamed", bizUpd.body?.data?.name);
const slugAvail = await api("/v1/business/storefront/slug-available/smoke-shop-x", { token });
check("slug-available -> 200", slugAvail.status === 200, slugAvail.body);
console.log("\n▶ share");
const receipt = await api(`/v1/share/receipt/${saleId}`, { token });
check("share receipt -> 200", receipt.status === 200, receipt.body);
check("receipt has items", (receipt.body?.data?.items?.length ?? 0) > 0);
const prodShare = await api(`/v1/share/product/${productId}`, { token });
check("share product -> 200", prodShare.status === 200, prodShare.body);
console.log("\n▶ void");
const voided = await api(`/v1/sales/${saleId}`, { method: "DELETE", token });
check("void sale -> 200", voided.status === 200, voided.body);
const afterVoid = await api(`/v1/products/${productId}`, { token });
check("stock restored on void (9 + 1 net = 10)", afterVoid.body?.data?.quantity === 10, afterVoid.body?.data?.quantity);
console.log("\n▶ tenant isolation");
const reg2 = await api("/v1/auth/complete-registration", {
    method: "POST",
    body: JSON.stringify({
        registration: { fullName: "Mallory", email: `other${stamp}@example.com`, password },
        onboarding: {
            businessName: "Other Shop",
            category: "General",
            whatsappNumber: "08055556666",
            city: "Abuja",
            state: "FCT",
        },
    }),
});
const token2 = reg2.body?.data?.access_token;
const crossRead = await api(`/v1/products/${productId}`, { token: token2 });
check("other tenant cannot read product (404)", crossRead.status === 404, crossRead.status);
const crossSale = await api(`/v1/sales/${saleId}`, { token: token2 });
check("other tenant cannot read sale (404)", crossSale.status === 404, crossSale.status);
console.log("\n▶ refresh");
const refreshed = await api("/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: reg.body.data.refresh_token }),
});
check("refresh -> 200", refreshed.status === 200, refreshed.body);
check(
    "refresh returns snake_case refresh_token",
    "refresh_token" in (refreshed.body?.data ?? {}),
    Object.keys(refreshed.body?.data ?? {}),
);
check(
    "refreshed token works",
    (await api("/v1/products", { token: refreshed.body?.data?.access_token })).status === 200,
);
const badRefresh = await api("/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: "garbage" }),
});
check("bad refresh -> 401", badRefresh.status === 401);
console.log("\n▶ logout");
const out = await api("/v1/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshed.body.data.refresh_token }),
});
check("logout -> 200", out.status === 200, out.body);
check(
    "token revoked after logout",
    (await api("/v1/products", { token: refreshed.body?.data?.access_token })).status === 401,
);
// ── Supabase-cutover flow: account exists, password never set ──────────
console.log("\n▶ migrated user (no password yet)");
const db2 = createDb();
const migratedEmail = `migrated${stamp}@example.com`;
const migratedId = crypto.randomUUID();
await db2.insert(userTable).values({
    id: migratedId,
    name: "Migrated User",
    email: migratedEmail,
    emailVerified: false,
    fullName: "Migrated User",
    plan: "free",
    createdAt: new Date(),
    updatedAt: new Date(),
});
await db2.insert(businessTable).values({
    id: crypto.randomUUID(),
    userId: migratedId,
    name: "Migrated Shop",
    country: "Nigeria",
    currency: "NGN",
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
});
const migratedLogin = await api("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: migratedEmail, password: "any-old-password" }),
});
check("login is rejected", migratedLogin.status === 401, migratedLogin.status);
check(
    "login reports PASSWORD_RESET_REQUIRED",
    migratedLogin.body?.error?.code === "PASSWORD_RESET_REQUIRED",
    migratedLogin.body?.error,
);
check(
    "PASSWORD_RESET_REQUIRED echoes the email for the next screen",
    migratedLogin.body?.error?.email === migratedEmail,
    migratedLogin.body?.error,
);
// A user who already has a password must NOT get the reset code.
const normalWrong = await api("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "definitely-wrong" }),
});
check(
    "existing user with wrong password gets LOGIN_FAILED, not reset",
    normalWrong.body?.error?.code === "LOGIN_FAILED",
    normalWrong.body?.error,
);
const forgot = await api("/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: migratedEmail }),
});
check("forgot-password -> 200", forgot.status === 200, forgot.body);
check(
    "response never contains the code (email-only delivery)",
    forgot.body?.data?.code === undefined,
    Object.keys(forgot.body?.data ?? {}),
);
const emailed = sentEmails.find(e => e.to === migratedEmail);
check(
    "an email was actually sent to the user",
    Boolean(emailed),
    sentEmails.map(e => e.to),
);
check("the request authenticated with EMAIL_API_KEY", emailed?.apiKey === "smoke-test-key", emailed?.apiKey);
check("the email came from EMAIL_FROM", emailed?.from === "OjaPaddi <support@example.com>", emailed?.from);
const resetCode = emailed ? codeFromEmail(emailed) : undefined;
check("the emailed body contains a reset code", typeof resetCode === "string", emailed?.text);
const unknownForgot = await api("/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: `nobody${stamp}@example.com` }),
});
check(
    "unknown email still reports success (no enumeration)",
    unknownForgot.status === 200 && unknownForgot.body?.success === true,
    unknownForgot.body,
);
check(
    "unknown email triggers no outbound email",
    !sentEmails.some(e => e.to === `nobody${stamp}@example.com`),
    sentEmails.map(e => e.to),
);
const badCode = await api("/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token: "not-a-real-code", new_password: "NewPass123!" }),
});
check("invalid code rejected", badCode.status === 400, badCode.status);
const setPw = await api("/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token: resetCode, new_password: "BrandNewPass123!" }),
});
check("reset-password with the emailed code -> 200", setPw.status === 200, setPw.body);
const afterSet = await api("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: migratedEmail, password: "BrandNewPass123!" }),
});
check("migrated user can now log in", afterSet.status === 200, afterSet.body);
check(
    "login returns both tokens",
    typeof afterSet.body?.data?.access_token === "string" && typeof afterSet.body?.data?.refresh_token === "string",
    afterSet.body?.data,
);
const replay = await api("/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token: resetCode, new_password: "AnotherPass123!" }),
});
check("reset code is single-use", replay.status === 400, replay.status);
const nowWrongPassword = await api("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: migratedEmail, password: "any-old-password" }),
});
check(
    "no longer reports PASSWORD_RESET_REQUIRED once a password is set",
    nowWrongPassword.body?.error?.code === "LOGIN_FAILED",
    nowWrongPassword.body?.error,
);
console.log(`\n${"─".repeat(46)}\n  passed: ${passed}   failed: ${failed}\n${"─".repeat(46)}\n`);
process.exit(failed > 0 ? 1 : 0);
export {};
