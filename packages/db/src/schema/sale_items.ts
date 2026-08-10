import { pgTable, uuid, varchar, decimal, integer } from "drizzle-orm/pg-core";
import { sales } from "./sales";
import { products } from "./products";

export const saleItems = pgTable("sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 12, scale: 2 }),
  quantity: integer("quantity").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
});
