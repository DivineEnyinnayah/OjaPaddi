import { pgTable, uuid, varchar, text, integer, boolean, timestamp, decimal, uniqueIndex } from "drizzle-orm/pg-core";
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
    skuBusinessIdx: uniqueIndex("sku_business_idx").on(table.businessId, table.sku),
  })
);
