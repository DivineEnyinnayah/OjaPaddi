import type { Database } from "@ojapaddi/db";
import { expenses } from "@ojapaddi/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getExpenses(db: Database, businessId: string, query: {
  from?: string;
  to?: string;
  category?: string;
}) {
  const { from, to, category } = query;

  let filters = [eq(expenses.businessId, businessId)];

  if (from) {
    filters.push(sql`${expenses.incurredAt} >= ${new Date(from)}`);
  }
  if (to) {
    filters.push(sql`${expenses.incurredAt} <= ${new Date(to)}`);
  }
  if (category) {
    filters.push(eq(expenses.category, category));
  }

  const result = await db.select().from(expenses).where(and(...filters));

  return result;
}

export async function createExpense(db: Database, businessId: string, data: {
  description: string;
  amount: number;
  category?: string;
  incurredAt: Date;
}) {
  const [newExpense] = await db.insert(expenses).values({
    businessId,
    description: data.description,
    amount: data.amount.toString(),
    category: data.category,
    incurredAt: data.incurredAt,
  }).returning();
  return newExpense;
}

export async function getExpenseById(db: Database, businessId: string, expenseId: string) {
  const expenseList = await db.select().from(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.businessId, businessId)));
  return expenseList[0] || null;
}

export async function updateExpense(db: Database, businessId: string, expenseId: string, data: Partial<typeof expenses.$inferSelect>) {
  const expenseList = await db.select().from(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.businessId, businessId)));
  const expense = expenseList[0];

  if (!expense) {
    throw new Error("Expense not found");
  }

  await db.update(expenses)
    .set(data)
    .where(eq(expenses.id, expenseId));

  return await getExpenseById(db, businessId, expenseId);
}

export async function deleteExpense(db: Database, businessId: string, expenseId: string) {
  const expenseList = await db.select().from(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.businessId, businessId)));
  const expense = expenseList[0];

  if (!expense) {
    throw new Error("Expense not found");
  }

  await db.delete(expenses).where(eq(expenses.id, expenseId));

  return true;
}
