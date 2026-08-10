import type { Database } from "@ojapaddi/db";
import { sales, saleItems, products } from "@ojapaddi/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function createSale(db: Database, businessId: string, data: {
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  discount?: number;
  paymentMethod: "cash" | "transfer" | "pos" | "other";
  paymentStatus: "paid" | "partial" | "unpaid";
  amountPaid: number;
  notes?: string;
}) {
  // 1. Calculate subtotal and total
  let subtotal = 0;
  for (const item of data.items) {
    subtotal += item.unitPrice * item.quantity;
  }

  const discount = data.discount || 0;
  const total = subtotal - discount;

  // 2. Start transaction
  return await db.transaction(async (tx) => {
    // 3. Create sale
    const [newSale] = await tx.insert(sales).values({
      businessId,
      customerId: data.customerId,
      reference: `OJA-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`,
      subtotal: subtotal.toString(),
      discount: discount.toString(),
      total: total.toString(),
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      amountPaid: data.amountPaid.toString(),
      notes: data.notes,
      soldAt: new Date(),
    }).returning();

    // 4. Create sale items and decrement stock
    for (const item of data.items) {
      const [product] = await tx.select().from(products).where(and(eq(products.id, item.productId), eq(products.businessId, businessId)));
      if (!product) {
        throw new Error(`Product ${item.productId} not found or not owned by business`);
      }

      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      if (!newSale) {
        throw new Error("Failed to create sale");
      }

      await tx.insert(saleItems).values({
        saleId: newSale.id,
        productId: item.productId,
        productName: product.name,
        unitPrice: item.unitPrice.toString(),
        costPrice: product.costPrice,
        quantity: item.quantity,
        total: (item.unitPrice * item.quantity).toString(),
      });

      await tx.update(products)
        .set({ quantity: product.quantity - item.quantity, updatedAt: new Date() })
        .where(eq(products.id, product.id));
    }

    return newSale;
  });
}

export async function getSales(db: Database, businessId: string, query: {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  paymentStatus?: string;
}) {
  const { page = 1, limit = 20, from, to, paymentStatus } = query;
  const offset = (page - 1) * limit;

  let filters = [eq(sales.businessId, businessId), sql`${sales.voidedAt} IS NULL`];

  if (from) {
    filters.push(sql`${sales.soldAt} >= ${new Date(from)}`);
  }
  if (to) {
    filters.push(sql`${sales.soldAt} <= ${new Date(to)}`);
  }
  if (paymentStatus) {
    filters.push(eq(sales.paymentStatus, paymentStatus as any));
  }

  const result = await db.select().from(sales).where(and(...filters)).limit(limit).offset(offset);
  const total = await db.select({ count: sql<number>`count(*)` }).from(sales).where(and(...filters));

  return {
    sales: result,
    pagination: {
      total: Number(total[0]?.count ?? 0),
      page,
      limit,
    },
  };
}

export async function getSaleById(db: Database, businessId: string, saleId: string) {
  const saleList = await db.select().from(sales).where(and(eq(sales.id, saleId), eq(sales.businessId, businessId)));
  const sale = saleList[0];

  if (!sale) {
    return null;
  }

  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));

  return {
    ...sale,
    items,
  };
}

export async function voidSale(db: Database, businessId: string, saleId: string, userId?: string) {
  return await db.transaction(async (tx) => {
    const saleList = await tx.select().from(sales).where(and(eq(sales.id, saleId), eq(sales.businessId, businessId)));
    const sale = saleList[0];

    if (!sale) {
      throw new Error("Sale not found");
    }

    if (sale.voidedAt) {
      return { alreadyVoided: true };
    }

    const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, saleId));

    for (const item of items) {
      if (!item.productId) continue;
      await tx.update(products)
        .set({ quantity: sql`${products.quantity} + ${item.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId));
    }

    await tx.update(sales)
      .set({ voidedAt: new Date(), voidedBy: userId || null })
      .where(eq(sales.id, saleId));

    return { alreadyVoided: false };
  });
}
