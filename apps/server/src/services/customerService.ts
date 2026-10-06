import type { Database } from "@ojapaddi/db";
import { customers } from "@ojapaddi/db/schema";
import { eq, and, like, sql } from "drizzle-orm";

export async function getCustomers(db: Database, businessId: string, query: {
  page?: number;
  limit?: number;
  search?: string;
  customerType?: "individual" | "supermarket";
}) {
  const { page = 1, limit = 20, search, customerType } = query;
  const offset = (page - 1) * limit;

  let filters = [eq(customers.businessId, businessId)];

  if (search) {
    filters.push(like(customers.name, `%${search}%`));
  }
  if (customerType) {
    filters.push(eq(customers.customerType, customerType));
  }

  const result = await db.select().from(customers).where(and(...filters)).limit(limit).offset(offset).orderBy(sql`${customers.createdAt} DESC`);
  const total = await db.select({ count: sql<number>`count(*)` }).from(customers).where(and(...filters));

  return {
    customers: result,
    pagination: {
      total: Number(total[0]?.count ?? 0),
      page,
      limit,
    },
  };
}

export async function createCustomer(db: Database, businessId: string, data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  customerType?: "individual" | "supermarket";
  expectedPaymentPeriodDays?: number;
  suppliedProductIds?: string[];
}) {
  if (data.phone) {
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.businessId, businessId), eq(customers.phone, data.phone)));

    if (existing.length > 0) {
      const err = new Error("A customer with this phone number already exists");
      (err as any).code = "CONFLICT";
      throw err;
    }
  }

  const [newCustomer] = await db.insert(customers).values({
    businessId,
    customerType: data.customerType || "individual",
    ...data,
  }).returning();
  return newCustomer;
}

export async function getCustomerById(db: Database, businessId: string, customerId: string) {
  const customerList = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)));
  const customer = customerList[0];

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
}

export async function updateCustomer(db: Database, businessId: string, customerId: string, data: Partial<typeof customers.$inferSelect>) {
  const customerList = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)));
  const customer = customerList[0];

  if (!customer) {
    throw new Error("Customer not found");
  }

  await db.update(customers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));

  return await getCustomerById(db, businessId, customerId);
}

export async function deleteCustomer(db: Database, businessId: string, customerId: string) {
  const customerList = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)));
  const customer = customerList[0];

  if (!customer) {
    throw new Error("Customer not found");
  }

  await db.delete(customers).where(eq(customers.id, customerId));

  return true;
}
