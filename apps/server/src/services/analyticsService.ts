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
    name: products.name,
    revenue: sql<number>`sum(${saleItems.total})`.as("revenue"),
    quantitySold: sql<number>`sum(${saleItems.quantity})`.as("quantity_sold"),
  })
  .from(saleItems)
  .innerJoin(products, eq(saleItems.productId, products.id))
  .innerJoin(sales, eq(saleItems.saleId, sales.id))
  .where(and(...salesFilters))
  .groupBy(products.name)
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
      name: p.name,
      revenue: Number(p.revenue),
      quantitySold: Number(p.quantitySold)
    })),
    lowStockCount: Number(lowStockData?.count ?? 0),
    totalProducts: Number(totalProductData?.count ?? 0),
  };
}
