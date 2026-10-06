import { Hono } from "hono";
import { getCustomers, createCustomer, getCustomerById, updateCustomer, deleteCustomer } from "../services/customerService";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateCustomerSchema, UpdateCustomerSchema } from "../validators/customers";
import { checkCustomerLimit } from "../middleware/planLimits";

export const customerRoutes = new Hono<AuthContext>();

customerRoutes.use("*", authMiddleware);

customerRoutes.get("/", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const query = {
      page: c.req.query("page") ? parseInt(c.req.query("page")!) : undefined,
      limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
      search: c.req.query("search"),
      customerType: c.req.query("customerType") as any,
    };
    const result = await getCustomers(db, businessId, query);
    return c.json({ success: true, data: result }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "CUSTOMERS_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

customerRoutes.post("/", validate(CreateCustomerSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    await checkCustomerLimit(db, businessId);
    const body = c.get("validatedBody");
    const customer = await createCustomer(db, businessId, body);
    return c.json({ success: true, data: customer }, 201);
  } catch (error: unknown) {
    const code = (error as any)?.code || "CUSTOMER_CREATION_FAILED";
    const status = code === "PLAN_LIMIT_REACHED" ? 403 : 400;
    return c.json({ success: false, error: { code, message: error instanceof Error ? error.message : String(error) } }, status);
  }
});

customerRoutes.get("/:id", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const customerId = c.req.param("id");
    const customer = await getCustomerById(db, businessId, customerId);
    if (!customer) {
      return c.json({ success: false, error: { code: "CUSTOMER_NOT_FOUND", message: "Customer not found" } }, 404);
    }
    return c.json({ success: true, data: customer }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "CUSTOMER_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

customerRoutes.put("/:id", validate(UpdateCustomerSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const customerId = c.req.param("id");
    const body = c.get("validatedBody");
    const customer = await updateCustomer(db, businessId, customerId, body);
    return c.json({ success: true, data: customer }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "CUSTOMER_UPDATE_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

customerRoutes.delete("/:id", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const customerId = c.req.param("id");
    await deleteCustomer(db, businessId, customerId);
    return c.json({ success: true, data: { message: "Customer deleted" } }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "CUSTOMER_DELETE_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});
