import { createMiddleware } from "hono/factory";
import { supabase } from "../lib/supabase";
import { businesses } from "@ojapaddi/db/schema";
import { eq } from "drizzle-orm";
import type { HonoEnv } from "../types";

export type AuthContext = HonoEnv;

export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" } }, 401);
  }

  const token = authHeader.split(" ")[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } }, 401);
  }

  const db = c.get("db");

  const [business] = await db.select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.userId, user.id));

  if (!business) {
    return c.json({ success: false, error: { code: "FORBIDDEN", message: "No business found for user" } }, 403);
  }

  c.set("user", user);
  c.set("businessId", business.id);

  await next();
});
