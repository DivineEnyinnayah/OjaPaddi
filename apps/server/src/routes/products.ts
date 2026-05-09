import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { createDb } from "@ojapaddi/db";
import { products, businesses } from "@ojapaddi/db/schema";
import { eq, and } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { HonoEnv } from "../types";
import type { Context } from "hono";

const productRoutes = new Hono<HonoEnv>();

productRoutes.use("/*", authMiddleware);

const getBusiness = async (c: Context<HonoEnv>) => {
  const user = c.get("user");
  const db = createDb();
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
  });
  return business;
};

productRoutes.get("/", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const db = createDb();
  const query = c.req.query();
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "20");
  const offset = (page - 1) * limit;

  const result = await db.query.products.findMany({
    where: and(
      eq(products.businessId, business.id),
      eq(products.isActive, true)
    ),
    limit,
    offset,
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });

  return c.json({ success: true, data: result });
});

productRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      sku: z.string().optional(),
      category: z.string().optional(),
      price: z.number().or(z.string()),
      costPrice: z.number().or(z.string()).optional(),
      quantity: z.number().int().default(0),
      lowStockThreshold: z.number().int().default(5),
    })
  ),
  async (c) => {
    const business = await getBusiness(c);
    if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

    const data = c.req.valid("json");
    const db = createDb();

    const [newProduct] = await db.insert(products).values({
      ...data,
      price: data.price.toString(),
      costPrice: data.costPrice?.toString(),
      businessId: business.id,
    }).returning();

    if (!newProduct) {
      return c.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create product" } }, 500);
    }

    return c.json({ success: true, data: newProduct }, 201);
  }
);

productRoutes.get("/:id", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const id = c.req.param("id");
  const db = createDb();
  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, id),
      eq(products.businessId, business.id)
    ),
  });

  if (!product) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Product not found" } }, 404);

  return c.json({ success: true, data: product });
});

productRoutes.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      sku: z.string().optional(),
      category: z.string().optional(),
      price: z.number().or(z.string()),
      costPrice: z.number().or(z.string()).optional(),
      quantity: z.number().int(),
      lowStockThreshold: z.number().int(),
      isActive: z.boolean().optional(),
    })
  ),
  async (c) => {
    const business = await getBusiness(c);
    if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

    const id = c.req.param("id");
    const data = c.req.valid("json");
    const db = createDb();

    const [updatedProduct] = await db.update(products).set({
      ...data,
      price: data.price.toString(),
      costPrice: data.costPrice?.toString(),
    }).where(and(
      eq(products.id, id),
      eq(products.businessId, business.id)
    )).returning();

    if (!updatedProduct) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Product not found" } }, 404);

    return c.json({ success: true, data: updatedProduct });
  }
);

productRoutes.delete("/:id", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const id = c.req.param("id");
  const db = createDb();
  await db.update(products).set({ isActive: false }).where(and(
    eq(products.id, id),
    eq(products.businessId, business.id)
  ));

  return c.json({ success: true, data: { message: "Product deleted" } });
});

export default productRoutes;
