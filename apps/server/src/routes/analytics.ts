import { Hono } from "hono";
import { getAnalyticsSummary } from "../services/analyticsService";
import { authMiddleware, type AuthContext } from "../middleware/auth";

export const analyticsRoutes = new Hono<{ Variables: AuthContext }>();

analyticsRoutes.use("*", authMiddleware);

analyticsRoutes.get("/summary", async (c) => {
  try {
    const businessId = c.get("businessId");
    const query = {
      from: c.req.query("from"),
      to: c.req.query("to"),
    };
    const result = await getAnalyticsSummary(businessId, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "ANALYTICS_FETCH_FAILED", message: error.message } }, 400);
  }
});

analyticsRoutes.get("/revenue-chart", async (c) => {
  // To be implemented
  return c.json({ success: true, data: { message: "Revenue chart data" } }, 200);
});

analyticsRoutes.get("/top-customers", async (c) => {
  // To be implemented
  return c.json({ success: true, data: { message: "Top customers" } }, 200);
});
