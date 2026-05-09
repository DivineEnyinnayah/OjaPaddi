import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";
import { env } from "@ojapaddi/env/server";

const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

export type AuthContext = {
  user: any; // We'll refine this later
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

  // Attach user to context
  c.set("user", user);

  await next();
});

