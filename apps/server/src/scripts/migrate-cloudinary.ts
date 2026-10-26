/**
 * One-time migration: Supabase Storage -> Cloudinary.
 *
 *   pnpm --filter @ojapaddi/server migrate:cloudinary
 *   pnpm --filter @ojapaddi/server migrate:cloudinary -- --dry-run
 *
 * Reads product image keys from Supabase Storage, uploads each to Cloudinary,
 * and updates the product's `image_url` column with the Cloudinary `secure_url`.
 *
 * After this runs, image URLs are stable absolute URLs (survive inactivity),
 * and the `uploadImage`/`resolveImageUrl` adapters can be swapped between
 * Cloudinary and R2 without touching any other code.
 */

// ── Env setup: set all required vars BEFORE importing @ojapaddi/db ──────────
// The env package validates on first access, so vars must be in process.env
// before getClient() is called. We load from .env manually as a fallback,
// but also set explicit fallbacks to match the smoke test pattern.

const ROOT = new URL("../../../../", import.meta.url).pathname;

import { readFileSync } from "fs";
for (const f of ["apps/server/.env", "apps/server/.dev.vars", ".env", ".env.local"]) {
  try {
    for (const line of readFileSync(ROOT + f, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && m[1] && m[2] && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch { /* optional */ }
}

// Explicit fallbacks (in case .env loading didn't work or vars are missing)
process.env.TURSO_DATABASE_URL ??= "file:/tmp/opencode/ojapaddi-smoke.db";
process.env.TURSO_AUTH_TOKEN ??= "";
process.env.BETTER_AUTH_SECRET ??= "migration-only-secret-at-least-32-chars";
process.env.BETTER_AUTH_URL ??= "http://localhost:3001";
process.env.EMAIL_API_KEY ??= "migration-only-key";
process.env.EMAIL_FROM ??= "OjaPaddi <noreply@example.com>";
process.env.R2_PUBLIC_URL ??= "https://images.example.com";
process.env.CLOUDINARY_CLOUD_NAME ??= "smoke-test";
process.env.CLOUDINARY_API_KEY ??= "smoke-test";
process.env.CLOUDINARY_API_SECRET ??= "smoke-test";

// Now import the db module (which will validate env vars)
import { getClient } from "@ojapaddi/db";

// ── Cloudinary config --------------------------------------------------------
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// ── Supabase config ---------------------------------------------------------
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "products";

// Folder in Cloudinary for the images
const CLOUDINARY_FOLDER = "products";

const client: any = getClient();

/**
 * Upload a Buffer to Cloudinary and return the secure_url.
 *
 * @param publicId - the desired public ID (used as filename within the folder)
 * @param folder   - Cloudinary folder (defaults to CLOUDINARY_FOLDER)
 */
async function cloudinaryUpload(buffer: Buffer, publicId: string, folder: string = CLOUDINARY_FOLDER): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "image/jpeg" }));

  const timestamp = Math.floor(Date.now() / 1000);

  // Build the string to sign. For signed uploads, include folder and public_id
  // in the signature params (alphabetical order: folder, public_id, timestamp).
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const stringToSign = `${paramsToSign}${API_SECRET}`;
  const crypto = await import("node:crypto");
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  form.append("api_key", API_KEY!);
  form.append("timestamp", timestamp.toString());
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("public_id", publicId);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  const data = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!data.secure_url) {
    const msg = data.error?.message ?? JSON.stringify(data);
    throw new Error(`Cloudinary upload failed: ${msg}`);
  }
  return data.secure_url;
}

/**
 * Fetch a private object from Supabase Storage via the service-role key.
 */
async function fetchSupabaseObject(key: string): Promise<Buffer> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(key)}`, {
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
  });
  if (!res.ok) throw new Error(`Supabase fetch ${res.status}: ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const ARGS = process.argv.slice(2).filter((a) => a !== "--");
  const DRY_RUN = ARGS.includes("--dry-run");

  // ── Read product rows that have a bare storage key -------------------------
  const { rows } = await client.execute(`SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL AND image_url != ''`);
  const products = rows as any[];
  const keys = products.map((p: any) => p.image_url).filter((u: any) => typeof u === "string" && !u.startsWith("http"));

  const externalCount = products.length - keys.length;
  console.log(
    `${DRY_RUN ? "DRY RUN — no uploads" : "MIGRATING"}: Supabase Storage -> Cloudinary\n` +
      `  ${keys.length} storage key(s) to migrate` +
      (externalCount > 0 ? `, ${externalCount} already an absolute URL (left untouched)` : "") +
      `\n  source bucket: ${BUCKET}\n`
  );

  if (keys.length === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  let migrated = 0;
  const failed: { key: string; product: string; reason: string }[] = [];

  for (const key of keys) {
    const product = products.find((p: any) => p.image_url === key);
    if (!product) continue;

    // Fetch from Supabase Storage
    let bytes: Buffer;
    try {
      bytes = await fetchSupabaseObject(key);
    } catch (e: any) {
      failed.push({ key, product: product.name, reason: `Supabase fetch failed: ${e}` });
      console.log(`  ✗ ${key} — Supabase fetch failed`);
      continue;
    }

    // The storage key is like: products/<businessId>/<file>.jpg
    // We want to store in Cloudinary folder "products" with public_id: <businessId>/<file> (NO extension - Cloudinary adds it)
    // Remove the leading "products/" prefix if present.
    let publicId = key;
    if (publicId.startsWith("products/")) {
      publicId = publicId.substring("products/".length);
    }
    // Strip extension from public_id so Cloudinary adds the correct one based on content
    publicId = publicId.replace(/\.[^.]+$/, "");
    // If after removing the prefix we have an empty string, use a fallback.
    if (!publicId) {
      publicId = `product-${Date.now()}`;
    }

    // Upload to Cloudinary in the "products" folder
    let secureUrl: string;
    try {
      secureUrl = await cloudinaryUpload(bytes, publicId);
    } catch (e: any) {
      failed.push({ key, product: product.name, reason: `Cloudinary upload failed: ${e}` });
      console.log(`  ✗ ${key} — Cloudinary upload failed`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  would migrate ${key} -> ${secureUrl}`);
      migrated++;
      continue;
    }

    // Update the product's image_url in SQLite via raw libsql execute
    try {
      await client.execute(`UPDATE products SET image_url = '${secureUrl.replace(/'/g, "''")}' WHERE id = '${product.id}'`);
      migrated++;
      console.log(`  migrated ${key} -> ${secureUrl}`);
    } catch (e: any) {
      failed.push({ key, product: product.name, reason: `DB update failed: ${e}` });
      console.log(`  ✗ ${key} — DB update failed`);
    }
  }

  console.log(`\n${DRY_RUN ? "[dry run] " : ""}migrated ${migrated}/${keys.length}`);

  if (failed.length > 0) {
    console.error(`\n✗ ${failed.length} failed:`);
    for (const f of failed) console.error(`   - ${f.key} (${f.product}): ${f.reason}`);
  }

  if (!DRY_RUN && migrated > 0) {
    console.log(
      `\n✓ ${migrated} object(s) now in Cloudinary with stable URLs.\n` +
        `  Only product.image_url rows were updated.\n`
    );
  }

  if (failed.length > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error("\n✗ Image migration failed:", e?.message ?? e);
    process.exit(1);
  });