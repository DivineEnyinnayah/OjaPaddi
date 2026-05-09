import { db } from "@ojapaddi/db";
import { businesses } from "@ojapaddi/db/schema";
import { eq } from "drizzle-orm";

export async function getBusinessByUserId(userId: string) {
  const businessList = await db.select().from(businesses).where(eq(businesses.userId, userId));
  return businessList[0] || null;
}

export async function updateBusiness(userId: string, data: Partial<typeof businesses.$inferSelect>) {
  const businessList = await db.select().from(businesses).where(eq(businesses.userId, userId));
  const business = businessList[0];

  if (!business) {
    throw new Error("Business not found");
  }

  // In a real app, we would validate the data and only update allowed fields.
  // For now, we'll just update everything provided.
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
    .where(eq(businesses.id, business.id));

  return await getBusinessByUserId(userId);
}
