import { db } from "@ojapaddi/db";
import { sales, expenses, products, saleItems } from "@ojapaddi/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getAnalyticsSummary(businessId: string, query: {
  from?: string;
  to?: string;
}) {
  const { from, to } = query;

  let salesFilters = [eq(sales.businessId, businessId)];
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
  const netProfit = totalRevenue - totalExpenses;

  // Top products
  const topProductsResult = await db.select({
    name: products.name,
    revenue: sql<number>`sum(${saleItems.total})`,
    quantitySold: sql<number>`sum(${saleItems.quantity})`,
  })
  .from(saleItems)
  .innerJoin(products, eq(saleItems.productId, products.id))
  .innerJoin(sales, eq(saleItems.saleId, sales.id))
  .where(and(eq(sales.businessId, businessId), ...salesFilters))
  .groupBy(products.name)
  .orderBy(sql`revenue DESC`)
  .limit(5);

  // Low stock count
  const [lowStockData] = await db.select({
    count: sql<number>`count(*)`
  }).from(products).where(and(eq(products.businessId, businessId), sql`${products.quantity} <= ${products.lowStockThreshold}`));

  return {
    totalRevenue,
    totalSalesCount,
    totalExpenses,
    netProfit,
    topProducts: topProductsResult.map(p => ({
      name: p.name,
      revenue: Number(p.revenue),
      quantitySold: Number(p.quantitySold)
    })),
    lowStockCount: Number(lowStockData?.count ?? 0),
  };
}
