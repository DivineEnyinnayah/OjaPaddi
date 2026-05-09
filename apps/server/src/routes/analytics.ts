import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { createDb } from "@ojapaddi/db";
import { sales, expenses, businesses, products, saleItems } from "@ojapaddi/db/schema";
import { eq, and, sql, sum, count, gte, lte } from "drizzle-orm";
import type { HonoEnv } from "../types";
import type { Context } from "hono";

const analyticsRoutes = new Hono<HonoEnv>();

analyticsRoutes.use("/*", authMiddleware);

const getBusiness = async (c: Context<HonoEnv>) => {
  const user = c.get("user");
  const db = createDb();
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
  });
  return business;
};

analyticsRoutes.get("/summary", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const db = createDb();
  const query = c.req.query();
  const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to) : new Date();

  // Total Revenue
  const salesSummary = await db.select({
    totalRevenue: sum(sales.total),
    salesCount: count(sales.id),
  }).from(sales).where(and(
    eq(sales.businessId, business.id),
    gte(sales.soldAt, from),
    lte(sales.soldAt, to)
  ));

  // Total Expenses
  const expensesSummary = await db.select({
    totalExpenses: sum(expenses.amount),
  }).from(expenses).where(and(
    eq(expenses.businessId, business.id),
    gte(expenses.incurredAt, from),
    lte(expenses.incurredAt, to)
  ));

  // Total Profit (Revenue - Cost Price of items sold)
  const profitSummary = await db.select({
    totalCost: sum(sql`${saleItems.costPrice} * ${saleItems.quantity}`),
  }).from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(
      eq(sales.businessId, business.id),
      gte(sales.soldAt, from),
      lte(sales.soldAt, to)
    ));

  const revenue = parseFloat(salesSummary[0]?.totalRevenue || "0");
  const expense = parseFloat(expensesSummary[0]?.totalExpenses || "0");
  const cost = parseFloat(profitSummary[0]?.totalCost || "0");
  const salesCount = salesSummary[0]?.salesCount || 0;

  const totalProfit = revenue - cost;
  const netProfit = totalProfit - expense;

  // Top Products
  const topProducts = await db.select({
    productId: saleItems.productId,
    name: saleItems.productName,
    quantitySold: sum(saleItems.quantity),
    revenue: sum(saleItems.total),
  }).from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(
      eq(sales.businessId, business.id),
      gte(sales.soldAt, from),
      lte(sales.soldAt, to)
    ))
    .groupBy(saleItems.productId, saleItems.productName)
    .orderBy(sql`sum(${saleItems.quantity}) desc`)
    .limit(5);

  // Low Stock Count
  const lowStockCountResult = await db.select({
    count: count(products.id),
  }).from(products).where(and(
    eq(products.businessId, business.id),
    eq(products.isActive, true),
    sql`${products.quantity} <= ${products.lowStockThreshold}`
  ));

  return c.json({
    success: true,
    data: {
      total_revenue: revenue,
      total_profit: totalProfit,
      total_expenses: expense,
      net_profit: netProfit,
      total_sales_count: salesCount,
      avg_order_value: salesCount > 0 ? revenue / salesCount : 0,
      top_products: topProducts,
      low_stock_count: lowStockCountResult[0]?.count || 0,
    }
  });
});

export default analyticsRoutes;
