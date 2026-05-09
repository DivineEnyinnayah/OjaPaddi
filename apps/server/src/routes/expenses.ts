import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { createDb } from "@ojapaddi/db";
import { expenses, businesses } from "@ojapaddi/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { HonoEnv } from "../types";
import type { Context } from "hono";

const expenseRoutes = new Hono<HonoEnv>();

expenseRoutes.use("/*", authMiddleware);

const getBusiness = async (c: Context<HonoEnv>) => {
  const user = c.get("user");
  const db = createDb();
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
  });
  return business;
};

expenseRoutes.get("/", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const db = createDb();
  const query = c.req.query();
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;

  const result = await db.query.expenses.findMany({
    where: and(
      eq(expenses.businessId, business.id),
      from ? sql`${expenses.incurredAt} >= ${from}` : undefined,
      to ? sql`${expenses.incurredAt} <= ${to}` : undefined
    ),
    orderBy: (expenses, { desc }) => [desc(expenses.incurredAt)],
  });

  return c.json({ success: true, data: result });
});

expenseRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      description: z.string().min(1),
      amount: z.number().or(z.string()),
      category: z.string().optional(),
      incurredAt: z.string().optional().transform((v) => v ? new Date(v) : new Date()),
    })
  ),
  async (c) => {
    const business = await getBusiness(c);
    if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

    const data = c.req.valid("json");
    const db = createDb();

    const [newExpense] = await db.insert(expenses).values({
      ...data,
      amount: data.amount.toString(),
      businessId: business.id,
    }).returning();

    if (!newExpense) {
      return c.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create expense" } }, 500);
    }

    return c.json({ success: true, data: newExpense }, 201);
  }
);

expenseRoutes.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      description: z.string().min(1),
      amount: z.number().or(z.string()),
      category: z.string().optional(),
      incurredAt: z.string().optional().transform((v) => v ? new Date(v) : new Date()),
    })
  ),
  async (c) => {
    const business = await getBusiness(c);
    if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

    const id = c.req.param("id");
    const data = c.req.valid("json");
    const db = createDb();

    const [updatedExpense] = await db.update(expenses).set({
      ...data,
      amount: data.amount.toString(),
    }).where(and(
      eq(expenses.id, id),
      eq(expenses.businessId, business.id)
    )).returning();

    if (!updatedExpense) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Expense not found" } }, 404);

    return c.json({ success: true, data: updatedExpense });
  }
);

expenseRoutes.delete("/:id", async (c) => {
  const business = await getBusiness(c);
  if (!business) return c.json({ success: false, error: { code: "NO_BUSINESS", message: "Business not found" } }, 404);

  const id = c.req.param("id");
  const db = createDb();
  await db.delete(expenses).where(and(
    eq(expenses.id, id),
    eq(expenses.businessId, business.id)
  ));

  return c.json({ success: true, data: { message: "Expense deleted" } });
});

export default expenseRoutes;
