import { env } from "@ojapaddi/env/server";
import { authd } from "@ojapaddi/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import businessRoutes from "./routes/business";
import productRoutes from "./routes/products";
import customerRoutes from "./routes/customers";
import saleRoutes from "./routes/sales";
import expenseRoutes from "./routes/expenses";
import analyticsRoutes from "./routes/analytics";
import type { HonoEnv } from "./types";

const app = new Hono<HonoEnv>();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	})
);

app.on(
	["POST", "GET"],
	"/api/auth/*",
	(c) =>
		authd.handler(c.req.raw)
);

app.route("/api/business", businessRoutes);
app.route("/api/products", productRoutes);
app.route("/api/customers", customerRoutes);
app.route("/api/sales", saleRoutes);
app.route("/api/expenses", expenseRoutes);
app.route("/api/analytics", analyticsRoutes);

app.get("/", (c) => {
	return c.text("OK");
});

const port = env.PORT;

console.log(`Server running on http://localhost:${port}`);

serve({
	fetch: app.fetch,
	port,
});

export default app;
