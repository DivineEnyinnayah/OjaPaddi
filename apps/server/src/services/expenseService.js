import { expenses } from "@ojapaddi/db/schema";
import { eq, and, sql, desc, like } from "drizzle-orm";
import { money } from "../lib/money";
export async function getExpenses(db, businessId, query) {
    const { from, to, category, search } = query;
    let filters = [eq(expenses.businessId, businessId)];
    if (from) {
        filters.push(sql `${expenses.incurredAt} >= ${new Date(from).getTime()}`);
    }
    if (to) {
        filters.push(sql `${expenses.incurredAt} <= ${new Date(to).getTime()}`);
    }
    if (category && category !== 'All') {
        filters.push(eq(expenses.category, category));
    }
    if (search && search.trim() !== '') {
        filters.push(like(expenses.description, `%${search.trim()}%`));
    }
    const result = await db
        .select()
        .from(expenses)
        .where(and(...filters))
        .orderBy(desc(expenses.incurredAt));
    return result;
}
export async function createExpense(db, businessId, data) {
    const [newExpense] = await db.insert(expenses).values({
        businessId,
        description: data.description,
        amount: money(data.amount),
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
export async function getExpenseById(db, businessId, expenseId) {
    const expenseList = await db.select().from(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.businessId, businessId)));
    return expenseList[0] || null;
}
export async function updateExpense(db, businessId, expenseId, data) {
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
export async function deleteExpense(db, businessId, expenseId) {
    const expenseList = await db.select().from(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.businessId, businessId)));
    const expense = expenseList[0];
    if (!expense) {
        throw new Error("Expense not found");
    }
    await db.delete(expenses).where(eq(expenses.id, expenseId));
    return true;
}
