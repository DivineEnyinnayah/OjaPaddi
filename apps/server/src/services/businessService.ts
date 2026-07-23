import type { Database } from "@ojapaddi/db";
import { businesses } from "@ojapaddi/db/schema";
import { eq } from "drizzle-orm";

export async function getBusinessByUserId(db: Database, businessId: string) {
  const businessList = await db.select().from(businesses).where(eq(businesses.id, businessId));
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
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  return await getBusinessByUserId(db, businessId);
}
