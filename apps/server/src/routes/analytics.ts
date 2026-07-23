import { Hono } from "hono";
import { getAnalyticsSummary, getRevenueChart, getTopCustomers } from "../services/analyticsService";
import { getMBARules } from "../services/mbaService";
import { authMiddleware, type AuthContext } from "../middleware/auth";

export const analyticsRoutes = new Hono<AuthContext>();

analyticsRoutes.use("*", authMiddleware);

analyticsRoutes.get("/mba", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const minSupport = c.req.query("minSupport") ? parseFloat(c.req.query("minSupport")!) : 0.1;
    const minConfidence = c.req.query("minConfidence") ? parseFloat(c.req.query("minConfidence")!) : 0.5;

    const result = await getMBARules(db, businessId, minSupport, minConfidence);
    return c.json({ success: true, data: result }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "MBA_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

analyticsRoutes.get("/summary", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const query = {
      from: c.req.query("from"),
      to: c.req.query("to"),
    };
    const result = await getAnalyticsSummary(db, businessId, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "ANALYTICS_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

analyticsRoutes.get("/revenue-chart", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const query = {
      from: c.req.query("from"),
      to: c.req.query("to"),
    };
    const result = await getRevenueChart(db, businessId, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "REVENUE_CHART_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

analyticsRoutes.get("/top-customers", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const query = {
      from: c.req.query("from"),
      to: c.req.query("to"),
      limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
    };
    const result = await getTopCustomers(db, businessId, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "TOP_CUSTOMERS_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});
