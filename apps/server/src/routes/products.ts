import { Hono } from "hono";
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, adjustStock, getCategories } from "../services/productService";
import { uploadFile } from "../services/storageService";
import { type AuthContext } from "../middleware/auth";
import { env } from "@ojapaddi/env/server";

export const productRoutes = new Hono<{ Variables: AuthContext }>();

productRoutes.get("/", async (c) => {
  try {
    const businessId = c.get("businessId");
    const query = {
      page: c.req.query("page") ? parseInt(c.req.query("page")!) : undefined,
      limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
      category: c.req.query("category"),
      search: c.req.query("search"),
      lowStock: c.req.query("low_stock") === "true",
    };
    const result = await getProducts(businessId, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "PRODUCTS_FETCH_FAILED", message: error.message } }, 400);
  }
});

productRoutes.post("/", async (c) => {
  try {
    const businessId = c.get("businessId");
    const body = await c.req.json();
    const product = await createProduct(businessId, body);
    return c.json({ success: true, data: product }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "PRODUCT_CREATION_FAILED", message: error.message } }, 400);
  }
});

productRoutes.get("/:id", async (c) => {
  try {
    const businessId = c.get("businessId");
    const productId = c.req.param("id");
    const product = await getProductById(businessId, productId);
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
    const businessId = c.get("businessId");
    const productId = c.req.param("id");
    const body = await c.req.json();
    const product = await updateProduct(businessId, productId, body);
    return c.json({ success: true, data: product }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "PRODUCT_UPDATE_FAILED", message: error.message } }, 400);
  }
});

productRoutes.delete("/:id", async (c) => {
  try {
    const businessId = c.get("businessId");
    const productId = c.req.param("id");
    await deleteProduct(businessId, productId);
    return c.json({ success: true, data: { message: "Product deleted" } }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "PRODUCT_DELETE_FAILED", message: error.message } }, 400);
  }
});

productRoutes.post("/:id/image", async (c) => {
  try {
    const businessId = c.get("businessId");
    const productId = c.req.param("id");

    const product = await getProductById(businessId, productId);
    if (!product) {
      return c.json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } }, 404);
    }

    const body = await c.req.parseBody();
    const file = body.image as File;

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Image file is required" } }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type;

    const filename = `${productId}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = `products/${businessId}/${filename}`;

    await uploadFile("products", filePath, buffer, contentType);

    const imageUrl = `${env.SUPABASE_STORAGE_URL}/storage/v1/object/public/products/${filePath}`;

    const updatedProduct = await updateProduct(businessId, productId, { imageUrl });

    return c.json({ success: true, data: updatedProduct }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "IMAGE_UPLOAD_FAILED", message: error.message } }, 400);
  }
});

productRoutes.patch("/:id/stock", async (c) => {
  try {
    const businessId = c.get("businessId");
    const productId = c.req.param("id");
    const body = await c.req.json();
    const product = await adjustStock(businessId, productId, body.quantity);
    return c.json({ success: true, data: product }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "STOCK_ADJUST_FAILED", message: error.message } }, 400);
  }
});

productRoutes.get("/categories", async (c) => {
  try {
    const businessId = c.get("businessId");
    const categories = await getCategories(businessId);
    return c.json({ success: true, data: { categories } }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "CATEGORIES_FETCH_FAILED", message: error.message } }, 400);
  }
});
