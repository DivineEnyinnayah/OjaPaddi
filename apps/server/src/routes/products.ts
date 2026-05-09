import { Hono } from "hono";
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, adjustStock, getCategories } from "../services/productService";
import { authMiddleware, type AuthContext } from "../middleware/auth";

export const productRoutes = new Hono<{ Variables: AuthContext }>();

productRoutes.use("*", authMiddleware);

productRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const query = {
      page: c.req.query("page") ? parseInt(c.req.query("page")!) : undefined,
      limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
      category: c.req.query("category"),
      search: c.req.query("search"),
      lowStock: c.req.query("low_stock") === "true",
    };
    const result = await getProducts(user.id, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "PRODUCTS_FETCH_FAILED", message: error.message } }, 400);
  }
});

productRoutes.post("/", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const product = await createProduct(user.id, body);
    return c.json({ success: true, data: product }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "PRODUCT_CREATION_FAILED", message: error.message } }, 400);
  }
});

productRoutes.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const productId = c.req.param("id");
    const product = await getProductById(user.id, productId);
    if (!product) {
      return c.json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } }, 404);
    }
    return c.json({ success: true, data: product }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "PRODUCT_FETCH_FAILED", message: error.message } }, 400);
  }
});

productRoutes.put("/:id", async (c) => {
  try {
    const user = c.get("user");
    const productId = c.req.param("id");
    const body = await c.req.json();
    const product = await updateProduct(user.id, productId, body);
    return c.json({ success: true, data: product }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "PRODUCT_UPDATE_FAILED", message: error.message } }, 400);
  }
});

productRoutes.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const productId = c.req.param("id");
    await deleteProduct(user.id, productId);
    return c.json({ success: true, data: { message: "Product deleted" } }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "PRODUCT_DELETE_FAILED", message: error.message } }, 400);
  }
});

productRoutes.post("/:id/image", async (c) => {
  // This will be implemented with Supabase Storage
  return c.json({ success: true, data: { message: "Product image uploaded" } }, 200);
});

productRoutes.patch("/:id/stock", async (c) => {
  try {
    const user = c.get("user");
    const productId = c.req.param("id");
    const body = await c.req.json();
    const product = await adjustStock(user.id, productId, body.quantity);
    return c.json({ success: true, data: product }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "STOCK_ADJUST_FAILED", message: error.message } }, 400);
  }
});

productRoutes.get("/categories", async (c) => {
  try {
    const user = c.get("user");
    const categories = await getCategories(user.id);
    return c.json({ success: true, data: { categories } }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "CATEGORIES_FETCH_FAILED", message: error.message } }, 400);
  }
});
