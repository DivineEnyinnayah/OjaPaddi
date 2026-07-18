import { pgTable, uuid, varchar, text, decimal, integer, timestamp } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  notes: text("notes"),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0").notNull(),
  orderCount: integer("order_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
