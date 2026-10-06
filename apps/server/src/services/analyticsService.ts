import type { Database } from "@ojapaddi/db";
import { sales, expenses, products, saleItems } from "@ojapaddi/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getRevenueChart(db: Database, businessId: string, query: {
  from?: string;
  to?: string;
}) {
  const { from, to } = query;

  let filters = [eq(sales.businessId, businessId), sql`${sales.voidedAt} IS NULL`];
  if (from) {
    filters.push(sql`${sales.soldAt} >= ${new Date(from)}`);
  }
  if (to) {
    filters.push(sql`${sales.soldAt} <= ${new Date(to)}`);
  }

  const rows = await db.select({
    date: sql<string>`to_char(${sales.soldAt}, 'YYYY-MM-DD')`.as("date"),
    revenue: sql<number>`sum(${sales.total})`.as("revenue"),
    count: sql<number>`count(*)`.as("count"),
  })
  .from(sales)
  .where(and(...filters))
  .groupBy(sql`to_char(${sales.soldAt}, 'YYYY-MM-DD')`)
  .orderBy(sql`date ASC`);

  return rows.map(r => ({
    date: r.date,
    revenue: Number(r.revenue),
    count: Number(r.count),
  }));
}

export async function getTopCustomers(db: Database, businessId: string, query: {
  from?: string;
  to?: string;
  limit?: number;
}) {
  const { from, to, limit = 5 } = query;

  let filters = [eq(sales.businessId, businessId), sql`${sales.voidedAt} IS NULL`];
  if (from) {
    filters.push(sql`${sales.soldAt} >= ${new Date(from)}`);
  }
  if (to) {
    filters.push(sql`${sales.soldAt} <= ${new Date(to)}`);
  }

  const { customers } = await import("@ojapaddi/db/schema");

  const rows = await db.select({
    customerId: sales.customerId,
    name: customers.name,
    phone: customers.phone,
    totalSpent: sql<number>`sum(${sales.total})`.as("total_spent"),
    orderCount: sql<number>`count(*)`.as("order_count"),
  })
  .from(sales)
  .leftJoin(customers, eq(sales.customerId, customers.id))
  .where(and(...filters))
  .groupBy(sales.customerId, customers.name, customers.phone)
  .orderBy(sql`total_spent DESC`)
  .limit(limit);

  return rows.map(r => ({
    customerId: r.customerId,
    name: r.name || "Walk-in Customer",
    phone: r.phone,
    totalSpent: Number(r.totalSpent),
    orderCount: Number(r.orderCount),
  }));
}

export async function getAnalyticsSummary(db: Database, businessId: string, query: {
  from?: string;
  to?: string;
}) {
  const { from, to } = query;

  let salesFilters = [eq(sales.businessId, businessId), sql`${sales.voidedAt} IS NULL`];
  if (from) {
    salesFilters.push(sql`${sales.soldAt} >= ${new Date(from)}`);
  }
  if (to) {
    salesFilters.push(sql`${sales.soldAt} <= ${new Date(to)}`);
  }

  const [salesData] = await db.select({
    totalRevenue: sql<number>`sum(${sales.total})`,
    totalSalesCount: sql<number>`count(*)`,
  }).from(sales).where(and(...salesFilters));

  const [expenseData] = await db.select({
    totalExpenses: sql<number>`sum(${expenses.amount})`,
  }).from(expenses).where(and(eq(expenses.businessId, businessId), sql`${expenses.incurredAt} >= ${from ? new Date(from) : new Date(0)}`, sql`${expenses.incurredAt} <= ${to ? new Date(to) : new Date()}`));

  const totalRevenue = Number(salesData?.totalRevenue ?? 0);
  const totalExpenses = Number(expenseData?.totalExpenses ?? 0);
  const totalSalesCount = Number(salesData?.totalSalesCount ?? 0);

  // Calculate COGS (Cost of Goods Sold) from sale_items
  const [cogsData] = await db.select({
    totalCogs: sql<number>`COALESCE(sum(COALESCE(CAST(${saleItems.costPrice} AS numeric), 0) * ${saleItems.quantity}), 0)`,
  }).from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(...salesFilters));

  const totalCogs = Number(cogsData?.totalCogs ?? 0);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;

  // Top products
  const topProductsResult = await db.select({
    id: products.id,
    name: products.name,
    revenue: sql<number>`sum(${saleItems.total})`.as("revenue"),
    quantitySold: sql<number>`sum(${saleItems.quantity} - ${saleItems.returnedQuantity})`.as("quantity_sold"),
    returnsCount: sql<number>`sum(${saleItems.returnedQuantity})`.as("returns_count"),
  })
  .from(saleItems)
  .innerJoin(products, eq(saleItems.productId, products.id))
  .innerJoin(sales, eq(saleItems.saleId, sales.id))
  .where(and(...salesFilters))
  .groupBy(products.id, products.name)
  .orderBy(sql`revenue DESC`)
  .limit(5);

  // Low stock count
  const [lowStockData] = await db.select({
    count: sql<number>`count(*)`
  }).from(products).where(and(eq(products.businessId, businessId), sql`${products.quantity} <= ${products.lowStockThreshold}`));

  // Total product count
  const [totalProductData] = await db.select({
    count: sql<number>`count(*)`
  }).from(products).where(eq(products.businessId, businessId));

  return {
    totalRevenue,
    totalSalesCount,
    totalExpenses,
    totalCogs,
    grossProfit,
    netProfit,
    topProducts: topProductsResult.map(p => ({
      id: p.id,
      name: p.name,
      revenue: Number(p.revenue),
      quantitySold: Number(p.quantitySold),
      returnsCount: Number(p.returnsCount || 0),
    })),
    lowStockCount: Number(lowStockData?.count ?? 0),
    totalProducts: Number(totalProductData?.count ?? 0),
  };
}

