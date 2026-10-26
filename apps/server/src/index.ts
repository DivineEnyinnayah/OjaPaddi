import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "@ojapaddi/env/server";
import { v2 as cloudinary } from "cloudinary";
import { 
  authRoutes, 
  businessRoutes, 
  productRoutes, 
  saleRoutes, 
  customerRoutes, 
  expenseRoutes, 
  analyticsRoutes, 
  shareRoutes 
} from "./routes/index";
import { dbMiddleware } from "./middleware/db";
import { rateLimit } from "./middleware/rateLimit";
import type { HonoEnv } from "./types";

// Cloudinary SDK config — pulls CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
// from .env via @ojapaddi/env/server. Required for URL generation and Admin API.
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const app = new Hono<HonoEnv>();

// Request logging
app.use(async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`);
  await next();
});

// Database connection
app.use("*", dbMiddleware);

// CORS — allowlist from CORS_ORIGIN env (comma-separated), or "*" for all origins (mobile API)
const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (allowedOrigins.includes("*")) return origin;
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Global error handler — never leak internals to clients
app.onError((err, c) => {
  console.error(`[ERROR] ${err.name}: ${err.message}`, err.stack);
  return c.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    500
  );
});

// Rate limits — auth: 10/min, general: 30/min
app.use("/auth/*", rateLimit(10, 60000));
app.use("/*", rateLimit(30, 60000));

// API v1 routes
const v1 = new Hono<HonoEnv>();

v1.route("/auth", authRoutes);
v1.route("/business", businessRoutes);
v1.route("/products", productRoutes);
v1.route("/sales", saleRoutes);
v1.route("/customers", customerRoutes);
v1.route("/expenses", expenseRoutes);
v1.route("/analytics", analyticsRoutes);
v1.route("/share", shareRoutes);

app.route("/v1", v1);

// Health check
app.get("/", (c) => c.text("OjaPaddi API v1 Ready"));

export default app;
