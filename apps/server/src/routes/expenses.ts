import { Hono } from "hono";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../services/expenseService";
import { authMiddleware, type AuthContext } from "../middleware/auth";

export const expenseRoutes = new Hono<{ Variables: AuthContext }>();

expenseRoutes.use("*", authMiddleware);

expenseRoutes.get("/", async (c) => {
  try {
    const businessId = c.get("businessId");
    const query = {
      from: c.req.query("from"),
      to: c.req.query("to"),
      category: c.req.query("category"),
    };
    const result = await getExpenses(businessId, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "EXPENSES_FETCH_FAILED", message: error.message } }, 400);
  }
});

expenseRoutes.post("/", async (c) => {
  try {
    const businessId = c.get("businessId");
    const body = await c.req.json();
    const expense = await createExpense(businessId, body);
    return c.json({ success: true, data: expense }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "EXPENSE_CREATION_FAILED", message: error.message } }, 400);
  }
});

expenseRoutes.put("/:id", async (c) => {
  try {
    const businessId = c.get("businessId");
    const expenseId = c.req.param("id");
    const body = await c.req.json();
    const expense = await updateExpense(businessId, expenseId, body);
    return c.json({ success: true, data: expense }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "EXPENSE_UPDATE_FAILED", message: error.message } }, 400);
  }
});

expenseRoutes.delete("/:id", async (c) => {
  try {
    const businessId = c.get("businessId");
    const expenseId = c.req.param("id");
    await deleteExpense(businessId, expenseId);
    return c.json({ success: true, data: { message: "Expense deleted" } }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "EXPENSE_DELETE_FAILED", message: error.message } }, 400);
  }
});