export async function getProductAnalytics(db: Database, businessId: string, productId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.businessId, businessId)));

  if (!product) {
    throw new Error("Product not found");
  }

  const [stats] = await db
    .select({
      totalSold: sql<number>`COALESCE(sum(${saleItems.quantity} - ${saleItems.returnedQuantity}), 0)`,
      totalReturned: sql<number>`COALESCE(sum(${saleItems.returnedQuantity}), 0)`,
      grossRevenue: sql<number>`COALESCE(sum(CAST(${saleItems.unitPrice} AS numeric) * ${saleItems.quantity}), 0)`,
      netRevenue: sql<number>`COALESCE(sum(CAST(${saleItems.unitPrice} AS numeric) * (${saleItems.quantity} - ${saleItems.returnedQuantity})), 0)`,
      orderCount: sql<number>`count(distinct ${saleItems.saleId})`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(eq(saleItems.productId, productId), eq(sales.businessId, businessId), sql`${sales.voidedAt} IS NULL`));

  return {
    product,
    totalSold: Number(stats?.totalSold ?? 0),
    totalReturned: Number(stats?.totalReturned ?? 0),
    grossRevenue: Number(stats?.grossRevenue ?? 0),
    netRevenue: Number(stats?.netRevenue ?? 0),
    orderCount: Number(stats?.orderCount ?? 0),
  };
}

export async function getSupermarketAnalytics(db: Database, businessId: string, supermarketId: string) {
  const [supermarket] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, supermarketId), eq(customers.businessId, businessId)));

  if (!supermarket) {
    throw new Error("Supermarket not found");
  }

  const [salesSummary] = await db
    .select({
      totalOrders: sql<number>`count(*)`,
      totalBilled: sql<number>`COALESCE(sum(${sales.subtotal} - ${sales.discount}), 0)`,
      totalPaid: sql<number>`COALESCE(sum(${sales.amountPaid}), 0)`,
      totalReturnsAmount: sql<number>`COALESCE(sum(${sales.returnedAmount}), 0)`,
      netReceivable: sql<number>`COALESCE(sum(GREATEST(0, CAST(${sales.total} AS numeric) - CAST(${sales.amountPaid} AS numeric))), 0)`,
    })
    .from(sales)
    .where(and(eq(sales.customerId, supermarketId), eq(sales.businessId, businessId), sql`${sales.voidedAt} IS NULL`));

  // Top products supplied to this supermarket
  const topProductsSupplied = await db
    .select({
      productId: saleItems.productId,
      productName: saleItems.productName,
      quantitySupplied: sql<number>`sum(${saleItems.quantity})`,
      quantityReturned: sql<number>`sum(${saleItems.returnedQuantity})`,
      netDelivered: sql<number>`sum(${saleItems.quantity} - ${saleItems.returnedQuantity})`,
      totalValue: sql<number>`sum(CAST(${saleItems.unitPrice} AS numeric) * (${saleItems.quantity} - ${saleItems.returnedQuantity}))`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(eq(sales.customerId, supermarketId), eq(sales.businessId, businessId), sql`${sales.voidedAt} IS NULL`))
    .groupBy(saleItems.productId, saleItems.productName)
    .orderBy(sql`totalValue DESC`);

  return {
    supermarket,
    totalOrders: Number(salesSummary?.totalOrders ?? 0),
    totalBilled: Number(salesSummary?.totalBilled ?? 0),
    totalPaid: Number(salesSummary?.totalPaid ?? 0),
    totalReturnsAmount: Number(salesSummary?.totalReturnsAmount ?? 0),
    netReceivable: Number(salesSummary?.netReceivable ?? 0),
    productsSupplied: topProductsSupplied.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      quantitySupplied: Number(p.quantitySupplied),
      quantityReturned: Number(p.quantityReturned),
      netDelivered: Number(p.netDelivered),
      totalValue: Number(p.totalValue),
    })),
  };
}
