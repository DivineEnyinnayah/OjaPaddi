import { Linking, Platform } from 'react-native';
import type { Sale } from '@/hooks/useSales';
import type { Product } from '@/hooks/useProducts';

const STORE_URL = 'store.ojapaddi.com';

export function buildReceiptMessage(sale: Sale, businessName?: string): string {
  const lines: string[] = [];
  const isSupermarket = sale.orderType === 'supermarket';

  lines.push(isSupermarket ? `📋 *INVOICE / SUPPLY NOTE${businessName ? ` - ${businessName}` : ''}*` : `🧾 *Receipt${businessName ? ` - ${businessName}` : ''}*`);
  lines.push(`Ref: ${sale.reference}`);
  if (isSupermarket && sale.expectedPaymentDate) {
    lines.push(`Due Date: ${new Date(sale.expectedPaymentDate).toLocaleDateString()}`);
  }
  lines.push('');

  for (const item of sale.items) {
    const ret = item.returnedQuantity || 0;
    const netQty = item.quantity - ret;
    lines.push(`• ${item.productName}`);
    if (ret > 0) {
      lines.push(
        `  Supplied: ${item.quantity} | Returned: ${ret} | Net: ${netQty} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(netQty * item.unitPrice)}`
      );
    } else {
      lines.push(
        `  ${item.quantity} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}`
      );
    }
  }

  lines.push('');
  if (parseFloat(sale.returnedAmount || '0') > 0) {
    lines.push(`Returned Value: -${formatCurrency(sale.returnedAmount || '0')}`);
  }
  lines.push(`📊 *Net Total: ${formatCurrency(sale.total)}*`);

  if (parseFloat(sale.discount) > 0) {
    lines.push(`Discount: -${formatCurrency(sale.discount)}`);
  }

  if (sale.amountPaid) {
    lines.push(`Amount Paid: ${formatCurrency(sale.amountPaid)}`);
    const balance = parseFloat(sale.total) - parseFloat(sale.amountPaid);
    if (balance > 0) {
      lines.push(`Balance Due: ${formatCurrency(balance)}`);
    }
  }

  lines.push('');
  lines.push(isSupermarket ? 'Thank you for your business!' : 'Thank you for your patronage!');

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
