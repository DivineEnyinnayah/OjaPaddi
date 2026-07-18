import { pgTable, uuid, varchar, decimal, timestamp } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  incurredAt: timestamp("incurred_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
