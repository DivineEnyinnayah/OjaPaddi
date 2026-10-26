import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sales } from "./sales";
import { products } from "./products";
const id = () => text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
/**
 * `productName` / `costPrice` are deliberate price snapshots, not joins back to
 * `products`. Historical sales must keep reporting the price that was actually
 * charged even after the product is renamed or repriced.
 */
export const saleItems = sqliteTable("sale_items", {
    id: id(),
    saleId: text("sale_id")
        .notNull()
        .references(() => sales.id, { onDelete: "cascade" }),
    // Matches the previous Postgres ON DELETE SET NULL.
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    unitPrice: text("unit_price").notNull(),
    costPrice: text("cost_price"),
    quantity: integer("quantity").notNull(),
    returnedQuantity: integer("returned_quantity").notNull().default(0),
    total: text("total").notNull(),
}, (table) => [
    index("sale_items_sale_id_idx").on(table.saleId),
    index("sale_items_product_id_idx").on(table.productId),
]);
