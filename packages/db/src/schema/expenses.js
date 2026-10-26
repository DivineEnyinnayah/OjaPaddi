import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { businesses } from "./businesses";
const id = () => text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = (name = "created_at") => integer(name, { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
export const expenses = sqliteTable("expenses", {
    id: id(),
    businessId: text("business_id")
        .notNull()
        .references(() => businesses.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: text("amount").notNull(),
    category: text("category"),
    isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
    recurringFrequency: text("recurring_frequency"),
    dueDate: integer("due_date", { mode: "timestamp_ms" }),
    isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(true),
    reminderDaysBefore: integer("reminder_days_before").default(3),
    incurredAt: integer("incurred_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
}, (table) => [
    index("expenses_business_id_idx").on(table.businessId),
    index("expenses_business_incurred_at_idx").on(table.businessId, table.incurredAt),
]);
