import { pgTable, uuid, varchar, text, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import { customers } from "./customers";

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "transfer", "pos", "other"]);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "partial", "unpaid"]);

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "set null" }),
  reference: varchar("reference", { length: 100 }).notNull().unique(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("paid").notNull(),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  soldAt: timestamp("sold_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
