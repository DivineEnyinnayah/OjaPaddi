/**
 * One-time migration: existing remote image URLs (Cloudinary / R2) -> Turso blobs.
 *
 *   pnpm --filter @ojapaddi/server migrate:images:turso -- --dry-run
 *   pnpm --filter @ojapaddi/server migrate:images:turso
 *
 * Finds products.image_url and businesses.logo_url values that start with
 * http(s)://, downloads each (public URLs — no credentials needed), shrinks
 * the longest edge to 800px, re-encodes (JPEG, or WebP when the source has
 * transparency), inserts it into the `images` table and rewrites the stored
 * value to `/v1/images/<id>`.
 *
 * --dry-run only reports what would be migrated (URL, HTTP status, bytes)
 * and touches nothing. Rows that are already `/v1/images/...` or another
 * non-http value are skipped. Failures are reported and leave the row
 * unchanged so the script is safe to re-run.
 */

import { createDb } from "@ojapaddi/db";
import { businesses, images, products } from "@ojapaddi/db/schema";
import { isNotNull, eq } from "drizzle-orm";
import sharp from "sharp";

const DRY_RUN = process.argv.includes("--dry-run");
const MAX_DIMENSION = 800;

// Env is validated by @ojapaddi/env/server via the createDb() import chain;
// make the script safe to load outside the server context.
process.env.CLOUDINARY_CLOUD_NAME ??= "unused";
process.env.CLOUDINARY_API_KEY ??= "unused";
process.env.CLOUDINARY_API_SECRET ??= "unused";
process.env.R2_PUBLIC_URL ??= "unused";

type RemoteRef = {
  kind: "product" | "business_logo";
  table: "products" | "businesses";
  id: string;
  businessId: string;
  url: string;
};

async function collectRefs(db: ReturnType<typeof createDb>): Promise<RemoteRef[]> {
  const productRows = await db
    .select({ id: products.id, businessId: products.businessId, url: products.imageUrl })
    .from(products)
    .where(isNotNull(products.imageUrl));

  const businessRows = await db
    .select({ id: businesses.id, url: businesses.logoUrl })
    .from(businesses)
    .where(isNotNull(businesses.logoUrl));

  const refs: RemoteRef[] = [];
  for (const row of productRows) {
    if (row.url && /^https?:\/\//.test(row.url)) {
      refs.push({ kind: "product", table: "products", id: row.id, businessId: row.businessId, url: row.url });
    }
  }
  for (const row of businessRows) {
    if (row.url && /^https?:\/\//.test(row.url)) {
      refs.push({ kind: "business_logo", table: "businesses", id: row.id, businessId: row.id, url: row.url });
    }
  }
  return refs;
}

async function encode(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const source = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(source, { failOn: "none" }).rotate().metadata();
  const pipeline = sharp(source, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });
  const hasAlpha = meta.hasAlpha === true;
  const bytes = hasAlpha
    ? await pipeline.webp({ quality: 80 }).toBuffer()
    : await pipeline.jpeg({ quality: 80 }).toBuffer();
  return { bytes, contentType: hasAlpha ? "image/webp" : "image/jpeg" };
}

async function main() {
  const db = createDb();
  const refs = await collectRefs(db);
  console.log(`${DRY_RUN ? "DRY RUN — " : ""}Found ${refs.length} remote image(s).\n`);

  let migrated = 0;
  const failures: { url: string; reason: string }[] = [];

  for (const ref of refs) {
    try {
      if (DRY_RUN) {
        const res = await fetch(ref.url, { method: "HEAD", signal: AbortSignal.timeout(15_000) });
        const length = res.headers.get("content-length") ?? "?";
        console.log(`  ${res.ok ? "✓" : "✗"} ${ref.table}:${ref.id} ${res.status} ${length}B  ${ref.url}`);
        if (!res.ok) failures.push({ url: ref.url, reason: `HTTP ${res.status}` });
        else migrated++;
        continue;
      }

      const { bytes, contentType } = await encode(ref.url);
      const [row] = await db
        .insert(images)
        .values({
          businessId: ref.businessId,
          kind: ref.kind,
          contentType,
          byteSize: bytes.byteLength,
          data: bytes,
        })
        .returning({ id: images.id });
      if (!row) throw new Error("insert returned no id");
      const path = `/v1/images/${row.id}`;
      if (ref.table === "products") {
        await db.update(products).set({ imageUrl: path }).where(eq(products.id, ref.id));
      } else {
        await db.update(businesses).set({ logoUrl: path }).where(eq(businesses.id, ref.id));
      }
      console.log(`  ✓ ${ref.table}:${ref.id} → ${path} (${(bytes.byteLength / 1024).toFixed(0)} KB)`);
      migrated++;
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({ url: ref.url, reason });
      console.log(`  ✗ ${ref.table}:${ref.id} — ${reason}`);
    }
  }

  console.log(`\n${DRY_RUN ? "Would migrate" : "Migrated"}: ${migrated}/${refs.length}, failed: ${failures.length}`);
  if (failures.length > 0) {
    console.log("Failures (rows left unchanged, safe to re-run):");
    for (const f of failures) console.log(`  - ${f.reason}  ${f.url}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
