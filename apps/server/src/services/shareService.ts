import type { Database } from "@ojapaddi/db";
import { sales, saleItems, products, businesses } from "@ojapaddi/db/schema";
import { eq, and } from "drizzle-orm";

export async function getReceiptShareData(db: Database, saleId: string, businessId: string) {
  const saleList = await db.select().from(sales).where(and(eq(sales.id, saleId), eq(sales.businessId, businessId)));
  const sale = saleList[0];

  if (!sale) {
    throw new Error("Sale not found");
  }

  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));

  return {
    reference: sale.reference,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    items,
    soldAt: sale.soldAt,
  };
}

export async function getProductShareData(db: Database, productId: string, businessId: string) {
  const productList = await db.select().from(products).where(and(eq(products.id, productId), eq(products.businessId, businessId)));
  const product = productList[0];

  if (!product) {
    throw new Error("Product not found");
  }

  const businessList = await db.select().from(businesses).where(eq(businesses.id, product.businessId));
  const business = businessList[0];

  return {
    product,
    business,
  };
}
