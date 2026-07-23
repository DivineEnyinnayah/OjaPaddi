import { Hono } from "hono";
import { getReceiptShareData, getProductShareData } from "../services/shareService";
import { authMiddleware, type AuthContext } from "../middleware/auth";

export const shareRoutes = new Hono<AuthContext>();

shareRoutes.use("*", authMiddleware);

shareRoutes.get("/receipt/:sale_id", async (c) => {
  try {
    const db = c.get("db");
    const saleId = c.req.param("sale_id");
    const businessId = c.get("businessId");
    const data = await getReceiptShareData(db, saleId, businessId);
    return c.json({ success: true, data }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "RECEIPT_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 404);
  }
});

shareRoutes.get("/product/:product_id", async (c) => {
  try {
    const db = c.get("db");
    const productId = c.req.param("product_id");
    const businessId = c.get("businessId");
    const data = await getProductShareData(db, productId, businessId);
    return c.json({ success: true, data }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "PRODUCT_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 404);
  }
});
