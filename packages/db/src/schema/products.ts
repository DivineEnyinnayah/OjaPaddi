import { pgTable, uuid, varchar, text, integer, boolean, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { businesses } from "./businesses";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    sku: varchar("sku", { length: 100 }),
    category: varchar("category", { length: 100 }),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    costPrice: decimal("cost_price", { precision: 12, scale: 2 }),
    quantity: integer("quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
    imageUrl: varchar("image_url", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Partial unique index: only enforce SKU uniqueness per business when SKU is not null.
    // Without WHERE, PostgreSQL treats NULL = NULL in unique indexes, causing a constraint
    // violation whenever a second product is added without a SKU.
    skuBusinessIdx: index("sku_business_idx")
      .on(table.businessId, table.sku)
      .where(sql`${table.sku} IS NOT NULL`),
  })
);

export const activeProducts = products;
