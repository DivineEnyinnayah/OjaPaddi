import { Hono } from "hono";
import { getCustomers, createCustomer, getCustomerById, updateCustomer, deleteCustomer } from "../services/customerService";
import { authMiddleware, type AuthContext } from "../middleware/auth";

export const customerRoutes = new Hono<{ Variables: AuthContext }>();

customerRoutes.use("*", authMiddleware);

customerRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const query = {
      page: c.req.query("page") ? parseInt(c.req.query("page")!) : undefined,
      limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
      search: c.req.query("search"),
    };
    const result = await getCustomers(user.id, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "CUSTOMERS_FETCH_FAILED", message: error.message } }, 400);
  }
});

customerRoutes.post("/", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const customer = await createCustomer(user.id, body);
    return c.json({ success: true, data: customer }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "CUSTOMER_CREATION_FAILED", message: error.message } }, 400);
  }
});

customerRoutes.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const customerId = c.req.param("id");
    const customer = await getCustomerById(user.id, customerId);
    if (!customer) {
      return c.json({ success: false, error: { code: "CUSTOMER_NOT_FOUND", message: "Customer not found" } }, 404);
    }
    return c.json({ success: true, data: customer }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "CUSTOMER_FETCH_FAILED", message: error.message } }, 400);
  }
});

customerRoutes.put("/:id", async (c) => {
  try {
    const user = c.get("user");
    const customerId = c.req.param("id");
    const body = await c.req.json();
    const customer = await updateCustomer(user.id, customerId, body);
    return c.json({ success: true, data: customer }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "CUSTOMER_UPDATE_FAILED", message: error.message } }, 400);
  }
});

customerRoutes.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const customerId = c.req.param("id");
    await deleteCustomer(user.id, customerId);
    return c.json({ success: true, data: { message: "Customer deleted" } }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "CUSTOMER_DELETE_FAILED", message: error.message } }, 400);
  }
});


customerRoutes.post("/", async (c) => {
  return c.json({ success: true, data: { message: "Customer added" } }, 201);
});

customerRoutes.get("/:id", async (c) => {
  return c.json({ success: true, data: { message: "Customer details" } }, 200);
});

customerRoutes.put("/:id", async (c) => {
  return c.json({ success: true, data: { message: "Customer updated" } }, 200);
});

customerRoutes.delete("/:id", async (c) => {
  return c.json({ success: true, data: { message: "Customer deleted" } }, 200);
});
