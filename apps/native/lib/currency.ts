/**
 * Formats a number or numeric string as Nigerian Naira (₦).
 * Always displays exactly 2 decimal places with thousands separators.
 *
 * @example formatCurrency(1000)     → "₦1,000.00"
 * @example formatCurrency("2500.5") → "₦2,500.50"
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₦0.00";
  return `₦${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
