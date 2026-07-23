import { createMiddleware } from "hono/factory";
import { createDbWithPool } from "@ojapaddi/db";
import { env } from "@ojapaddi/env/server";
import type { HonoEnv } from "../types";

export const dbMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const connectionString = c.env?.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
  const { db, pool } = createDbWithPool(connectionString);
  c.set("db", db);

  await next();

  if (c.env?.HYPERDRIVE) {
    c.executionCtx.waitUntil(pool.end());
  }
});
