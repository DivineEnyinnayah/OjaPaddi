import { Hono } from "hono";
import { getReceiptShareData, getProductShareData } from "../services/shareService";

export const shareRoutes = new Hono();

shareRoutes.get("/receipt/:sale_id", async (c) => {
  try {
    const saleId = c.req.param("sale_id");
    const data = await getReceiptShareData(saleId);
    return c.json({ success: true, data }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "RECEIPT_FETCH_FAILED", message: error.message } }, 404);
  }
});

shareRoutes.get("/product/:product_id", async (c) => {
  try {
    const productId = c.req.param("product_id");
    const data = await getProductShareData(productId);
    return c.json({ success: true, data }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "PRODUCT_FETCH_FAILED", message: error.message } }, 404);
  }
});
