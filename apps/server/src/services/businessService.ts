import type { Database } from "@ojapaddi/db";
import { businesses } from "@ojapaddi/db/schema";
import { eq } from "drizzle-orm";

export async function getBusinessByUserId(db: Database, businessId: string) {
  const businessList = await db.select().from(businesses).where(eq(businesses.id, businessId));
  return businessList[0] || null;
}

export async function getBusinessBySlug(db: Database, slug: string) {
  const businessList = await db.select().from(businesses).where(eq(businesses.slug, slug));
  return businessList[0] || null;
}

export async function updateBusiness(db: Database, businessId: string, data: Partial<typeof businesses.$inferSelect>) {
  const businessList = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const business = businessList[0];

  if (!business) {
    throw new Error("Business not found");
  }

  await db.update(businesses)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      category: data.category,
      logoUrl: data.logoUrl,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      currency: data.currency,
      whatsappNumber: data.whatsappNumber,
      isPublished: data.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  return await getBusinessByUserId(db, businessId);
}

export async function softDeleteBusiness(db: Database, businessId: string) {
  await db.update(businesses)
    .set({
      deletedAt: new Date(),
      isPublished: false,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));
}
