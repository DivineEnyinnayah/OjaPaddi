import { Linking, Platform } from 'react-native';
import type { Sale } from '@/hooks/useSales';
import type { Product } from '@/hooks/useProducts';

const STORE_URL = 'store.ojapaddi.com';

export function buildReceiptMessage(sale: Sale, businessName?: string): string {
  const lines: string[] = [];
  lines.push(`\uD83E\uDDFE *Receipt${businessName ? ` - ${businessName}` : ''}*`);
  lines.push('');

  for (const item of sale.items) {
    lines.push(`\u2022 ${item.productName}`);
    lines.push(
      `  ${item.quantity} \u00D7 ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}`
    );
  }

  lines.push('');
  lines.push(`\uD83D\uDCCA *Total: ${formatCurrency(sale.total)}*`);

  if (parseFloat(sale.discount) > 0) {
    lines.push(`Discount: -${formatCurrency(sale.discount)}`);
  }

  if (sale.amountPaid) {
    lines.push(`Amount Paid: ${formatCurrency(sale.amountPaid)}`);
  }

  lines.push('');
  lines.push('Thank you for your patronage!');

  return lines.join('\n');
}

export function buildProductShareMessage(product: Product): string {
  const price = parseFloat(product.price);
  return `*${product.name}* 🛍️\nPrice: ₦${price.toLocaleString()}\n\nTap to view & order 👇\n${STORE_URL}/${product.id}`;
}

export function buildProductShareMessageWithSlug(product: Product, businessSlug: string): string {
  const price = parseFloat(product.price);
  return `*${product.name}* 🛍️\nPrice: ₦${price.toLocaleString()}\n\nTap to view & order 👇\n${STORE_URL}/${businessSlug}/${product.id}`;
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₦${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function shareViaWhatsApp(message: string): Promise<void> {
  const encoded = encodeURIComponent(message);
  const url = `whatsapp://send?text=${encoded}`;
  const fallbackUrl = `https://wa.me/?text=${encoded}`;

  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    await Linking.openURL(fallbackUrl);
  }
}
