import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { createDb } from "@ojapaddi/db";
import { businesses } from "@ojapaddi/db/schema";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { HonoEnv } from "../types";

const businessRoutes = new Hono<HonoEnv>();

businessRoutes.use("/*", authMiddleware);

businessRoutes.get("/", async (c) => {
  const user = c.get("user");
  const db = createDb();
  
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
  });

  if (!business) {
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "Business not found" } }, 404);
  }

  return c.json({ success: true, data: business });
});

businessRoutes.put(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().min(1),
      phone: z.string().min(1),
      whatsappNumber: z.string().optional(),
      address: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
    })
  ),
  async (c) => {
    const user = c.get("user");
    const data = c.req.valid("json");
    const db = createDb();

    let business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
    });

    if (business) {
      await db.update(businesses).set(data).where(eq(businesses.id, business.id));
      business = { ...business, ...data };
    } else {
      const [newBusiness] = await db.insert(businesses).values({
        ...data,
        userId: user.id,
      }).returning();
      business = newBusiness;
    }

    if (!business) {
      return c.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to save business" } }, 500);
    }

    return c.json({ success: true, data: business });
  }
);

export default businessRoutes;
