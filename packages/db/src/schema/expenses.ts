import { pgTable, uuid, varchar, decimal, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringFrequency: varchar("recurring_frequency", { length: 50 }),
  dueDate: timestamp("due_date"),
  isPaid: boolean("is_paid").default(true).notNull(),
  reminderDaysBefore: integer("reminder_days_before").default(3),
  incurredAt: timestamp("incurred_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
