import { Hono } from "hono";
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, adjustStock, getCategories } from "../services/productService";
import { uploadFile, validateImageFile } from "../services/storageService";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateProductSchema, UpdateProductSchema, AdjustStockSchema } from "../validators/products";
import { checkProductLimit } from "../middleware/planLimits";

export const productRoutes = new Hono<AuthContext>();

productRoutes.use("*", authMiddleware);

productRoutes.get("/", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const query = {
      page: c.req.query("page") ? parseInt(c.req.query("page")!) : undefined,
      limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
      category: c.req.query("category"),
      search: c.req.query("search"),
      lowStock: c.req.query("low_stock") === "true",
    };
    const result = await getProducts(db, businessId, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "PRODUCTS_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

productRoutes.post("/", validate(CreateProductSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");

    if (!businessId || typeof businessId !== "string") {
      console.error("POST /products - businessId missing or invalid:", businessId);
      return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Business ID not found in context" } }, 401);
    }

    await checkProductLimit(db, businessId);
    const body = c.get("validatedBody");

    const product = await createProduct(db, businessId, body);
    return c.json({ success: true, data: product }, 201);
  } catch (error: unknown) {
    console.error("POST /products error:", error);
    const code = (error as any)?.code || "PRODUCT_CREATION_FAILED";
    const status = code === "PLAN_LIMIT_REACHED" ? 403 : 400;
    return c.json({ success: false, error: { code, message: error instanceof Error ? error.message : String(error) } }, status);
  }
});

productRoutes.get("/categories", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const categories = await getCategories(db, businessId);
    return c.json({ success: true, data: { categories } }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "CATEGORIES_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

productRoutes.get("/:id", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const productId = c.req.param("id");
    const product = await getProductById(db, businessId, productId);
    if (!product) {
      return c.json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } }, 404);
    }
    return c.json({ success: true, data: product }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "PRODUCT_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

productRoutes.put("/:id", validate(UpdateProductSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const productId = c.req.param("id");
    const body = c.get("validatedBody");
    const product = await updateProduct(db, businessId, productId, body);
    return c.json({ success: true, data: product }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "PRODUCT_UPDATE_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

productRoutes.delete("/:id", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const productId = c.req.param("id");
    await deleteProduct(db, businessId, productId);
    return c.json({ success: true, data: { message: "Product deleted" } }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "PRODUCT_DELETE_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

productRoutes.post("/:id/image", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const productId = c.req.param("id");

    const product = await getProductById(db, businessId, productId);
    if (!product) {
      return c.json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } }, 404);
    }

    const body = await c.req.parseBody();
    const file = body.image as File;

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Image file is required" } }, 400);
    }

    validateImageFile(file);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type;

    const filename = `${productId}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = `products/${businessId}/${filename}`;

    await uploadFile("products", filePath, buffer, contentType);
    // Store the storage path (short, permanent) — resolve to signed URL on read
    const updatedProduct = await updateProduct(db, businessId, productId, { imageUrl: filePath });

    return c.json({ success: true, data: updatedProduct }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "IMAGE_UPLOAD_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

productRoutes.patch("/:id/stock", validate(AdjustStockSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const productId = c.req.param("id");
    const body = c.get("validatedBody");
    const product = await adjustStock(db, businessId, productId, body.quantity);
    return c.json({ success: true, data: product }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "STOCK_ADJUST_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});
