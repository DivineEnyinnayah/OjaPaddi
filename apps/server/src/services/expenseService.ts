import type { Database } from "@ojapaddi/db";
import { expenses } from "@ojapaddi/db/schema";
import { eq, and, sql, desc, ilike } from "drizzle-orm";

export async function getExpenses(db: Database, businessId: string, query: {
  from?: string;
  to?: string;
  category?: string;
  search?: string;
}) {
  const { from, to, category, search } = query;

  let filters = [eq(expenses.businessId, businessId)];

  if (from) {
    filters.push(sql`${expenses.incurredAt} >= ${new Date(from)}`);
  }
  if (to) {
    filters.push(sql`${expenses.incurredAt} <= ${new Date(to)}`);
  }
  if (category && category !== 'All') {
    filters.push(eq(expenses.category, category));
  }
  if (search && search.trim() !== '') {
    filters.push(ilike(expenses.description, `%${search.trim()}%`));
  }

  const result = await db
    .select()
    .from(expenses)
    .where(and(...filters))
    .orderBy(desc(expenses.incurredAt));

  return result;
}

export async function createExpense(db: Database, businessId: string, data: {
  description: string;
  amount: number;
  category?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  dueDate?: string | Date;
  isPaid?: boolean;
  reminderDaysBefore?: number;
  incurredAt?: string | Date;
}) {
  const [newExpense] = await db.insert(expenses).values({
    businessId,
    description: data.description,
    amount: data.amount.toString(),
    category: data.category,
    isRecurring: data.isRecurring ?? false,
    recurringFrequency: data.recurringFrequency,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    isPaid: data.isPaid ?? true,
    reminderDaysBefore: data.reminderDaysBefore ?? 3,
    incurredAt: data.incurredAt ? new Date(data.incurredAt) : new Date(),
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
