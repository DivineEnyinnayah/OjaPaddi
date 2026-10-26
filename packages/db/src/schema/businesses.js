import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
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
export const businesses = sqliteTable("businesses", {
    id: id(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    description: text("description"),
    category: text("category"),
    logoUrl: text("logo_url"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    country: text("country").notNull().default("Nigeria"),
    currency: text("currency").notNull().default("NGN"),
    whatsappNumber: text("whatsapp_number"),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
}, (table) => [index("businesses_user_id_idx").on(table.userId), index("businesses_slug_idx").on(table.slug)]);
