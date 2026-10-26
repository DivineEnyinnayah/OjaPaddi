import type { Database } from "@ojapaddi/db";
import { sales, saleItems, products, customers } from "@ojapaddi/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { money, moneyFloor0, toNumber } from "../lib/money";

export async function createSale(db: Database, businessId: string, data: {
  orderType?: "customer" | "supermarket";
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  discount?: number;
  paymentMethod: "cash" | "transfer" | "pos" | "cheque" | "other";
  paymentStatus: "paid" | "partial" | "unpaid";
  amountPaid: number;
  expectedPaymentDate?: string;
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
      orderType: data.orderType || "customer",
      expectedPaymentDate: data.expectedPaymentDate ? new Date(data.expectedPaymentDate) : null,
      reference: `OJA-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`,
      subtotal: money(subtotal),
      discount: money(discount),
      returnedAmount: "0.00",
      total: money(total),
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      amountPaid: money(data.amountPaid),
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
        unitPrice: money(item.unitPrice),
        costPrice: product.costPrice,
        quantity: item.quantity,
        returnedQuantity: 0,
        total: money(item.unitPrice * item.quantity),
      });

      await tx.update(products)
        .set({ quantity: product.quantity - item.quantity, updatedAt: new Date() })
        .where(eq(products.id, product.id));
    }

    // 5. Update customer stats if customerId provided.
    // Computed in JS, not SQL: the columns are TEXT and SQLite would coerce the
    // arithmetic to a float (and store 15.5 rather than "15.50").
    if (data.customerId) {
      const [existingCustomer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, data.customerId));

      if (existingCustomer) {
        await tx
          .update(customers)
          .set({
            orderCount: (existingCustomer.orderCount ?? 0) + 1,
            totalSpent: money(toNumber(existingCustomer.totalSpent) + total),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, data.customerId));
      }
    }

    return newSale;
  });
}

export async function returnSaleProducts(
  db: Database,
  businessId: string,
  saleId: string,
  data: {
    returns: { saleItemId: string; quantity: number }[];
    notes?: string;
  }
) {
  return await db.transaction(async (tx) => {
    const [sale] = await tx
      .select()
      .from(sales)
      .where(and(eq(sales.id, saleId), eq(sales.businessId, businessId)));

    if (!sale) {
      throw new Error("Sale not found");
    }
    if (sale.voidedAt) {
      throw new Error("Cannot return items for a voided sale");
    }

    const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    const itemsMap = new Map(items.map((i) => [i.id, i]));

    let totalReturnedVal = 0;

    for (const ret of data.returns) {
      const item = itemsMap.get(ret.saleItemId);
      if (!item) {
        throw new Error(`Sale item ${ret.saleItemId} not found in this sale`);
      }
      const currentReturned = item.returnedQuantity ?? 0;
      if (currentReturned + ret.quantity > item.quantity) {
        throw new Error(`Cannot return ${ret.quantity}. Only ${item.quantity - currentReturned} remaining`);
      }

      const returnedValue = Number(item.unitPrice) * ret.quantity;
      totalReturnedVal += returnedValue;

      // Update sale item returned quantity
      await tx
        .update(saleItems)
        .set({
          returnedQuantity: currentReturned + ret.quantity,
        })
        .where(eq(saleItems.id, item.id));

      // Restock product if productId exists
      if (item.productId) {
        await tx
          .update(products)
          .set({
            quantity: sql`${products.quantity} + ${ret.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }
    }

    const newReturnedAmount = toNumber(sale.returnedAmount) + totalReturnedVal;
    const currentSubtotal = toNumber(sale.subtotal);
    const discount = toNumber(sale.discount);
    const newNetTotal = Math.max(0, currentSubtotal - discount - newReturnedAmount);

    const amountPaid = toNumber(sale.amountPaid);
    let newPaymentStatus = sale.paymentStatus;
    if (amountPaid >= newNetTotal) {
      newPaymentStatus = "paid";
    } else if (amountPaid > 0) {
      newPaymentStatus = "partial";
    } else {
      newPaymentStatus = "unpaid";
    }

    const updatedNotes = data.notes
      ? (sale.notes ? `${sale.notes}\n[Return Note]: ${data.notes}` : `[Return Note]: ${data.notes}`)
      : sale.notes;

    const [updatedSale] = await tx
      .update(sales)
      .set({
        returnedAmount: money(newReturnedAmount),
        total: money(newNetTotal),
        paymentStatus: newPaymentStatus as any,
        notes: updatedNotes,
      })
      .where(eq(sales.id, saleId))
      .returning();

    // Adjust customer totalSpent if applicable (JS-side; see createSale)
    if (sale.customerId) {
      const [existingCustomer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, sale.customerId));

      if (existingCustomer) {
        await tx
          .update(customers)
          .set({
            totalSpent: moneyFloor0(toNumber(existingCustomer.totalSpent) - totalReturnedVal),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, sale.customerId));
      }
    }

    const updatedItems = await tx.select().from(saleItems).where(eq(saleItems.saleId, saleId));

    return {
      ...updatedSale,
      items: updatedItems,
    };
  });
}

export async function getSales(db: Database, businessId: string, query: {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  paymentStatus?: string;
  orderType?: string;
  customerId?: string;
}) {
  const { page = 1, limit = 20, from, to, paymentStatus, orderType, customerId } = query;
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
  if (orderType) {
    filters.push(eq(sales.orderType, orderType as any));
  }
  if (customerId) {
    filters.push(eq(sales.customerId, customerId));
  }

  const result = await db.select().from(sales).where(and(...filters)).limit(limit).offset(offset).orderBy(sql`${sales.soldAt} DESC`);
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

  let customer = null;
  if (sale.customerId) {
    const custRes = await db.select().from(customers).where(eq(customers.id, sale.customerId));
    customer = custRes[0] || null;
  }

  return {
    ...sale,
    customer,
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
      const netSold = item.quantity - (item.returnedQuantity ?? 0);
      if (netSold > 0) {
        await tx.update(products)
          .set({ quantity: sql`${products.quantity} + ${netSold}`, updatedAt: new Date() })
          .where(eq(products.id, item.productId));
      }
    }

    await tx.update(sales)
      .set({ voidedAt: new Date(), voidedBy: userId || null })
      .where(eq(sales.id, saleId));

    if (sale.customerId) {
      const [existingCustomer] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, sale.customerId));

      if (existingCustomer) {
        await tx
          .update(customers)
          .set({
            orderCount: Math.max(0, (existingCustomer.orderCount ?? 0) - 1),
            totalSpent: moneyFloor0(toNumber(existingCustomer.totalSpent) - toNumber(sale.total)),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, sale.customerId));
      }
    }

    return { alreadyVoided: false };
  });
}
