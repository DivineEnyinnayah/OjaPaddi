import { db } from "@ojapaddi/db";
import { sales, saleItems, products, businesses } from "@ojapaddi/db/schema";
import { eq } from "drizzle-orm";

export async function getReceiptShareData(saleId: string) {
  const saleList = await db.select().from(sales).where(eq(sales.id, saleId));
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

export async function getProductShareData(productId: string) {
  const productList = await db.select().from(products).where(eq(products.id, productId));
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
