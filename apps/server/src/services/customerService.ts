import { db } from "@ojapaddi/db";
import { customers } from "@ojapaddi/db/schema";
import { eq, and, like, sql } from "drizzle-orm";

export async function getCustomers(businessId: string, query: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { page = 1, limit = 20, search } = query;
  const offset = (page - 1) * limit;

  let filters = [eq(customers.businessId, businessId)];

  if (search) {
    filters.push(like(customers.name, `%${search}%`));
  }

  const result = await db.select().from(customers).where(and(...filters)).limit(limit).offset(offset);
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

export async function createCustomer(businessId: string, data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  const [newCustomer] = await db.insert(customers).values({
    businessId,
    ...data,
  }).returning();
  return newCustomer;
}

export async function getCustomerById(businessId: string, customerId: string) {
  const customerList = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)));
  const customer = customerList[0];

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
}

export async function updateCustomer(businessId: string, customerId: string, data: Partial<typeof customers.$inferSelect>) {
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

  return await getCustomerById(businessId, customerId);
}

export async function deleteCustomer(businessId: string, customerId: string) {
  const customerList = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)));
  const customer = customerList[0];

  if (!customer) {
    throw new Error("Customer not found");
  }

  await db.delete(customers).where(eq(customers.id, customerId));

  return true;
}
