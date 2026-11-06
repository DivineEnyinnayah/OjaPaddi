import { Hono } from "hono";
import { getImage } from "../services/storageService";
import type { HonoEnv } from "../types";

/**
 * Public, unauthenticated binary image endpoint.
 *
 * `<Image>` renderers load `/v1/images/:id` directly; rows are immutable
 * (replace-by-upload), so responses are cacheable forever.
 */
export const imageRoutes = new Hono<HonoEnv>();

imageRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return c.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid image id" } },
      400
    );
  }

  const db = c.get("db");
  const image = await getImage(db, id);
  if (!image) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Image not found" } },
      404
    );
  }

  const bytes =
    image.data instanceof Buffer ? new Uint8Array(image.data) : new Uint8Array(image.data);

  return c.body(bytes, 200, {
    "Content-Type": image.contentType,
    "Content-Length": String(image.byteSize),
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
});
