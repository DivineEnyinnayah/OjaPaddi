import { Hono } from "hono";
import { getBusinessByUserId, updateBusiness } from "../services/businessService";
import { authMiddleware, type AuthContext } from "../middleware/auth";

export const businessRoutes = new Hono<{ Variables: AuthContext }>();

businessRoutes.use("*", authMiddleware);

businessRoutes.get("/", async (c) => {
  try {
    const businessId = c.get("businessId");
    const business = await getBusinessByUserId(businessId);
    return c.json({ success: true, data: business }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "BUSINESS_FETCH_FAILED", message: error.message } }, 400);
  }
});

businessRoutes.put("/", async (c) => {
  try {
    const businessId = c.get("businessId");
    const body = await c.req.json();
    const business = await updateBusiness(businessId, body);
    return c.json({ success: true, data: business }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "BUSINESS_UPDATE_FAILED", message: error.message } }, 400);
  }
});

businessRoutes.post("/logo", async (c) => {
  return c.json({ success: true, data: { message: "Logo uploaded" } }, 200);
});
