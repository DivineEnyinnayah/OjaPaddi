import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { businesses } from "./businesses";
import { customers } from "./customers";
const id = () => text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = (name = "created_at") => integer(name, { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
export const sales = sqliteTable("sales", {
    id: id(),
    businessId: text("business_id")
        .notNull()
        .references(() => businesses.id, { onDelete: "cascade" }),
    // Matches the previous Postgres ON DELETE SET NULL.
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    reference: text("reference").notNull().unique(),
    orderType: text("order_type", { enum: ["customer", "supermarket"] }).notNull().default("customer"),
    expectedPaymentDate: integer("expected_payment_date", { mode: "timestamp_ms" }),
    subtotal: text("subtotal").notNull(),
    discount: text("discount").notNull().default("0"),
    returnedAmount: text("returned_amount").notNull().default("0"),
    total: text("total").notNull(),
    paymentMethod: text("payment_method", {
        enum: ["cash", "transfer", "pos", "cheque", "other"],
    }).notNull(),
    paymentStatus: text("payment_status", { enum: ["paid", "partial", "unpaid"] })
        .notNull()
        .default("paid"),
    amountPaid: text("amount_paid").notNull(),
    notes: text("notes"),
    soldAt: integer("sold_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    voidedAt: integer("voided_at", { mode: "timestamp_ms" }),
    voidedBy: text("voided_by"),
}, (table) => [
    index("sales_business_id_idx").on(table.businessId),
    index("sales_business_sold_at_idx").on(table.businessId, table.soldAt),
    index("sales_business_customer_idx").on(table.businessId, table.customerId),
]);
