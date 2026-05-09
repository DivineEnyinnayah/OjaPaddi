import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { createDb } from "@ojapaddi/db";
import { sales, saleItems, products, businesses, customers } from "@ojapaddi/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { HonoEnv } from "../types";
import type { Context } from "hono";

const saleRoutes = new Hono<HonoEnv>();

saleRoutes.use("/*", authMiddleware);

const getBusiness = async (c: Context<HonoEnv>) => {
  const user = c.get("user");
  const db = createDb();
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
  });
  return business;
};

const generateReference = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `OJA-${date}-${random}`;
};

saleRoutes.get("/", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const db = createDb();
  const query = c.req.query();
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "20");
  const offset = (page - 1) * limit;

  const result = await db.query.sales.findMany({
    where: eq(sales.businessId, business.id),
    limit,
    offset,
    orderBy: (sales, { desc }) => [desc(sales.createdAt)],
    with: {
      customer: true,
    }
  });

  return c.json({ success: true, data: result });
});

saleRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      customerId: z.string().uuid().optional().nullable(),
      items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().or(z.string()),
      })).min(1),
      discount: z.number().or(z.string()).default(0),
      paymentMethod: z.enum(["cash", "transfer", "pos", "other"]),
      paymentStatus: z.enum(["paid", "partial", "unpaid"]).default("paid"),
      amountPaid: z.number().or(z.string()),
      notes: z.string().optional(),
    })
  ),
  async (c) => {
    const business = await getBusiness(c);
    if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

    const data = c.req.valid("json");
    const db = createDb();

    // Calculate totals
    let subtotal = 0;
    const itemsToInsert: any[] = [];

    for (const item of data.items) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, item.productId),
      });

      if (!product || product.businessId !== business.id) {
        return c.json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: `Product ${item.productId} not found` } }, 400);
      }

      if (product.quantity < item.quantity) {
        return c.json({ success: false, error: { code: "INSUFFICIENT_STOCK", message: `Insufficient stock for ${product.name}` } }, 400);
      }

      const itemTotal = parseFloat(item.unitPrice.toString()) * item.quantity;
      subtotal += itemTotal;

      itemsToInsert.push({
        productId: product.id,
        productName: product.name,
        unitPrice: item.unitPrice.toString(),
        costPrice: product.costPrice,
        quantity: item.quantity,
        total: itemTotal.toString(),
      });
    }

    const total = subtotal - parseFloat(data.discount.toString());
    const reference = generateReference();

    // Use a transaction
    const result = await db.transaction(async (tx) => {
      const [sale] = await tx.insert(sales).values({
        businessId: business.id,
        customerId: data.customerId,
        reference,
        subtotal: subtotal.toString(),
        discount: data.discount.toString(),
        total: total.toString(),
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        amountPaid: data.amountPaid.toString(),
        notes: data.notes,
      }).returning();

      if (!sale) {
        throw new Error("Failed to create sale record");
      }

      for (const item of itemsToInsert) {
        await tx.insert(saleItems).values({
          ...item,
          saleId: sale.id,
        });

        // Decrement stock
        await tx.update(products).set({
          quantity: sql`${products.quantity} - ${item.quantity}`,
        }).where(eq(products.id, item.productId));
      }

      // Update customer stats if applicable
      if (data.customerId) {
        await tx.update(customers).set({
          totalSpent: sql`${customers.totalSpent} + ${total.toString()}`,
          orderCount: sql`${customers.orderCount} + 1`,
        }).where(eq(customers.id, data.customerId));
      }

      return sale;
    });

    return c.json({ success: true, data: result }, 201);
  }
);

saleRoutes.get("/:id", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const id = c.req.param("id");
  const db = createDb();
  const sale = await db.query.sales.findFirst({
    where: and(
      eq(sales.id, id),
      eq(sales.businessId, business.id)
    ),
    with: {
      customer: true,
      items: true,
    }
  });

  if (!sale) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Sale not found" } }, 404);

  return c.json({ success: true, data: sale });
});

saleRoutes.delete("/:id", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const id = c.req.param("id");
  const db = createDb();

  // Void a sale: restore stock and delete sale
  await db.transaction(async (tx) => {
    const sale = await tx.query.sales.findFirst({
      where: and(
        eq(sales.id, id),
        eq(sales.businessId, business.id)
      ),
      with: {
        items: true,
      }
    });

    if (!sale) throw new Error("Sale not found");

    for (const item of sale.items) {
      await tx.update(products).set({
        quantity: sql`${products.quantity} + ${item.quantity}`,
      }).where(eq(products.id, item.productId));
    }

    if (sale.customerId) {
        await tx.update(customers).set({
          totalSpent: sql`${customers.totalSpent} - ${sale.total}`,
          orderCount: sql`${customers.orderCount} - 1`,
        }).where(eq(customers.id, sale.customerId));
    }

    await tx.delete(sales).where(eq(sales.id, id));
  });

  return c.json({ success: true, data: { message: "Sale voided" } });
});

export default saleRoutes;
