import { createMiddleware } from "hono/factory";
import { supabase } from "../lib/supabase";
import { db } from "@ojapaddi/db";
import { businesses } from "@ojapaddi/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

export type AuthContext = {
  user: User;
  businessId: string;
  validatedBody: any;
};

export const authMiddleware = createMiddleware<{ Variables: AuthContext }>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" } }, 401);
  }

  const token = authHeader.split(" ")[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } }, 401);
  }

  // Look up the user's business
  const [business] = await db.select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.userId, user.id));

  if (!business) {
    return c.json({ success: false, error: { code: "FORBIDDEN", message: "No business found for user" } }, 403);
  }

  // Attach user and businessId to context
  c.set("user", user);
  c.set("businessId", business.id);

  await next();
});

