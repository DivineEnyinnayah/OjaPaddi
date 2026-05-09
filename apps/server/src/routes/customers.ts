import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { createDb } from "@ojapaddi/db";
import { customers, businesses } from "@ojapaddi/db/schema";
import { eq, and } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { HonoEnv } from "../types";
import type { Context } from "hono";

const customerRoutes = new Hono<HonoEnv>();

customerRoutes.use("/*", authMiddleware);

const getBusiness = async (c: Context<HonoEnv>) => {
  const user = c.get("user");
  const db = createDb();
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
  });
  return business;
};

customerRoutes.get("/", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const db = createDb();
  const query = c.req.query();
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "20");
  const offset = (page - 1) * limit;

  const result = await db.query.customers.findMany({
    where: eq(customers.businessId, business.id),
    limit,
    offset,
    orderBy: (customers, { desc }) => [desc(customers.createdAt)],
  });

  return c.json({ success: true, data: result });
});

customerRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      address: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  async (c) => {
    const business = await getBusiness(c);
    if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

    const data = c.req.valid("json");
    const db = createDb();

    const [newCustomer] = await db.insert(customers).values({
      ...data,
      businessId: business.id,
    }).returning();

    if (!newCustomer) {
      return c.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create customer" } }, 500);
    }

    return c.json({ success: true, data: newCustomer }, 201);
  }
);

customerRoutes.get("/:id", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const id = c.req.param("id");
  const db = createDb();
  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.businessId, business.id)
    ),
    with: {
      sales: true,
    }
  });

  if (!customer) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } }, 404);

  return c.json({ success: true, data: customer });
});

customerRoutes.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      address: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  async (c) => {
    const business = await getBusiness(c);
    if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

    const id = c.req.param("id");
    const data = c.req.valid("json");
    const db = createDb();

    const [updatedCustomer] = await db.update(customers).set(data).where(and(
      eq(customers.id, id),
      eq(customers.businessId, business.id)
    )).returning();

    if (!updatedCustomer) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } }, 404);

    return c.json({ success: true, data: updatedCustomer });
  }
);

customerRoutes.delete("/:id", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const id = c.req.param("id");
  const db = createDb();
  await db.delete(customers).where(and(
    eq(customers.id, id),
    eq(customers.businessId, business.id)
  ));

  return c.json({ success: true, data: { message: "Customer deleted" } });
});

export default customerRoutes;
