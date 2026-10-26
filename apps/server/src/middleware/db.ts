import { createMiddleware } from "hono/factory";
import { createDb } from "@ojapaddi/db";
import type { HonoEnv } from "../types";

/**
 * libSQL talks HTTP/WebSocket, so there is no connection pool to open or close
 * per request — the client is shared and stateless. This middleware simply
 * binds a Database instance onto the context so services keep the same
 * `c.get("db")` signature they had with Postgres.
 */
export const dbMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  c.set("db", createDb());

  await next();
});