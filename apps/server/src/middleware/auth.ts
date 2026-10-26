import { createMiddleware } from "hono/factory";
import { auth } from "@ojapaddi/auth";
import { businesses } from "@ojapaddi/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import type { HonoEnv, AuthUser } from "../types";

export type AuthContext = HonoEnv;

/**
 * Resolves the caller from the Better Auth session behind the Bearer token.
 *
 * The mobile client already sends `Authorization: Bearer <token>` and refreshes
 * on a 401, so this reads the same header it always did — only the lookup moved
 * from a network round-trip to Supabase Auth into a local SQLite session lookup.
 *
 * Business scoping is deliberately one-per-user and picks the oldest
 * non-deleted business, so a soft-deleted storefront cannot silently take over.
 */
export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ") || !authHeader.slice(7).trim()) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" } }, 401);
  }

  // The bearer() plugin reads the same header, so pass the request headers
  // through untouched rather than re-parsing the token here.
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  // `bearer()` resolves the session token from the Authorization header for us.
  if (!session?.user?.id) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } }, 401);
  }

  const db = c.get("db");

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.userId, session.user.id), isNull(businesses.deletedAt)))
    .orderBy(businesses.createdAt)
    .limit(1);

  if (!business) {
    return c.json({ success: false, error: { code: "FORBIDDEN", message: "No business found for user" } }, 403);
  }

  c.set("user", toAuthUser(session.user));
  c.set("businessId", business.id);

  await next();
});

/** Normalises a Better Auth user into the shape services expect. */
function toAuthUser(u: Record<string, any>): AuthUser {
  return {
    id: u.id as string,
    email: (u.email as string) ?? "",
    name: (u.name as string) ?? "",
    fullName: (u.fullName as string) ?? null,
    phone: (u.phone as string) ?? null,
    plan: (u.plan as string) ?? "free",
    image: (u.image as string) ?? null,
    emailVerified: Boolean(u.emailVerified),
  };
}