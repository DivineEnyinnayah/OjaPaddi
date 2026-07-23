import { env } from "@ojapaddi/env/server";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

// Long-lived singleton pool, used only for local Bun dev (bun run dev),
// where there's no per-request Hyperdrive binding and no benefit to
// tearing the connection down between requests.
let poolInstance: Pool | null = null;

/**
 * Creates a Database instance AND returns the underlying Pool alongside it.
 *
 * Use this when you need to close the pool after the request finishes
 * (i.e. the Cloudflare Workers / Hyperdrive path). If connectionString is
 * omitted, falls back to the local Bun singleton pool, which is intentionally
 * never closed.
 */
export function createDbWithPool(connectionString?: string): { db: Database; pool: Pool } {
  const pool = connectionString
    ? new Pool({ connectionString, max: 1 })
    : (poolInstance ??= new Pool({ connectionString: env.DATABASE_URL, max: 1 }));

  return { db: drizzle(pool, { schema }), pool };
}

/**
 * Creates a Database instance only. Prefer createDbWithPool() in any
 * request-scoped context (e.g. Cloudflare Workers middleware) so the pool
 * can be closed afterward — otherwise pools accumulate across requests
 * within the same isolate.
 */
export function createDb(connectionString?: string): Database {
  return createDbWithPool(connectionString).db;
}