import { Hono } from "hono";
import { createSale, getSales, getSaleById, voidSale, returnSaleProducts } from "../services/saleService";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateSaleSchema, ReturnProductsSchema } from "../validators/sales";

export const saleRoutes = new Hono<AuthContext>();

saleRoutes.use("*", authMiddleware);

saleRoutes.get("/", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const query = {
      page: c.req.query("page") ? parseInt(c.req.query("page")!) : undefined,
      limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
      from: c.req.query("from"),
      to: c.req.query("to"),
      paymentStatus: c.req.query("payment_status"),
      orderType: c.req.query("order_type"),
      customerId: c.req.query("customerId"),
    };
    const result = await getSales(db, businessId, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "SALES_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

saleRoutes.post("/", validate(CreateSaleSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const body = c.get("validatedBody");
    const sale = await createSale(db, businessId, body);
    return c.json({ success: true, data: sale }, 201);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "SALE_CREATION_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

saleRoutes.get("/:id", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const saleId = c.req.param("id");
    const sale = await getSaleById(db, businessId, saleId);
    if (!sale) {
      return c.json({ success: false, error: { code: "SALE_NOT_FOUND", message: "Sale not found" } }, 404);
    }
    return c.json({ success: true, data: sale }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "SALE_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

saleRoutes.post("/:id/returns", validate(ReturnProductsSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const saleId = c.req.param("id");
    const body = c.get("validatedBody");
    const updatedSale = await returnSaleProducts(db, businessId, saleId, body);
    return c.json({ success: true, data: updatedSale }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "RETURN_RECORD_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

saleRoutes.delete("/:id", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const saleId = c.req.param("id");
    const user = c.get("user");
    const result = await voidSale(db, businessId, saleId, user?.id);
    if (result.alreadyVoided) {
      return c.json({ success: false, error: { code: "CONFLICT", message: "Sale already voided" } }, 409);
    }
    return c.json({ success: true, data: { message: "Sale voided" } }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "SALE_VOID_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

saleRoutes.get("/:id/receipt", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const saleId = c.req.param("id");
    const sale = await getSaleById(db, businessId, saleId);
    if (!sale) {
      return c.json({ success: false, error: { code: "SALE_NOT_FOUND", message: "Sale not found" } }, 404);
    }
    return c.json({ success: true, data: sale }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "RECEIPT_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});
