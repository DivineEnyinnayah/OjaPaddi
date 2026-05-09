import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, decimal, integer, boolean, uuid, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const planEnum = pgEnum("plan", ["free", "pro", "growth"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "transfer", "pos", "other"]);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "partial", "unpaid"]);

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  logoUrl: text("logo_url"),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").default("Nigeria").notNull(),
  currency: text("currency").default("NGN").notNull(),
  whatsappNumber: text("whatsapp_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku"),
  category: text("category"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 12, scale: 2 }),
  quantity: integer("quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0").notNull(),
  orderCount: integer("order_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id),
  reference: text("reference").notNull().unique(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("paid").notNull(),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  soldAt: timestamp("sold_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(), // snapshot
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(), // snapshot
  costPrice: decimal("cost_price", { precision: 12, scale: 2 }), // snapshot
  quantity: integer("quantity").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category"),
  incurredAt: timestamp("incurred_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const businessRelations = relations(businesses, ({ one, many }) => ({
  user: one(user, { fields: [businesses.userId], references: [user.id] }),
  products: many(products),
  customers: many(customers),
  sales: many(sales),
  expenses: many(expenses),
}));

export const productRelations = relations(products, ({ one }) => ({
  business: one(businesses, { fields: [products.businessId], references: [businesses.id] }),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  business: one(businesses, { fields: [customers.businessId], references: [businesses.id] }),
  sales: many(sales),
}));

export const saleRelations = relations(sales, ({ one, many }) => ({
  business: one(businesses, { fields: [sales.businessId], references: [businesses.id] }),
  customer: one(customers, { fields: [sales.customerId], references: [customers.id] }),
  items: many(saleItems),
}));

export const saleItemRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, { fields: [saleItems.productId], references: [products.id] }),
}));

export const expenseRelations = relations(expenses, ({ one }) => ({
  business: one(businesses, { fields: [expenses.businessId], references: [businesses.id] }),
}));
