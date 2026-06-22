import { env } from "@ojapaddi/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { businessRoutes } from "./routes/business";
import { supabase } from "./lib/supabase";

import { productRoutes } from "./routes/products";
import { saleRoutes } from "./routes/sales";
import { customerRoutes } from "./routes/customers";
import { expenseRoutes } from "./routes/expenses";
import { analyticsRoutes } from "./routes/analytics";
import { shareRoutes } from "./routes/share";
import { authMiddleware } from "./middleware/auth";
import { rateLimit } from "./middleware/rateLimit";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use("/auth/*", rateLimit(30, 60000));
app.use("/*", rateLimit(100, 60000));

app.route("/auth", authRoutes);

// Apply authMiddleware to all protected routes
app.use("/business/*", authMiddleware);
app.use("/products/*", authMiddleware);
app.use("/sales/*", authMiddleware);
app.use("/customers/*", authMiddleware);
app.use("/expenses/*", authMiddleware);
app.use("/analytics/*", authMiddleware);
app.use("/share/*", authMiddleware);

app.route("/business", businessRoutes);
app.route("/products", productRoutes);
app.route("/sales", saleRoutes);
app.route("/customers", customerRoutes);
app.route("/expenses", expenseRoutes);
app.route("/analytics", analyticsRoutes);
app.route("/share", shareRoutes);

app.get("/test-supabase", async (c) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      return c.json({ success: false, error: `Supabase admin API error: ${error.message}` }, 500);
    }
    const userCount = data?.users?.length ?? 0;
    return c.json({
      success: true,
      message: "Successfully connected to Supabase!",
      data: { userCount },
    }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});


app.get("/", (c) => {
  return c.text("OK");
});

export default app;

