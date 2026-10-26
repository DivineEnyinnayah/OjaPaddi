import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { businesses } from "./businesses";
const id = () => text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = (name = "created_at") => integer(name, { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
const updatedAt = (name = "updated_at") => integer(name, { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());
export const customers = sqliteTable("customers", {
    id: id(),
    businessId: text("business_id")
        .notNull()
        .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    notes: text("notes"),
    customerType: text("customer_type", { enum: ["individual", "supermarket"] })
        .notNull()
        .default("individual"),
    expectedPaymentPeriodDays: integer("expected_payment_period_days"),
    suppliedProductIds: text("supplied_product_ids", { mode: "json" }).$type().default([]),
    totalSpent: text("total_spent").notNull().default("0"),
    orderCount: integer("order_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
}, (table) => [
    index("customers_business_id_idx").on(table.businessId),
    // Partial unique: a phone number is only unique per business when present.
    uniqueIndex("customers_business_phone_uniq")
        .on(table.businessId, table.phone)
        .where(sql `${table.phone} IS NOT NULL`),
]);
