import { authd } from "@ojapaddi/auth";
import type { Next } from "hono";
import type { HonoEnv } from "../types";
import type { Context } from "hono";

export const authMiddleware = async (c: Context<HonoEnv>, next: Next) => {
  const session = await authd.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};
