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
/**
 * Money is stored as TEXT, never REAL.
 *
 * SQLite has no decimal type; REAL is binary floating point and silently loses
 * precision on currency. Keeping decimals as zero-padded strings matches the
 * previous Postgres `decimal(12,2)` behaviour — services read with
 * `Number(...)` and write with `.toFixed(2)`.
 */
export const products = sqliteTable("products", {
    id: id(),
    businessId: text("business_id")
        .notNull()
        .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sku: text("sku"),
    category: text("category"),
    price: text("price").notNull(),
    costPrice: text("cost_price"),
    quantity: integer("quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    imageUrl: text("image_url"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
}, (table) => [
    index("products_business_id_idx").on(table.businessId),
    index("products_business_category_idx").on(table.businessId, table.category),
    // Partial unique index: SKU is only unique per business when it is set.
    // Without the WHERE clause SQLite treats NULLs as equal and a second
    // product saved without a SKU would collide.
    uniqueIndex("products_business_sku_uniq")
        .on(table.businessId, table.sku)
        .where(sql `${table.sku} IS NOT NULL`),
]);
