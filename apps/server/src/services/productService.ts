import type { Database } from "@ojapaddi/db";
import { products } from "@ojapaddi/db/schema";
import { eq, and, like, sql } from "drizzle-orm";
import { resolveImageUrl } from "./storageService";

/** Resolve storage paths to signed URLs for a single product */
async function withResolvedUrl(product: any) {
  if (!product) return product;
  return { ...product, imageUrl: await resolveImageUrl(product.imageUrl) };
}

/** Resolve storage paths to signed URLs for an array of products */
async function withResolvedUrls(productList: any[]) {
  return Promise.all(productList.map(withResolvedUrl));
}

export async function getProducts(db: Database, businessId: string, query: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  lowStock?: boolean;
}) {
  const { page = 1, limit = 20, category, search, lowStock } = query;
  const offset = (page - 1) * limit;

  let filters = [eq(products.businessId, businessId), eq(products.isActive, true)];

  if (category) {
    filters.push(eq(products.category, category));
  }

  if (search) {
    filters.push(like(products.name, `%${search}%`));
  }

  if (lowStock) {
    filters.push(sql`${products.quantity} <= ${products.lowStockThreshold}`);
  }

  const result = await db.select().from(products).where(and(...filters)).limit(limit).offset(offset);
  const total = await db.select({ count: sql<number>`count(*)` }).from(products).where(and(...filters));

  return {
    products: await withResolvedUrls(result),
    pagination: {
      total: Number(total[0]?.count ?? 0),
      page,
      limit,
    },
  };
}

export async function getProductById(db: Database, businessId: string, productId: string) {
  const productList = await db.select().from(products).where(and(eq(products.id, productId), eq(products.businessId, businessId), eq(products.isActive, true)));
  return withResolvedUrl(productList[0] || null);
}

export async function createProduct(db: Database, businessId: string, data: {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  price: number;
  costPrice?: number;
  quantity: number;
  lowStockThreshold?: number;
  imageUrl?: string;
}) {
  console.log("DEBUG: createProduct called with businessId:", businessId, "type:", typeof businessId);
  if (!businessId || typeof businessId !== "string") {
    throw new Error(`Missing or invalid businessId for product creation. Received: ${JSON.stringify(businessId)}`);
  }
  try {
    console.log("DEBUG: Data for insert:", JSON.stringify({
      businessId,
      name: data.name,
      description: data.description || null,
      sku: (data.sku && data.sku.trim() !== "") ? data.sku.trim() : null,
      category: data.category || null,
      price: data.price.toString(),
      costPrice: data.costPrice?.toString() || null,
      quantity: data.quantity,
      lowStockThreshold: data.lowStockThreshold ?? 5,
      imageUrl: data.imageUrl || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const [newProduct] = await db.insert(products).values({
      businessId,
      name: data.name,
      description: data.description || null,
      sku: (data.sku && data.sku.trim() !== "") ? data.sku.trim() : null,
      category: data.category || null,
      price: data.price.toString(),
      costPrice: data.costPrice?.toString() || null,
      quantity: data.quantity,
      lowStockThreshold: data.lowStockThreshold ?? 5,
      imageUrl: data.imageUrl || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return withResolvedUrl(newProduct);
  } catch (error: any) {
    console.error("Database insert error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Postgres error codes: 23502 = NOT NULL violation, 23505 = unique violation
    if (error.code === '23502') {
      throw new Error(`Missing required field: ${error.column}`);
    }
    if (error.code === '23505') {
      throw new Error(`A product with this SKU already exists in your store.`);
    }
    throw new Error(`Failed to insert product: ${error.message}`);
  }
}

export async function updateProduct(db: Database, businessId: string, productId: string, data: Partial<typeof products.$inferSelect>) {
  const productList = await db.select().from(products).where(and(eq(products.id, productId), eq(products.businessId, businessId)));
  const product = productList[0];

  if (!product) {
    throw new Error("Product not found");
  }

  const updateData = { ...data };
  if (updateData.sku !== undefined) {
    updateData.sku = (updateData.sku && updateData.sku.trim() !== "") ? updateData.sku.trim() : null;
  }
  if (updateData.description !== undefined) {
    updateData.description = updateData.description || null;
  }
  if (updateData.category !== undefined) {
    updateData.category = updateData.category || null;
  }

  await db.update(products)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  return await getProductById(db, businessId, productId);
}

export async function deleteProduct(db: Database, businessId: string, productId: string) {
  const productList = await db.select().from(products).where(and(eq(products.id, productId), eq(products.businessId, businessId)));
  const product = productList[0];

  if (!product) {
    throw new Error("Product not found");
  }

  await db.update(products)
    .set({ isActive: false })
    .where(eq(products.id, productId));

  return true;
}

export async function adjustStock(db: Database, businessId: string, productId: string, quantity: number) {
  const productList = await db.select().from(products).where(and(eq(products.id, productId), eq(products.businessId, businessId)));
  const product = productList[0];

  if (!product) {
    throw new Error("Product not found");
  }

  const newQuantity = product.quantity + quantity;
  if (newQuantity < 0) {
    throw new Error("Insufficient stock");
  }

  await db.update(products)
    .set({ quantity: newQuantity, updatedAt: new Date() })
    .where(eq(products.id, productId));

  return await getProductById(db, businessId, productId);
}

export async function getCategories(db: Database, businessId: string) {
  const result = await db.selectDistinct({ category: products.category })
    .from(products)
    .where(eq(products.businessId, businessId));
  
  return result.map(r => r.category).filter((c): c is string => !!c);
}
