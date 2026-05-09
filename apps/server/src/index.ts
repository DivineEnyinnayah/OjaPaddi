import { env } from "@ojapaddi/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { businessRoutes } from "./routes/business";
import { productRoutes } from "./routes/products";
import { saleRoutes } from "./routes/sales";
import { customerRoutes } from "./routes/customers";
import { expenseRoutes } from "./routes/expenses";
import { analyticsRoutes } from "./routes/analytics";
import { shareRoutes } from "./routes/share";
import { authMiddleware } from "./middleware/auth";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

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
    const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return c.json({ success: false, error: "Supabase credentials missing in environment" }, 500);
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (response.ok) {
      return c.json({ success: true, message: "Successfully connected to Supabase!" }, 200);
    } else {
      return c.json({ success: false, error: `Supabase responded with status ${response.status}` }, response.status as import("hono/utils/http-status").ContentfulStatusCode);
    }
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});


app.get("/", (c) => {
  return c.text("OK");
});

export default app;

