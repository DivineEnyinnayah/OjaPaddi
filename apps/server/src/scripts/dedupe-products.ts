/**
 * One-off duplicate-product cleanup for production data copied from Supabase.
 *
 *   pnpm --filter @ojapaddi/server dedupe:products            # dry run, no writes
 *   pnpm --filter @ojapaddi/server dedupe:products -- --apply # soft-delete duplicates
 *
 * The old client automatically retried POST /products, so one save could insert
 * several rows with the same payload at nearly the same time. This groups only
 * exact matches created within 60 seconds, keeps one row per cluster, remaps
 * sale history to it, and soft-deletes the rest (isActive=false, isVisible=false).
 * It never deletes products or transaction history.
 *
 * It intentionally does NOT group products with:
 *   - different quantities / prices / descriptions
 *   - rows created more than 60 seconds apart
 * Those may be legitimate stock entries and need review.
 */
import { readFileSync } from "fs";
import { eq, and, inArray, sql } from "drizzle-orm";
import { createDb, getClient } from "@ojapaddi/db";
import { products, saleItems } from "@ojapaddi/db/schema";

const ARGS = process.argv.slice(2).filter((a) => a !== "--");
const APPLY = ARGS.includes("--apply");
const CLUSTER_WINDOW_MS = 60_000;

const ROOT = new URL("../../../../", import.meta.url).pathname;

function loadEnv() {
  for (const f of ["apps/server/.env", "apps/server/.dev.vars", ".env", ".env.local"]) {
    try {
      for (const line of readFileSync(ROOT + f, "utf8").split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m && process.env[m[1]!] === undefined) {
          process.env[m[1]!] = m[2]!.trim().replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      /* optional */
    }
  }
}
loadEnv();
process.env.BETTER_AUTH_SECRET ??= "dedupe-only-secret-at-least-32-chars";
process.env.BETTER_AUTH_URL ??= "http://localhost:3001";
process.env.R2_PUBLIC_URL ??= "https://images.example.com";

if (!process.env.TURSO_DATABASE_URL) {
  console.error("TURSO_DATABASE_URL is not set.");
  process.exit(1);
}

const db = createDb();
const client = getClient();

type ProductRow = typeof products.$inferSelect;

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function baseKey(p: ProductRow): string {
  return [
    p.businessId,
    normalizeText(p.name),
    normalizeText(p.description),
    normalizeText(p.sku),
    normalizeText(p.category),
    normalizeText(String(p.price)),
    normalizeText(p.costPrice),
    String(p.lowStockThreshold),
    String(p.quantity),
  ].join("|");
}

function clustersFor(rows: ProductRow[]): ProductRow[][] {
  const sorted = [...rows].sort((a, b) => {
    const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
    return timeDiff || a.id.localeCompare(b.id);
  });

  const clusters: ProductRow[][] = [];
  let current: ProductRow[] = [];

  for (const row of sorted) {
    if (current.length === 0) {
      current.push(row);
      continue;
    }
    const first = current[0]!;
    const last = current[current.length - 1]!;
    if (
      baseKey(row) === baseKey(first) &&
      row.createdAt.getTime() - last.createdAt.getTime() <= CLUSTER_WINDOW_MS
    ) {
      current.push(row);
    } else {
      if (current.length > 1) clusters.push(current);
      current = [row];
    }
  }
  if (current.length > 1) clusters.push(current);
  return clusters;
}

function hasImage(p: ProductRow): boolean {
  return !!p.imageUrl?.trim();
}

function rankKeeper(cluster: ProductRow[], saleCounts: Map<string, number>): ProductRow {
  return [...cluster].sort((a, b) => {
    const imageDiff = Number(hasImage(b)) - Number(hasImage(a));
    if (imageDiff !== 0) return imageDiff;
    const salesDiff = (saleCounts.get(b.id) ?? 0) - (saleCounts.get(a.id) ?? 0);
    if (salesDiff !== 0) return salesDiff;
    const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();
    return createdDiff || a.id.localeCompare(b.id);
  })[0]!;
}

async function main() {
  const target = new URL(process.env.TURSO_DATABASE_URL!).host;
  console.log(
    `${APPLY ? "APPLY — will modify" : "DRY RUN — no writes"}: ${
      process.env.TURSO_DATABASE_URL!.startsWith("file:")
        ? "LOCAL FILE " + process.env.TURSO_DATABASE_URL
        : "REMOTE " + target
    }\n`
  );

  const allProducts = await db.select().from(products);
  const saleCountRows = await db
    .select({ productId: saleItems.productId, count: sql<number>`count(*)` })
    .from(saleItems)
    .groupBy(saleItems.productId);

  const saleCounts = new Map(
    saleCountRows.filter((row) => row.productId).map((row) => [row.productId!, Number(row.count)])
  );

  const byBase = new Map<string, ProductRow[]>();
  for (const row of allProducts) {
    const key = baseKey(row);
    const bucket = byBase.get(key) ?? [];
    bucket.push(row);
    byBase.set(key, bucket);
  }

  const clusters = [...byBase.values()].flatMap(clustersFor);
  console.log(`Scanning ${allProducts.length} product row(s).`);
  console.log(`Found ${clusters.length} exact duplicate cluster(s) to clean up.\n`);

  if (clusters.length === 0) {
    return;
  }

  let duplicateCount = 0;
  let remappedSaleItems = 0;
  const idsToDeactivate: string[] = [];

  for (const cluster of clusters) {
    const keeper = rankKeeper(cluster, saleCounts);
    const duplicates = cluster.filter((row) => row.id !== keeper.id);
    duplicateCount += duplicates.length;

    // Count direct sale rows that would be rehomed to the keeper.
    for (const duplicate of duplicates) {
      remappedSaleItems += saleCounts.get(duplicate.id) ?? 0;
      idsToDeactivate.push(duplicate.id);
    }

    console.log(
      `cluster: ${duplicates.length + 1} rows for "${keeper.name}" (business ${keeper.businessId.slice(0, 8)}…) ` +
        `keeper ${keeper.id.slice(0, 8)}…, deactivating ${duplicates.map((d) => d.id.slice(0, 8) + "…").join(", ")}`
    );
  }

  console.log(`\nTotal duplicate rows to deactivate: ${duplicateCount}`);
  console.log(`Sale item reference(s) to remap to keepers: ${remappedSaleItems}`);
  console.log("Mode: soft delete only — no product or sales rows will be removed.\n");

  if (!APPLY) {
    console.log("Dry run complete. Re-run with `-- --apply` to perform the cleanup.");
    return;
  }

  const statements: ReturnType<typeof db.update>[] = [];
  for (const cluster of clusters) {
    const keeper = rankKeeper(cluster, saleCounts);
    const duplicateIds = cluster.filter((row) => row.id !== keeper.id).map((row) => row.id);
    const now = new Date();

    if (duplicateIds.length > 0) {
      statements.push(
        db.update(saleItems)
          .set({ productId: keeper.id })
          .where(inArray(saleItems.productId, duplicateIds)) as any
      );
      statements.push(
        db.update(products)
          .set({ isActive: false, isVisible: false, updatedAt: now })
          .where(and(inArray(products.id, duplicateIds), eq(products.businessId, keeper.businessId))) as any
      );
    }
  }

  if (statements.length > 0) {
    await (db as any).batch(statements);
  }
  console.log(`✓ Cleanup complete: deactivated ${duplicateCount} product row(s).`);
}

main()
  .catch((err) => {
    console.error("\n✗ Product dedupe failed:", err?.message ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
