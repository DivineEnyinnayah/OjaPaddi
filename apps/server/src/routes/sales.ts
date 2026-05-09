import { Hono } from "hono";
import { createSale, getSales, getSaleById, voidSale } from "../services/saleService";
import { authMiddleware, type AuthContext } from "../middleware/auth";

export const saleRoutes = new Hono<{ Variables: AuthContext }>();

saleRoutes.use("*", authMiddleware);

saleRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const query = {
      page: c.req.query("page") ? parseInt(c.req.query("page")!) : undefined,
      limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
      from: c.req.query("from"),
      to: c.req.query("to"),
      paymentStatus: c.req.query("payment_status"),
    };
    const result = await getSales(user.id, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "SALES_FETCH_FAILED", message: error.message } }, 400);
  }
});

saleRoutes.post("/", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const sale = await createSale(user.id, body);
    return c.json({ success: true, data: sale }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "SALE_CREATION_FAILED", message: error.message } }, 400);
  }
});

saleRoutes.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const saleId = c.req.param("id");
    const sale = await getSaleById(user.id, saleId);
    if (!sale) {
      return c.json({ success: false, error: { code: "SALE_NOT_FOUND", message: "Sale not found" } }, 404);
    }
    return c.json({ success: true, data: sale }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "SALE_FETCH_FAILED", message: error.message } }, 400);
  }
});

saleRoutes.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const saleId = c.req.param("id");
    await voidSale(user.id, saleId);
    return c.json({ success: true, data: { message: "Sale voided" } }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "SALE_VOID_FAILED", message: error.message } }, 400);
  }
});

saleRoutes.get("/:id/receipt", async (c) => {
  // This will be implemented with PDF generation
  return c.json({ success: true, data: { message: "Receipt data" } }, 200);
});
