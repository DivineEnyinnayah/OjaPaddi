import { products, customers } from "@ojapaddi/db/schema";
import { eq, and, sql } from "drizzle-orm";
const FREE_LIMITS = { products: 50, customers: 100 };
export async function checkProductLimit(db, businessId) {
    // TODO: Check user's plan from users table; skip check for paid plans
    const result = await db
        .select({ count: sql `count(*)` })
        .from(products)
        .where(and(eq(products.businessId, businessId), eq(products.isActive, true)));
    if (Number(result[0]?.count ?? 0) >= FREE_LIMITS.products) {
        const err = new Error(`Free plan limited to ${FREE_LIMITS.products} products. Upgrade to add more.`);
        err.code = "PLAN_LIMIT_REACHED";
        throw err;
    }
}
export async function checkCustomerLimit(db, businessId) {
    const result = await db
        .select({ count: sql `count(*)` })
        .from(customers)
        .where(eq(customers.businessId, businessId));
    if (Number(result[0]?.count ?? 0) >= FREE_LIMITS.customers) {
        const err = new Error(`Free plan limited to ${FREE_LIMITS.customers} customers. Upgrade to add more.`);
        err.code = "PLAN_LIMIT_REACHED";
        throw err;
    }
}
