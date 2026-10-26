import { products } from "@ojapaddi/db/schema";
import { eq, and, like, sql } from "drizzle-orm";
import { resolveImageUrl } from "./storageService";
import { money } from "../lib/money";
/** Resolve storage paths to signed URLs for a single product */
async function withResolvedUrl(product) {
    if (!product)
        return product;
    return { ...product, imageUrl: await resolveImageUrl(product.imageUrl) };
}
/** Resolve storage paths to signed URLs for an array of products */
async function withResolvedUrls(productList) {
    return Promise.all(productList.map(withResolvedUrl));
}
export async function getProducts(db, businessId, query) {
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
        filters.push(sql `${products.quantity} <= ${products.lowStockThreshold}`);
    }
    const result = await db.select().from(products).where(and(...filters)).limit(limit).offset(offset);
    const total = await db.select({ count: sql `count(*)` }).from(products).where(and(...filters));
    return {
        products: await withResolvedUrls(result),
        pagination: {
            total: Number(total[0]?.count ?? 0),
            page,
            limit,
        },
    };
}
export async function getProductById(db, businessId, productId) {
    const productList = await db.select().from(products).where(and(eq(products.id, productId), eq(products.businessId, businessId), eq(products.isActive, true)));
    return withResolvedUrl(productList[0] || null);
}
export async function createProduct(db, businessId, data) {
    console.log("DEBUG: createProduct called with businessId:", businessId, "type:", typeof businessId);
    if (!businessId || typeof businessId !== "string") {
        throw new Error(`Missing or invalid businessId for product creation. Received: ${JSON.stringify(businessId)}`);
    }
    try {
        const [newProduct] = await db.insert(products).values({
            businessId,
            name: data.name,
            description: data.description || null,
            sku: (data.sku && data.sku.trim() !== "") ? data.sku.trim() : null,
            category: data.category || null,
            price: money(data.price),
            costPrice: data.costPrice != null ? money(data.costPrice) : null,
            quantity: data.quantity,
            lowStockThreshold: data.lowStockThreshold ?? 5,
            imageUrl: data.imageUrl || null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        return withResolvedUrl(newProduct);
    }
    catch (error) {
        console.error("Database insert error:", error?.message ?? error);
        const code = error?.code ?? "";
        // NOT NULL violation: Postgres 23502, SQLite SQLITE_CONSTRAINT_NOTNULL.
        if (code === "23502" || code === "SQLITE_CONSTRAINT_NOTNULL") {
            throw new Error(`Missing required field: ${error?.column ?? "unknown"}`);
        }
        // Unique violation on the partial (business_id, sku) index.
        if (code === "23505" || code === "SQLITE_CONSTRAINT_UNIQUE" || code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
            throw new Error(`A product with this SKU already exists in your store.`);
        }
        throw new Error(`Failed to insert product: ${error?.message ?? String(error)}`);
    }
}
export async function updateProduct(db, businessId, productId, data) {
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
    // Money is TEXT — normalise to 2dp so updates don't write float noise.
    if (updateData.price !== undefined) {
        updateData.price = money(updateData.price);
    }
    if (updateData.costPrice !== undefined) {
        updateData.costPrice = updateData.costPrice == null ? null : money(updateData.costPrice);
    }
    await db.update(products)
        .set({
        ...updateData,
        updatedAt: new Date(),
    })
        .where(eq(products.id, productId));
    return await getProductById(db, businessId, productId);
}
export async function deleteProduct(db, businessId, productId) {
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
export async function adjustStock(db, businessId, productId, quantity) {
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
export async function getCategories(db, businessId) {
    const result = await db.selectDistinct({ category: products.category })
        .from(products)
        .where(eq(products.businessId, businessId));
    return result.map(r => r.category).filter((c) => !!c);
}
