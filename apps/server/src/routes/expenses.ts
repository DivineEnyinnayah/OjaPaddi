import { Hono } from "hono";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../services/expenseService";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateExpenseSchema, UpdateExpenseSchema } from "../validators/expenses";

export const expenseRoutes = new Hono<AuthContext>();

expenseRoutes.use("*", authMiddleware);

expenseRoutes.get("/", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const query = {
      from: c.req.query("from"),
      to: c.req.query("to"),
      category: c.req.query("category"),
    };
    const result = await getExpenses(db, businessId, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "EXPENSES_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

expenseRoutes.post("/", validate(CreateExpenseSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const body = c.get("validatedBody");
    const expense = await createExpense(db, businessId, body);
    return c.json({ success: true, data: expense }, 201);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "EXPENSE_CREATION_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

expenseRoutes.put("/:id", validate(UpdateExpenseSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const expenseId = c.req.param("id");
    const body = c.get("validatedBody");
    const expense = await updateExpense(db, businessId, expenseId, body);
    return c.json({ success: true, data: expense }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "EXPENSE_UPDATE_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

expenseRoutes.delete("/:id", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const expenseId = c.req.param("id");
    await deleteExpense(db, businessId, expenseId);
    return c.json({ success: true, data: { message: "Expense deleted" } }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "EXPENSE_DELETE_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});
