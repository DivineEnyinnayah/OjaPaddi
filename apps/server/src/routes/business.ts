import { Hono } from "hono";
import { getBusinessByUserId, updateBusiness } from "../services/businessService";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { uploadFile, validateImageFile, getPublicUrl } from "../services/storageService";
import { validate } from "../middleware/validate";
import { UpdateBusinessSchema } from "../validators/business";
import { UpdateStorefrontSettingsSchema, SlugSchema } from "../validators/slug";

export const businessRoutes = new Hono<AuthContext>();

businessRoutes.use("*", authMiddleware);

businessRoutes.get("/", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const business = await getBusinessByUserId(db, businessId);
    return c.json({ success: true, data: business }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "BUSINESS_FETCH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

businessRoutes.put("/", validate(UpdateBusinessSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const body = c.get("validatedBody");
    const business = await updateBusiness(db, businessId, body);
    return c.json({ success: true, data: business }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "BUSINESS_UPDATE_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

businessRoutes.put("/storefront", validate(UpdateStorefrontSettingsSchema), async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const body = c.get("validatedBody");
    const business = await updateBusiness(db, businessId, body);
    return c.json({ success: true, data: business }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "STOREFRONT_UPDATE_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

businessRoutes.get("/storefront/slug-available/:slug", async (c) => {
  try {
    const db = c.get("db");
    const slug = c.req.param("slug");
    
    // Validate slug format first
    const validation = SlugSchema.safeParse(slug);
    if (!validation.success) {
      return c.json({ success: true, data: { available: false, reason: "invalid_format" } }, 200);
    }
    
    // Check if slug is taken by another business
    const { businesses } = await import("@ojapaddi/db/schema");
    const { eq, and, isNull } = await import("drizzle-orm");
    const existing = await db.select({ id: businesses.id }).from(businesses).where(and(eq(businesses.slug, slug), isNull(businesses.deletedAt)));

        const available = existing.length === 0 || existing[0]?.id === c.get("businessId");

        return c.json({ success: true, data: { available } }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "SLUG_CHECK_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

businessRoutes.post("/logo", async (c) => {
  try {
    const db = c.get("db");
    const businessId = c.get("businessId");
    const body = await c.req.parseBody();
    const file = body.logo as File;

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Logo image file is required" } }, 400);
    }

    validateImageFile(file);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type;

    const filename = `logo-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = `business/${businessId}/${filename}`;

    await uploadFile("logos", filePath, buffer, contentType);
    const logoUrl = await getPublicUrl("logos", filePath);

    await updateBusiness(db, businessId, { logoUrl } as Record<string, unknown>);

    return c.json({ success: true, data: { logoUrl } }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "LOGO_UPLOAD_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});
