import { sqliteTable, text, integer, blob, index } from "drizzle-orm/sqlite-core";
import { businesses } from "./businesses";

/**
 * Image bytes stored directly in Turso/libSQL.
 *
 * Serving these through `GET /v1/images/:id` keeps product and business
 * profile images self-contained in the database — no external object store
 * or signed URLs. Values are pre-shrunk client-side (max 800px, JPEG) so
 * rows stay small; the server re-validates type and size.
 */
export const images = sqliteTable(
  "images",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["product", "business_logo"] }).notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    data: blob("data", { mode: "buffer" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("images_business_id_idx").on(table.businessId)]
);
