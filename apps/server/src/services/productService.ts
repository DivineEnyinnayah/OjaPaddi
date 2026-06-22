import { db } from "@ojapaddi/db";
import { products } from "@ojapaddi/db/schema";
import { eq, and, like, sql } from "drizzle-orm";

export async function getProducts(businessId: string, query: {
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
    products: result,
    pagination: {
      total: Number(total[0]?.count ?? 0),
      page,
      limit,
    },
  };
}

export async function getProductById(businessId: string, productId: string) {
  const productList = await db.select().from(products).where(and(eq(products.id, productId), eq(products.businessId, businessId), eq(products.isActive, true)));
  return productList[0] || null;
}

export async function createProduct(businessId: string, data: {
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
  const [newProduct] = await db.insert(products).values({
    businessId,
    name: data.name,
    description: data.description || null,
    sku: (data.sku && data.sku.trim() !== "") ? data.sku.trim() : null,
    category: data.category || null,
    price: data.price.toString(),
    costPrice: data.costPrice?.toString() || null,
    quantity: data.quantity,
    lowStockThreshold: data.lowStockThreshold,
    imageUrl: data.imageUrl,
  }).returning();
  return newProduct;
}

export async function updateProduct(businessId: string, productId: string, data: Partial<typeof products.$inferSelect>) {
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

  return await getProductById(businessId, productId);
}

export async function deleteProduct(businessId: string, productId: string) {
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

export async function adjustStock(businessId: string, productId: string, quantity: number) {
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

  return await getProductById(businessId, productId);
}

export async function getCategories(businessId: string) {
  const result = await db.selectDistinct({ category: products.category })
    .from(products)
    .where(eq(products.businessId, businessId));
  
  return result.map(r => r.category).filter((c): c is string => !!c);
}
